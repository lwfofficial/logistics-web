from django.db import transaction as dbtransaction
from threading import Thread

from datetime import datetime

import requests
from django.conf import settings
from django.core.paginator import Paginator
from django.contrib.auth.models import User
from requests.auth import HTTPBasicAuth
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.datetime_safe import strftime

from core.models import Currency, Profile, Configuration, Notification
from transactions.models import Transaction, CryptoCurrencyAddress, WalletToCCA, Wallet, WithdrawTransaction, WithdrawRequest, TransactionPaypal, TransactionInfo
from transactions.serializers import TransactionSerializer, WithdrawTransactionSerializer, TransactionPaypalSerializer

from transactions.manager import TransactionManager
from debugapp.middleware import p_ex


@api_view(['POST'])
def getDepositTransactions(request):
    user = request.user
    order = request.data.get('order')
    if order == 'desc':
        order = ''
    else:
        order = '-'
    sort = "%s%s" % (order, request.data.get('sort'))
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        profile = Profile.objects.get(user=user)
        transactions = Transaction.objects.filter(wallet__profile=profile, transactionpaypal__isnull=True).order_by(sort)
        paginator = Paginator(transactions, maxPerPage)
        transactions = TransactionSerializer(paginator.page(page), many=True, context={'request': request})
        return Response({'success': True, 'transactions': transactions.data, 'transactionsCount': paginator.count})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['POST'])
def getDepositPayPalTransactions(request):
    user = request.user
    order = request.data.get('order')
    if order == 'desc':
        order = ''
    else:
        order = '-'
    sort = "%s%s" % (order, request.data.get('sort'))
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        profile = Profile.objects.get(user=user)
        transactions = TransactionPaypal.objects.filter(wallet__profile=profile).order_by(sort)
        paginator = Paginator(transactions, maxPerPage)
        transactions = TransactionPaypalSerializer(paginator.page(page), many=True, context={'request': request})
        return Response({'success': True, 'transactions': transactions.data, 'transactionsCount': paginator.count})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['POST'])
def getWithdrawTransactions(request):
    user = request.user
    order = request.data.get('order')
    if order == 'desc':
        order = ''
    else:
        order = '-'
    sort = "%s%s" % (order, request.data.get('sort'))
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        profile = Profile.objects.get(user=user)
        transactions = WithdrawTransaction.objects.filter(user=profile.user).order_by(sort)
        paginator = Paginator(transactions, maxPerPage)
        transactions = WithdrawTransactionSerializer(paginator.page(page), many=True, context={'request': request})
        return Response({'success': True, 'transactions': transactions.data, 'transactionsCount': paginator.count})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['POST'])
def getAddress(request):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        currency = request.data.get('currency')
        wallet = Wallet.objects.get(
            profile=profile
        )

        walletToCcAddresses = wallet.getWalletToCcAddresses(currency)

        # search previous assigned address
        wtcca = None
        if len(walletToCcAddresses) > 0:
            for a in walletToCcAddresses:
                if a.address.currency == currency:
                    wtcca = a
                    break

        if not wtcca:

            #find new free address
            newAddress = None

            ccAddresses = CryptoCurrencyAddress.objects.filter(
                currency=currency,
            )
            for cca in ccAddresses:
                check = WalletToCCA.objects.filter(
                    address__address__iexact=cca.address,
                    address__currency__iexact=currency
                )
                if len(check) == 0:
                    #free address found
                    newAddress = cca
                    break

            if newAddress:
                wtcca = WalletToCCA()
                wtcca.wallet = wallet
                wtcca.address = newAddress
                wtcca.save()
                return Response({'success': True, 'address': wtcca.address.address})
            else:
                return Response({'success': False, 'error': 'address.nonew'})
        return Response({'success': True, 'address': wtcca.address.address})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Wallet.DoesNotExist:
        return Response({'success': False, 'error': 'wallet.notfound'})


