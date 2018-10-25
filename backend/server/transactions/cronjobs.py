import django
import traceback
import datetime

from rest_framework.decorators import api_view
from rest_framework.response import Response

from django.contrib.auth.models import User
from django.utils.datetime_safe import strftime
from django.conf import settings

from transactions.models import Transaction, TransactionsProcess, Wallet, TransactionInfo
from transactions.atm import AtmBtc, AtmLwf
from transactions.cm import CurrencyManager
from core.models import Notification, Currency, Configuration
from debugapp.middleware import p_ex


def processBtcTransactions(FreezedCurrency):
    r = {
        "processed_addresses": 0,
        "created_transactions": [],
        "errors_transactions": [],
        "errors_addresses": []
    }

    allWallets = Wallet.objects.filter()

    for wallet in allWallets:

        for btcAddress in wallet.getWalletToCcAddresses(currency='BTC'):
            r['processed_addresses'] += 1
            atm = AtmBtc(btcAddress.address.address)
            btcAddress.address.address = atm.clean(btcAddress.address.address)
            try:
                addressRemoteTransactions = atm.getTransactions()
            except Exception, ex:
                addressRemoteTransactions = []
                r['errors_addresses'].append(
                    "%s" % (traceback.format_exc())
                )

            if len(addressRemoteTransactions) > 0:
                for art in addressRemoteTransactions:
                    if art.get("error"):
                        r['errors_addresses'].append(
                            "failed get data for address: %s" % (
                                btcAddress.address.address
                            )
                        )
                    else:
                        if art['positive'] and art['confirmations'] > 0:

                            try:
                                new = False
                                try:
                                    transaction = Transaction.objects.get(
                                        hash=art['hash'],
                                        currency="BTC",
                                        address=btcAddress.address
                                    )
                                except Transaction.DoesNotExist:
                                    previousCredit = wallet.credit
                                    transaction = Transaction()
                                    transaction.hash = art['hash']
                                    transaction.date = art['date']
                                    transaction.type = 'deposit'
                                    transaction.currency = 'BTC'
                                    transaction.freezedUsd = FreezedCurrency.usd
                                    transaction.freezedEur = FreezedCurrency.eur
                                    transaction.amount = art['value']
                                    transaction.wallet = wallet
                                    transaction.address = btcAddress.address
                                    transaction.save()

                                    # update wallet credit
                                    feePercentage = Configuration().getConfiguration(
                                        "btc_deposit_percentage"
                                    )
                                    wallet.depositIn(
                                        FreezedCurrency,
                                        transaction,
                                        art['value'],
                                        'by AtmBtc found new tx: %s with positive amount: %s (BTC)' % (
                                            art['hash'],
                                            art['value']
                                        ),
                                        feePercentage
                                    )
                                    new = True

                                    #all good
                                    # create transactions info btc
                                    transactionInfo = TransactionInfo()
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'Currency Rate Date: %s' % strftime(
                                        FreezedCurrency.dateUpdated,
                                        '%Y-%m-%d %H:%M:%S'
                                    )
                                    transactionInfo.save()

                                    transactionInfo = TransactionInfo()
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'BTC -> USD'
                                    transactionInfo.cost = FreezedCurrency.usd
                                    transactionInfo.save()

                                    transactionInfo = TransactionInfo()
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'BTC -> EUR'
                                    transactionInfo.cost = FreezedCurrency.eur
                                    transactionInfo.save()

                                    transactionInfo = TransactionInfo()
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'Previous Credit'
                                    transactionInfo.cost = previousCredit
                                    transactionInfo.save()

                                    transactionInfo = TransactionInfo()
                                    wallet = Wallet.objects.get(id=wallet.id)
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'Current Credit'
                                    transactionInfo.cost = wallet.credit
                                    transactionInfo.save()

                            except Exception, ex:
                                transaction = None

                                r['errors_transactions'].append(
                                    "failed insert for transaction: %s" % (
                                        art['hash']
                                    )
                                )

                            if new:
                                if transaction:
                                    if not any(x.hash == art['hash'] for x in r['created_transactions']):
                                        r['created_transactions'].append(transaction)
                                        # Admin Notification
                                        adminNotification = Notification()
                                        adminNotification.email = True
                                        adminNotification.user = User.objects.get(
                                            username="admin"
                                        )
                                        adminNotification.setEmailData(
                                            "New BTC deposit transaction confirmed",
                                            "notifications/email/admin_email_new_deposit_transaction_confirmed.html",
                                            {
                                                'transaction': transaction,
                                            }
                                        )
    return r

