import django
from django.conf import settings
from django.db import transaction

from core.models import Configuration
from transactions.models import PaymentTransaction, WithdrawTransaction, AdminTransaction, Wallet, \
    Verify2FASMSTransaction, TransactionCaution, InstantDeliveryPaymentTransaction, LWFTransactionInfo


class TransactionManager:

    @classmethod
    @transaction.atomic
    def createPaymentTransaction(cls, amount, inWalletId, outWalletId, order, feePercentage):
        inWallet = Wallet.objects.get(id=inWalletId)
        if inWallet.credit < amount:
            raise ValueError("Not enough credit on wallet : %s" % inWallet)
        paymentTransaction = PaymentTransaction()
        paymentTransaction.status = 'HOLDING'
        paymentTransaction.type = 'PAYMENT'
        paymentTransaction.user = order.profile.user
        paymentTransaction.inWallet = inWallet
        paymentTransaction.order = order
        paymentTransaction.feePercentage = feePercentage
        paymentTransaction.feeAmount = amount - amount * (1 - feePercentage / 100.00)
        inWallet.credit -= amount
        inWallet.save()

        paymentTransaction.amount = (amount - paymentTransaction.feeAmount)
        outWallet = Wallet.objects.get(id=outWalletId)

        paymentTransaction.info = 'Payment of %s Bc from %s user wallet to %s user wallet. (FeePercentage %s | FeeAmount: %s Bc)' % (
            paymentTransaction.amount,
            inWallet.profile.user.username,
            outWallet.profile.user.username,
            feePercentage,
            paymentTransaction.feeAmount
        )

        paymentTransaction.outWallet = outWallet
        paymentTransaction.save()

        #for cost in paymentTransaction.order.computeCosts():
        #    transactionCost = LWFTransactionInfo()
        #    transactionCost.cost = cost['amount']
        #    transactionCost.description = cost['description']
        #    transactionCost.transaction = paymentTransaction
        #    transactionCost.save()

        order.state = 'PAID'
        order.save()

    @classmethod
    @transaction.atomic
    def completePaymentTransaction(cls, outWalletId, order):
        outWallet = Wallet.objects.get(id=outWalletId)
        paymentTransaction = PaymentTransaction.objects.get(order=order)
        if paymentTransaction.status != 'HOLDING':
            raise ValueError("Transaction not in HOLDING status")
        paymentTransaction.status = 'COMPLETED'
        paymentTransaction.info += '\nCompleted Payment of %s Bc to %s user wallet. (%s)' % (
            paymentTransaction.amount,
            outWallet.profile.user.username,
            django.utils.timezone.now()
        )
        if order.service.type == settings.SERVICE_TYPES[0][0] \
                and order.service.addPartnerForwarder:
            feePartner = Configuration().getConfiguration(
                "dhl_partner_fee"
            )
            paymentTransaction.courierPartnerFeeAmount = feePartner
            outWallet.credit -= feePartner
            paymentTransaction.info += "\n (Courier Partner Fee %.2f)" % feePartner
        paymentTransaction.save()
        outWallet.credit += paymentTransaction.amount
        outWallet.save()

    @classmethod
    @transaction.atomic
    def completeInstantDeliveryPaymentTransaction(cls, order):
        paymentTransaction = InstantDeliveryPaymentTransaction.objects.get(order=order)
        outWallet = paymentTransaction.outWallet
        if paymentTransaction.status != 'HOLDING':
            raise ValueError("Transaction not in HOLDING status")
        if not outWallet:
            raise ValueError("Out Wallet is null")
        paymentTransaction.status = 'COMPLETED'
        paymentTransaction.info += '\nCompleted Instant Delivery Payment of %s Bc to %s user wallet. (%s)' % (
            paymentTransaction.amount,
            outWallet.profile.user.username,
            django.utils.timezone.now()
        )
        paymentTransaction.save()
        outWallet.credit += paymentTransaction.amount
        outWallet.save()

    @classmethod
    @transaction.atomic
    def createWithdrawTransaction(cls, amount, inWalletId, freezedCurrency, ccAddress):
        inWallet = Wallet.objects.get(id=inWalletId)
        if inWallet.credit < amount:
            raise ValueError("Not enough credit on wallet : %s" % inWallet)
        withDrawTransaction = WithdrawTransaction()
        withDrawTransaction.status = 'PENDING'
        withDrawTransaction.type = 'WITHDRAW'
        withDrawTransaction.user = inWallet.profile.user
        withDrawTransaction.amount = amount
        withDrawTransaction.inWallet = inWallet
        withDrawTransaction.address = ccAddress
        inWallet.credit -= amount
        inWallet.save()

        withDrawTransaction.info = 'Withdraw request of: %s Bc to %s address: %s' % (
            amount,
            freezedCurrency.code,
            ccAddress
        )
        withDrawTransaction.info = '\nCurrent freezed value of %s Bc in %s currency is: %s' % (
            amount,
            freezedCurrency.code,
            "%0.12f" % (amount / freezedCurrency.usd)
        )
        withDrawTransaction.save()
        return withDrawTransaction

    @classmethod
    @transaction.atomic
    def createAdminTransaction(cls, amount, inWalletId, outWalletId, managerUser):
        inWallet = Wallet.objects.get(id=inWalletId)
        outWallet = Wallet.objects.get(id=outWalletId)
        if inWallet.credit < amount:
            raise ValueError("Not enough credit on wallet : %s" % inWallet)
        if inWallet.id == outWallet.id:
            raise ValueError("Transaction not possible in the same in-out wallets")
        adminTransaction = AdminTransaction()
        adminTransaction.status = 'COMPLETED'
        adminTransaction.type = 'ADMIN'
        adminTransaction.user = managerUser
        adminTransaction.amount = amount
        adminTransaction.inWallet = inWallet
        adminTransaction.outWallet = outWallet
        inWallet.credit -= amount
        inWallet.save()
        outWallet.credit += amount
        outWallet.save()
        adminTransaction.info = 'Moved %s Bc from %s user wallet to %s user wallet by manager: %s' % (
            amount,
            inWallet.profile.user.username,
            outWallet.profile.user.username,
            managerUser.username
        )
        adminTransaction.save()

    @classmethod
    @transaction.atomic
    def createVerify2FASMSTransaction(cls, amount, inWalletId):
        inWallet = Wallet.objects.get(id=inWalletId)
        if inWallet.credit < amount:
            raise ValueError("Not enough credit on wallet : %s" % inWallet)
        verify2FASMSTransaction = Verify2FASMSTransaction()
        verify2FASMSTransaction.status = 'COMPLETED'
        verify2FASMSTransaction.type = '2FASMS'
        verify2FASMSTransaction.user = inWallet.profile.user
        verify2FASMSTransaction.amount = amount
        verify2FASMSTransaction.inWallet = inWallet
        inWallet.credit -= amount
        inWallet.save()
        verify2FASMSTransaction.save()

    @classmethod
    @transaction.atomic
    def createDepositCautionTransaction(cls, amount, walletId):
        wallet = Wallet.objects.get(id=walletId)
        if wallet.credit < amount:
            raise ValueError("Not enough credit on wallet : %s" % wallet)
        cautionTransaction = TransactionCaution()
        cautionTransaction.wallet = wallet
        cautionTransaction.amount = amount
        wallet.credit -= amount
        wallet.deposit += amount
        wallet.save()
        cautionTransaction.info = 'Caution of %s Bc in %s user wallet' % (
            amount,
            wallet.profile.user.username,
        )
        cautionTransaction.save()

    @classmethod
    @transaction.atomic
    def createInstantDeliveryOrderPaymentTransaction(cls, amount, inWalletId, order, feePercentage):
        inWallet = Wallet.objects.get(id=inWalletId)
        if inWallet.credit < amount:
            raise ValueError("Not enough credit on wallet : %s" % inWallet)
        paymentTransaction = InstantDeliveryPaymentTransaction()
        paymentTransaction.status = 'HOLDING'
        paymentTransaction.type = 'PAYMENT'
        paymentTransaction.user = order.buyer.user
        paymentTransaction.inWallet = inWallet
        paymentTransaction.order = order
        paymentTransaction.feePercentage = feePercentage
        paymentTransaction.feeAmount = amount - amount * (1 - feePercentage / 100.00)
        inWallet.credit -= amount
        inWallet.save()

        paymentTransaction.amount = (amount - paymentTransaction.feeAmount)

        paymentTransaction.info = 'Payment of %s Bc from %s user wallet. (FeePercentage %s | FeeAmount: %s Bc)' % (
            paymentTransaction.amount,
            inWallet.profile.user.username,
            feePercentage,
            paymentTransaction.feeAmount
        )

        paymentTransaction.save()
        order.state = 'NEW'
        order.save()

    @classmethod
    @transaction.atomic
    def refundExpiredInstantDeliveryOrderPaymentTransaction(cls, order):
        paymentTransaction = InstantDeliveryPaymentTransaction.objects.get(
            order=order
        )
        if not paymentTransaction.status == 'HOLDING':
            raise ValueError("Transaction not in HOLDING Status!")

        inWallet = paymentTransaction.inWallet
        inWallet.credit += paymentTransaction.amount
        inWallet.credit += paymentTransaction.feeAmount
        inWallet.save()

        paymentTransaction.status = 'ABORTED'
        paymentTransaction.info += '\nRefund %s Bc (amount) + %s Bc (feeAmount) to user wallet: %s for expired order. (%s)' % (
            paymentTransaction.amount,
            paymentTransaction.feeAmount,
            inWallet.profile.user.username,
            django.utils.timezone.now()
        )
        paymentTransaction.save()

        order.state = 'NOT-QUORATE'
        order.expired = True
        order.save()