@api_view(['POST'])
def deposit(request):
    user = request.user
    amount = request.data.get('amount')
    try:
        profile = Profile.objects.get(user=user)
        wallet = Wallet.objects.get(profile=profile)
        if amount > wallet.credit:
            return Response({'success': False, 'error': 'credit.insufficient'})
        TransactionManager.createDepositCautionTransaction(
            amount,
            wallet.id
        )
        return Response({'success': True})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Wallet.DoesNotExist:
        return Response({'success': False, 'error': 'wallet.notfound'})


@api_view(['POST'])
def depositPaypal(request):
    user = request.user
    paymentId = request.data.get('paymentId')
    payerId = request.data.get('payerId')
    # print(payerId)
    try:
        profile = Profile.objects.get(user=user)
        wallet = Wallet.objects.get(profile=profile)
        previousCredit = wallet.credit

        authUrl = settings.PAYPAL_GET_AUTH_TOKEN_ENDPOINT
        headers = {
            'Accept': 'application/json',
        }
        authResponse = requests.post(
            authUrl,
            headers=headers,
            data={'grant_type': 'client_credentials'},
            auth=HTTPBasicAuth(settings.PAYPAL_MERCHANT_ID, settings.PAYPAL_SECRET)
        ).json()

        print(authResponse['access_token'])

        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer %s' % authResponse['access_token']
        }
        paymentUrl = settings.PAYPAL_PAYMENT_DETAILS_ENDPOINT % paymentId
        paymentResponse = requests.get(paymentUrl, headers=headers).json()

        # print(paymentResponse)
        if 'error' in paymentResponse.keys():
            return Response({'success': False, 'error': paymentResponse['error_description']})

        if 'state' in paymentResponse.keys() and paymentResponse['state'] == 'approved':
            paypalTransaction = paymentResponse['transactions'][0]
            amount = float(paypalTransaction['amount']['total'])
            currency = paypalTransaction['amount']['currency']
            transaction = TransactionPaypal()
            transaction.hash = paymentResponse['id']
            transaction.date = paymentResponse['create_time']
            transaction.type = 'deposit'
            transaction.currency = currency
            transaction.amount = amount
            transaction.wallet = wallet
            feePercentage = Configuration().getConfiguration(
                "paypal_deposit_percentage"
            )
            freezedCurrency = Currency().getCurrency('PPBC')
            if currency == 'USD':
                pass
            elif currency == 'EUR':
                amount = (amount / freezedCurrency.eur)
            else:
                return Response({
                    'success': False,
                    'error': 'currency.notavailable',
                    'message': 'deposit of %s in %s not available' % (
                        amount,
                        currency
                    )
                })
            transaction.paymentId = paymentId
            transaction.save()
            wallet.depositIn(
                freezedCurrency,
                transaction,
                amount,
                'Paypal transaction found ID: %s with positive amount: %s (USD)' % (
                    paymentId,
                    amount
                ),
                feePercentage,
            )
            #all good
            # create transactions info for paypal
            transactionInfo = TransactionInfo()
            transactionInfo.transaction = transaction
            transactionInfo.description = 'Currency Rate Date: %s' % strftime(
                freezedCurrency.dateUpdated,
                '%Y-%m-%d %H:%M:%S'
            )
            transactionInfo.save()

            transactionInfo = TransactionInfo()
            transactionInfo.transaction = transaction
            transactionInfo.description = 'BC -> USD'
            transactionInfo.cost = freezedCurrency.usd
            transactionInfo.save()

            transactionInfo = TransactionInfo()
            transactionInfo.transaction = transaction
            transactionInfo.description = 'BC -> EUR'
            transactionInfo.cost = freezedCurrency.eur
            transactionInfo.save()

            transactionInfo = TransactionInfo()
            transactionInfo.transaction = transaction
            transactionInfo.description = 'Previous Credit'
            transactionInfo.cost = previousCredit
            transactionInfo.save()

            transactionInfo = TransactionInfo()
            profile = Profile.objects.get(user=user)
            wallet = Wallet.objects.get(profile=profile)
            transactionInfo.transaction = transaction
            transactionInfo.description = 'Current Credit'
            transactionInfo.cost = wallet.credit
            transactionInfo.save()

            return Response({'success': True})

        return Response({'success': False})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Wallet.DoesNotExist:
        return Response({'success': False, 'error': 'wallet.notfound'})