def processLwfTransactions(FreezedCurrency):
    r = {
        "processed_addresses": 0,
        "created_transactions": [],
        "errors_transactions": [],
        "errors_addresses": []
    }

    allWallets = Wallet.objects.filter()

    for wallet in allWallets:

        for lwfAddress in wallet.getWalletToCcAddresses(currency='LWF'):
            r['processed_addresses'] += 1
            atm = AtmLwf(lwfAddress.address.address)
            lwfAddress.address.address = atm.clean(lwfAddress.address.address)
            try:
                addressRemoteTransactions = atm.getTransactions()
            except Exception, ex:
                addressRemoteTransactions = []
                r['errors_addresses'].append(
                    "%s" % (traceback.format_exc())
                )
            count = 0
            if len(addressRemoteTransactions) > 0:
                for art in addressRemoteTransactions:
                    if art.get("error"):
                        r['errors_addresses'].append(
                            "failed get data for address: %s" % (
                                lwfAddress.address.address
                            )
                        )
                    else:
                        if art['positive'] and art['confirmations'] > 0:

                            try:
                                new = False
                                try:
                                    transaction = Transaction.objects.get(
                                        hash=art['hash'],
                                        currency="LWF",
                                        address=lwfAddress.address
                                    )
                                except Transaction.DoesNotExist:
                                    previousCredit = wallet.credit
                                    transaction = Transaction()
                                    transaction.hash = art['hash']
                                    transaction.date = art['date']
                                    transaction.type = 'deposit'
                                    transaction.currency = 'LWF'
                                    transaction.freezedUsd = FreezedCurrency.usd
                                    transaction.freezedEur = FreezedCurrency.eur
                                    transaction.amount = art['value']
                                    transaction.wallet = wallet
                                    transaction.address = lwfAddress.address
                                    transaction.save()

                                    # update wallet credit
                                    feePercentage = Configuration().getConfiguration(
                                        "lwf_deposit_percentage"
                                    )
                                    wallet.depositIn(
                                        FreezedCurrency,
                                        transaction,
                                        art['value'],
                                       'by AtmLwf found new tx: %s with positive amount: %s (LWF)' % (
                                            art['hash'],
                                            art['value']
                                        ),
                                        feePercentage
                                    )
                                    new = True

                                    #all good
                                    # create transactions info btc
                                    transactionInfo = TransactionInfo()
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'Currency Rate Date: %s' % strftime(
                                        FreezedCurrency.dateUpdated,
                                        '%Y-%m-%d %H:%M:%S'
                                    )
                                    transactionInfo.save()

                                    transactionInfo = TransactionInfo()
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'LWF -> USD'
                                    transactionInfo.cost = FreezedCurrency.usd
                                    transactionInfo.save()

                                    transactionInfo = TransactionInfo()
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'LWF -> EUR'
                                    transactionInfo.cost = FreezedCurrency.eur
                                    transactionInfo.save()

                                    transactionInfo = TransactionInfo()
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'Previous Credit'
                                    transactionInfo.cost = previousCredit
                                    transactionInfo.save()

                                    transactionInfo = TransactionInfo()
                                    wallet = Wallet.objects.get(id=wallet.id)
                                    transactionInfo.transaction = transaction
                                    transactionInfo.description = 'Current Credit'
                                    transactionInfo.cost = wallet.credit
                                    transactionInfo.save()

                            except Exception, ex:
                                transaction = None

                                r['errors_transactions'].append(
                                    "failed insert for transaction: %s" % (
                                        art['hash']
                                    )
                                )

                            if new:
                                if transaction:
                                    if not any(x.hash == art['hash'] for x in r['created_transactions']):
                                        r['created_transactions'].append(transaction)
                                        # Admin Notification
                                        adminNotification = Notification()
                                        adminNotification.email = True
                                        adminNotification.user = User.objects.get(
                                            username="admin"
                                        )
                                        adminNotification.setEmailData(
                                            "New LWF deposit transaction confirmed",
                                            "notifications/email/admin_email_new_deposit_transaction_confirmed.html",
                                            {
                                                'transaction': transaction,
                                            }
                                        )

    return r


