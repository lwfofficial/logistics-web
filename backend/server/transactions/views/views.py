# -*- coding: utf-8 -*-
import weasyprint
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Notification, Order
from transactions.manager import TransactionManager
from transactions.models import WithdrawRequest, PaymentTransaction, InstantDeliveryPaymentTransaction, Transaction, \
    TransactionPaypal, WithdrawTransaction


@api_view(['POST'])
def setAsPaidWithdrawRequest(request):
    sKey = request.data.get('sKey')
    wrId = int(request.data.get('wrId'))
    transactionId = request.data.get('transactionId')

    if not sKey == settings.REST_FRAMEWORK_ADMIN_SECRET_KEY:
        return Response({'success': False, 'error': 'auth error'})

    try:
        withdrawRequest = WithdrawRequest.objects.get(
            id=wrId,
        )
    except Exception, ex:
        withdrawRequest = None

    if not withdrawRequest:
        return Response({'success': False, 'error': 'withdraw request not found'})

    if not withdrawRequest.transaction:
        return Response({'success': False, 'error': 'withdraw request not found'})

    withdrawRequest.transaction.status = 'COMPLETED'
    withdrawRequest.transaction.transactionId = transactionId
    withdrawRequest.transaction.save()

    return Response({'success': True})


@api_view(['POST'])
def forceCompletePaymentTransaction(request):
    sKey = request.data.get('sKey')
    ptId = int(request.data.get('ptId'))

    if not sKey == settings.REST_FRAMEWORK_ADMIN_SECRET_KEY:
        return Response({'success': False, 'error': 'auth error'})

    try:
        paymentTransaction = PaymentTransaction.objects.get(
            id=ptId,
            status='HOLDING'
        )
    except Exception as ex:
        paymentTransaction = None

    if not paymentTransaction:
        return Response({'success': False, 'error': 'payment transaction not found'})

    outWalletId = paymentTransaction.order.service.profile.wallet.id
    TransactionManager.completePaymentTransaction(
        order=paymentTransaction.order,
        outWalletId=outWalletId,
    )

    return Response({'success': True})


@api_view(['POST'])
def forceCompleteInstantDeliveryPaymentTransaction(request):
    sKey = request.data.get('sKey')
    ptId = int(request.data.get('ptId'))

    if not sKey == settings.REST_FRAMEWORK_ADMIN_SECRET_KEY:
        return Response({'success': False, 'error': 'auth error'})

    try:
        paymentTransaction = InstantDeliveryPaymentTransaction.objects.get(
            id=ptId,
            status='HOLDING'
        )
    except Exception as ex:
        paymentTransaction = None

    if not paymentTransaction:
        return Response({'success': False, 'error': 'instant delivery payment transaction not found'})

    if not paymentTransaction.outWallet:
        return Response({'success': False, 'error': 'OutWallet is null'})

    TransactionManager.completeInstantDeliveryPaymentTransaction(
        order=paymentTransaction.order
    )

    return Response({'success': True})


@api_view(['GET'])
def getDepositReceiptPdf(request, transaction_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        transaction = Transaction.objects.get(id=transaction_id, wallet__profile=profile)
        purchasedCredits = transaction.amount * transaction.freezedUsd
        feeAmount = transaction.feeAmount

        content = {
            'transaction': transaction,
            'purchasedCredits': purchasedCredits,
            'feeAmount': feeAmount,
            'paymentMethod': 'Crypto Currency',
            'baseUrl': Notification().getEmailBaseUrl()
        }
        pdf = render_to_pdf('deposit_crypto_invoice_template.html', content)
        if pdf:
            return HttpResponse(pdf, content_type='application/pdf')
        return Response({'success': False, 'error': "not.found"})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getDepositPaypalReceiptPdf(request, transaction_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        transaction = TransactionPaypal.objects.get(id=transaction_id, wallet__profile=profile)

        if transaction.currency == 'USD':
            purchasedCredits = transaction.amount - transaction.feeAmount
            feeAmount = transaction.feeAmount
        elif transaction.currency == 'EUR':
            purchasedCredits = (transaction.amount / transaction.freezedEur) - transaction.feeAmount
            feeAmount = transaction.feeAmount * transaction.freezedEur

        content = {
            'transaction': transaction,
            'purchasedCredits': purchasedCredits,
            'feeAmount': feeAmount,
            'paymentMethod': 'Credit Card',
            'baseUrl': Notification().getEmailBaseUrl()
        }
        pdf = render_to_pdf('deposit_paypal_invoice_template.html', content)
        if pdf:
            return HttpResponse(pdf, content_type='application/pdf')
        return Response({'success': False, 'error': "not.found"})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getBuyerOrderPaymentReportPdf(request, order_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(
            id=order_id,
            profile=profile
        )
        transaction = PaymentTransaction.objects.get(order=order, inWallet__profile=profile)
        content = {
            'transaction': transaction,
            'totalPaid': transaction.amount + transaction.feeAmount,
            'paymentMethod': 'Bundle Credits',
            'baseUrl': Notification().getEmailBaseUrl()
        }
        pdf = render_to_pdf('order_buyer_report_template.html', content)
        if pdf:
            return HttpResponse(pdf, content_type='application/pdf')
        return Response({'success': False, 'error': "not.found"})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getForwarderOrderPaymentReportPdf(request, order_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(
            id=order_id,
            service__profile=profile
        )
        transaction = PaymentTransaction.objects.get(order=order, outWallet__profile=profile)
        content = {
            'transaction': transaction,
            'total': transaction.amount+transaction.feeAmount,
            'totalEarned': transaction.amount,
            'paymentMethod': 'Bundle Credits',
            'baseUrl': Notification().getEmailBaseUrl()
        }
        pdf = render_to_pdf('order_forwarder_report_template.html', content)
        if pdf:
            return HttpResponse(pdf, content_type='application/pdf')
        return Response({'success': False, 'error': "not.found"})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getWithdrawReceiptPdf(request, transaction_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        transaction = WithdrawTransaction.objects.get(id=transaction_id, user=user)
        withdrawRequest = WithdrawRequest.objects.get(transaction=transaction, user=user)
        bcToCrypto = 1 / withdrawRequest.freezedUsd
        cryptoAmount = transaction.amount / withdrawRequest.freezedUsd

        content = {
            'transaction': transaction,
            'withdrawRequest': withdrawRequest,
            'bcToCrypto': bcToCrypto,
            'cryptoAmount': cryptoAmount,
            'baseUrl': Notification().getEmailBaseUrl()
        }
        pdf = render_to_pdf('withdraw_crypto_invoice_template.html', content)
        if pdf:
            return HttpResponse(pdf, content_type='application/pdf')
        return Response({'success': False, 'error': "not.found"})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


def render_to_pdf(template_src, context_dict={}):
    html = render_to_string(
        template_src, context_dict
    )
    w = weasyprint.HTML(string=html)
    pdf = w.write_pdf()
    return pdf