@api_view(['POST'])
def withdraw(request):
    """
    Request Withdraw from wallet.
    """
    try:
        user = request.user
        currency = request.data.get('currency')
        amount = float(request.data.get('amount'))
        ccAddress = request.data.get('address')
        freezedCurrency = Currency().getCurrency(currency)
        if not freezedCurrency:
            return Response({'success': False, 'error': 'currency.notvalid'})
        cryptoAmount = amount / freezedCurrency.usd

        #create withdrawrequest
        withdrawRequest = WithdrawRequest()
        withdrawRequest.user = user
        withdrawRequest.requestedCurrency = currency
        withdrawRequest.requestedAmount = amount
        withdrawRequest.requestedCcAddress = ccAddress
        withdrawRequest.freezedUsd = freezedCurrency.usd
        withdrawRequest.freezedEur = freezedCurrency.eur
        withdrawRequest.save()

        #create notification
        protocol = 'http'
        if settings.FRONTEND_SSL:
            protocol = 'https'
        confirmationLink = "%s://%s:%s/withdrawConfirm/%s" % (
            protocol,
            settings.FRONTEND_HOST,
            settings.FRONTEND_PORT,
            str(withdrawRequest.hash)
        )
        notification = Notification()
        notification.email = True
        notification.user = user
        notification.setEmailData(
            "Withdraw request comfirm",
            "notifications/email/withdraw_request_confirm_email.html",
            {
                'user': user,
                'confirmation_link': confirmationLink,
                'currency': currency,
                'amount': amount,
                'cryptoAmount': cryptoAmount,
                'freezedUsd': freezedCurrency.usd,
                'freezedEur': freezedCurrency.eur
            }
        )

        withdrawRequest.notification = notification
        withdrawRequest.save()

        return Response({'success': True})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Wallet.DoesNotExist:
        return Response({'success': False, 'error': 'wallet.notfound'})


@api_view(['POST'])
@dbtransaction.atomic
def withdrawConfirm(request):
    """
    Confirm Withdraw request
    """
    hash = request.data.get('hashKey')
    try:
        withdrawRequest = WithdrawRequest.objects.get(
            hash=hash,
            confirmed=False
        )
    except Exception, ex:
        return Response({'success': False, 'error': 'withdrawRequest.notfound'})

    try:
        profile = Profile.objects.get(user=withdrawRequest.user)
        wallet = Wallet.objects.get(profile=profile)
        freezedCurrency = Currency().getCurrency(withdrawRequest.requestedCurrency)

        # NOW SET REAL USD/EUR VALUES WHEN WITHDRAW WAS REQUESTED!!!
        freezedCurrency.usd = withdrawRequest.freezedUsd
        freezedCurrency.eur = withdrawRequest.freezedEur

        if withdrawRequest.requestedAmount > wallet.credit:
            return Response({'success': False, 'error': 'credit.insufficient'})

        # CREATE TRANSACTION
        withdrawTransaction = TransactionManager.createWithdrawTransaction(
            withdrawRequest.requestedAmount,
            wallet.id,
            freezedCurrency,
            withdrawRequest.requestedCcAddress
        )

        withdrawRequest.transaction = withdrawTransaction
        withdrawRequest.confirmed = True
        withdrawRequest.save()

        adminNotification = Notification()
        adminNotification.email = True
        adminNotification.user = User.objects.get(
            username="admin"
        )
        adminNotification.setEmailData(
            "New withdraw request confirmed",
            "notifications/email/admin_email_withdraw_request_confirmed.html",
            {
                'user': withdrawRequest.user,
                'hash': hash,
                'withdrawRequest': withdrawRequest
            }
        )
        try:
            Thread(target=adminNotification.process, args=(), kwargs={}).start()
        except Exception, ex:
            pass

        return Response({'success': True})
    except Exception, ex:
        p_ex(
            request,
            ex,
            3,
            1,
            'Failed to confirm withdraw request hash: %s' % (hash)
        )
        return Response({'success': False, 'error': 'withdrawRequest.genericerror'})