@api_view(['GET'])
def processTransactions(request):
    # FREEZE CURRENCIES VALUES
    Cm = Currency()
    btcFreezedCurrency = Cm.getCurrency("BTC")
    lwfFreezedCurrency = Cm.getCurrency("LWF")

    #lwfProcess = processLwfTransactions(lwfFreezedCurrency)

    r = {
        'success': False,
        "error": "",
        'currency_freezedate': Cm.dateUpdated,

        'BTC': {
            'currency_usd': btcFreezedCurrency.usd,
            'currency_eur': btcFreezedCurrency.eur,
            'addresses_btc_processed': 0,
            'addresses_btc_errors': [],
            'transactions_btc_created': 0,
            'transactions_btc_errors': [],
        },
        'LWF': {
            'currency_usd': lwfFreezedCurrency.usd,
            'currency_eur': lwfFreezedCurrency.eur,
            'addresses_lwf_processed': 0,
            'addresses_lwf_errors': [],
            'transactions_lwf_created': 0,
            'transactions_lwf_errors': [],
        }
    }

    # CHECK THAT ANOTHER PROCESS IS RUNNING
    previoustp = TransactionsProcess.objects.filter(
        dateEnd=None
    )
    if len(previoustp) == 0:

        logtp = TransactionsProcess()
        logtp.dateStart = django.utils.timezone.now()
        logtp.dateEnd = None
        logtp.save()
        try:

            btcProcess = processBtcTransactions(btcFreezedCurrency)

            r['BTC']['addresses_btc_processed'] = btcProcess['processed_addresses']
            r['BTC']['addresses_btc_errors'] = btcProcess['errors_addresses']
            r['BTC']['transactions_btc_created'] = len(btcProcess['created_transactions'])
            r['BTC']['transactions_btc_errors'] = btcProcess['errors_transactions']

            lwfProcess = processLwfTransactions(lwfFreezedCurrency)

            r['LWF']['addresses_lwf_processed'] = lwfProcess['processed_addresses']
            r['LWF']['addresses_lwf_errors'] = lwfProcess['errors_addresses']
            r['LWF']['transactions_lwf_created'] = len(lwfProcess['created_transactions'])
            r['LWF']['transactions_lwf_errors'] = lwfProcess['errors_transactions']

            r['success'] = True

        except Exception, ex:
            p_ex(
                request,
                ex,
                2,
                1,
                'Error during transaction process: %s' % (traceback.format_exc())
            )
            r['error'] = "%s" % (
                traceback.format_exc()
            )

        logtp.dateEnd = django.utils.timezone.now()
        logtp.processData = str(r)
        logtp.save()

    else:

        # check if timed out
        ptp = previoustp[0]
        now = django.utils.timezone.now()
        timeoutDateTime = ptp.dateStart + datetime.timedelta(seconds=settings.TRANSACTION_PROCESS_RESTART_TIMEOUT)

        if now > timeoutDateTime:
            # timed out, set as invalid...
            ptp.dateEnd = django.utils.timezone.now()
            ptp.processData = "{'error':'Transaction process timed out, unknown reason!'}"
            ptp.save()

            try:
                a = None
                a.fakeMethod
            except Exception, ex:
                p_ex(
                    request,
                    ex,
                    2,
                    1,
                    'A previous process timed out for unknown reason! Transaction process unlocked!'
                )
            r['error'] = 'A previous process timed out for unknown reason! Transaction process unlocked!'
        else:
            r['error'] = 'A previous process is running!'

    return Response(r)


@api_view(['GET'])
def processNotifications(request):
    r = {
        'success': True,
        "email_notifications_processed": 0,
        "email_notifications_errors": [],
        "sms_notifications_processed": 0,
        "sms_notifications_errors": [],
    }

    emailNotifications = Notification.objects.filter(
        email=True,
        emailNotified=False
    )

    for eN in emailNotifications:

        try:
            eN.process()
            r['email_notifications_processed'] += 1
        except Exception, ex:
            r['email_notifications_errors'].append(
                "%s" % (
                    traceback.format_exc()
                )
            )

    return Response(r)


@api_view(['GET'])
def processCurrencies(request):
    r = {
        'success': True,
        'total_currencies': 0,
        'created_currencies': 0,
        'updated_currencies': 0
    }

    cm = CurrencyManager()
    data = cm.getCurrencies()

    for c in data:

        try:
            localCurrency = Currency.objects.get(
                code=c['code']
            )
            r['updated_currencies'] += 1
        except:
            localCurrency = Currency()
            r['created_currencies'] += 1

        localCurrency.dateUpdated = django.utils.timezone.now()
        localCurrency.code = c['code']
        localCurrency.usd = c['usd']
        localCurrency.eur = c['eur']
        localCurrency.save()


    #try:
    #    lwfCurrency = Currency.objects.get(
    #        code='LWF'
    #    )
    #    r['updated_currencies'] += 1
    #except:
    #    lwfCurrency = Currency()
    #    r['created_currencies'] += 1

    #btcCurrency = Currency().getCurrency("BTC")
    #lwdUsd = (btcCurrency.usd * 0.000009148)
    #lwfEur = (btcCurrency.eur * 0.000009148)

    #lwfCurrency.dateUpdated = django.utils.timezone.now()
    #lwfCurrency.code = 'LWF'
    #lwfCurrency.usd = lwdUsd
    #lwfCurrency.eur = lwfEur
    #lwfCurrency.save()

    try:
        paypalBcCurrency = Currency.objects.get(
            code='PPBC'
        )
        r['updated_currencies'] += 1
    except:
        paypalBcCurrency = Currency()
        r['created_currencies'] += 1


    paypalBcCurrency.dateUpdated = django.utils.timezone.now()
    paypalBcCurrency.code = 'PPBC'
    paypalBcCurrency.usd = 1
    btcCurrency = Currency().getCurrency("BTC")
    paypalBcCurrency.eur = 1 * btcCurrency.eur / btcCurrency.usd
    paypalBcCurrency.save()

    r['total_currencies'] = len(Currency.objects.all())


    return Response(r)
