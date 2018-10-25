# -*- coding: utf-8 -*-

import uuid

import django
from django.conf import settings
from django.db import models
from django.db import transaction
from django.db.models.signals import pre_save, post_save
from django.utils.datetime_safe import strftime

from core.models import Profile, Order, Notification
from mobile.models import InstantDeliveryOrder


def uniqueUuid():
    id = str(uuid.uuid4())
    return id


class CryptoCurrencyAddress(models.Model):
    address = models.CharField(default='', max_length=255)
    currency = models.CharField(default='', max_length=15)

    def __unicode__(self):
        return "%s | %s" % (
            self.address,
            self.currency
        )

class Wallet(models.Model):
    profile = models.OneToOneField(
        Profile
    )
    deposit = models.FloatField(
        default=0.000,
        editable=False
    )
    credit = models.FloatField(
        default=0.000,
        editable=False
    )

    def getWalletToCcAddresses(self, currency=None):
        if not currency:
            ccAddresses = WalletToCCA.objects.filter(
                wallet=self
            )
        else:
            ccAddresses = WalletToCCA.objects.filter(
                wallet=self,
                address__currency__iexact=currency
            )
        return ccAddresses

    def increase(self):
        pass

    def decrease(self):
        pass

    @transaction.atomic
    def depositIn(self, freezedCurrency, transaction, amount, info, feePercentage):
        """
        Create ATOMIC transaction for deposit in
        and increment credit
        :param currencyCode: String
        :param freezedCurrency: Currency Object
        :param transaction: Transaction object or None
        :param amount: float
        :return: True/False
        """
        r = False

        # avoid null/ 0 amounts
        if amount:
            if amount > 0:
                transaction.feePercentage = feePercentage
                transaction.feeAmount = amount - amount * (1 - feePercentage / 100)
                transaction.freezedUsd = freezedCurrency.usd
                transaction.freezedEur = freezedCurrency.eur

                # create credit Transaction #TODO
                # add freezedCurrency current values on info
                info += ' | currency_freezedate: %s, currency_freezed_usd: %s, currency_freezed_eur: %s' % (
                    freezedCurrency.dateUpdated,
                    freezedCurrency.usd,
                    freezedCurrency.eur
                )
                transaction.save()

                # add previous value current values on info
                info += ' | previous credit value: %f' % (
                    self.credit
                )

                # log fee
                info += ' | feePercentage: %s | feeAmount: %s' % (
                    transaction.feePercentage,
                    transaction.feeAmount
                )

                # increase credit
                inAmount = amount - transaction.feeAmount
                self.credit += (inAmount * freezedCurrency.usd)
                self.save()

                # add new credit value on info
                info += ' | current credit value: %f' % (
                    self.credit
                )

                transaction.info = info
                transaction.save()

        return r

    class Meta:
        verbose_name = 'Wallet'
        verbose_name_plural = 'Wallets'

    def __unicode__(self):
        return "%f %s" % (self.credit, self.profile)


class WalletToCCA(models.Model):
    address = models.ForeignKey(
        CryptoCurrencyAddress,
        editable=False
    )
    wallet = models.ForeignKey(
        Wallet,
        editable=False
    )
    assignedDate = models.DateTimeField(
        default=django.utils.timezone.now,
        editable=False
    )

    class Meta:
        verbose_name = 'Wallet Assigned Crypto Address'
        verbose_name_plural = 'Wallet Assigned Crypto Addresses'


class Transaction(models.Model):
    # Crypto transaction model

    hash = models.CharField(
        default='',
        max_length=255
    )
    date = models.DateTimeField(default=None, null=True, blank=True)
    type = models.CharField(default='', max_length=10)
    currency = models.CharField(default='', max_length=5)
    amount = models.FloatField(
        default=0.00000,
        editable=False
    )
    wallet = models.ForeignKey(Wallet)
    address = models.ForeignKey(CryptoCurrencyAddress, null=True)
    feeAmount = models.FloatField(
        default=0.00000,
        editable=False
    )
    feePercentage = models.FloatField(
        default=0.00,
        editable=False
    )
    freezedUsd = models.FloatField(
        default=0.00,
        editable=False
    )
    freezedEur = models.FloatField(
        default=0.00,
        editable=False
    )
    info = models.TextField(
        null=True,
        blank=True
    )
    receiptSequence = models.CharField(
        unique=True,
        max_length=254,
        editable=False,
        default=uniqueUuid
    )

    class Meta:
        unique_together = (("hash", "address"),)
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'

    @property
    def costs(self):
        try:
            return LWFTransactionInfo.objects.filter(transaction=self).order_by("id")
        except Exception as e:
            print(e.message)
            return []

    @property
    def infos(self):
        return TransactionInfo.objects.filter(transaction=self).distinct().order_by("id")


class TransactionInfo(models.Model):
    description = models.CharField(default='', max_length=255)
    cost = models.FloatField(
        default=0.00000,
        editable=False
    )
    transaction = models.ForeignKey(Transaction)

    def __unicode__(self):
        return "%s %s" % (self.description, self.cost)


class TransactionPaypal(Transaction):
    paymentId = models.CharField(
        default='',
        max_length=255,
        editable=False
    )

    class Meta:
        verbose_name = 'Paypal deposit transaction'
        verbose_name_plural = 'Paypal deposit transactions'


class TransactionCaution(models.Model):
    date = models.DateTimeField(
        default=django.utils.timezone.now
    )
    amount = models.FloatField(
        default=0.00000,
        editable=False
    )
    wallet = models.ForeignKey(Wallet)
    info = models.TextField(
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = 'Caution deposit transaction'
        verbose_name_plural = 'Caution deposit transactions'


class TransactionsProcess(models.Model):
    dateStart = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Start DateTime"
    )
    dateEnd = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="End DateTime"
    )
    processData = models.TextField(
        null=True,
        blank=True,
        verbose_name="Process Data"
    )

    def getTimeDif(self):
        if self.dateStart and self.dateEnd:
            dif = (self.dateEnd - self.dateStart).total_seconds()
            return ("%.0f" % dif)
        else:
            return None

    class Meta:
        verbose_name = 'Crypto currency transaction process'
        verbose_name_plural = 'Crypto currency transaction processes'


class LWFWallet(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    dateUpdated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    name = models.CharField(
        max_length=20,
        unique=True
    )
    credit = models.FloatField(
        default=0.000,
        editable=False
    )

    class Meta:
        verbose_name = 'LWF Wallet'
        verbose_name_plural = 'LWF Wallets'

    def __unicode__(self):
        return "%f %s" % (self.credit, self.name)


class LWFTransaction(models.Model):
    status = models.CharField(
        max_length=20,
        default=settings.TRANSACTION_STATUS[0],
        choices=settings.TRANSACTION_STATUS
    )
    type = models.CharField(
        max_length=20,
        default=settings.TRANSACTION_TYPES[0],
        choices=settings.TRANSACTION_TYPES
    )
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    dateUpdated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    user = models.ForeignKey('auth.User', null=True)
    amount = models.FloatField(
        default=0.000,
        editable=False
    )
    feeAmount = models.FloatField(
        default=0.00000,
        editable=False
    )
    feePercentage = models.FloatField(
        default=0.00,
        editable=False
    )

    receiptSequence = models.CharField(
        unique=True,
        max_length=254,
        editable=False,
        default=uniqueUuid
    )

    class Meta:
        verbose_name = 'Internal Transaction'
        verbose_name_plural = 'Internal Transactions'

    @property
    def infos(self):
        return LWFTransactionInfo.objects.filter(transaction=self).distinct()


class LWFTransactionInfo(models.Model):
    description = models.CharField(default='', max_length=255)
    cost = models.FloatField(default=0.00000)
    transaction = models.ForeignKey(LWFTransaction)


class PaymentTransaction(LWFTransaction):
    inWallet = models.ForeignKey(Wallet, related_name='in_wallet')
    outWallet = models.ForeignKey(Wallet, related_name='out_wallet')
    order = models.ForeignKey(Order, related_name='order', default=None)
    info = models.TextField(
        null=True,
        blank=True
    )
    courierPartnerFeeAmount = models.FloatField(default=0.00)

    class Meta:
        verbose_name = 'Order payment transaction'
        verbose_name_plural = 'Order payment transactions'


class InstantDeliveryPaymentTransaction(LWFTransaction):
    inWallet = models.ForeignKey(Wallet, related_name='instant_delivery_in_wallet')
    outWallet = models.ForeignKey(Wallet, related_name='instant_delivery_out_wallet', null=True, blank=True)
    order = models.ForeignKey(InstantDeliveryOrder, related_name='instant_delivery_order', default=None)
    info = models.TextField(
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = 'Instant delivery order payment transaction'
        verbose_name_plural = 'Instant delivery order payment transactions'


class Verify2FASMSTransaction(LWFTransaction):
    inWallet = models.ForeignKey(Wallet, related_name='in_2fasms_wallet')


class AdminTransaction(LWFTransaction):
    inWallet = models.ForeignKey(Wallet, related_name='in_wallet_admin')
    outWallet = models.ForeignKey(Wallet, related_name='out_wallet_admin')
    info = models.TextField(
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = 'Admin transaction'
        verbose_name_plural = 'Admin transactions'


class WithdrawTransaction(LWFTransaction):
    inLWFWallet = models.ForeignKey(
        LWFWallet,
        null=True,
        blank=True
    )
    inWallet = models.ForeignKey(
        Wallet,
        null=True,
        blank=True
    )
    address = models.CharField(
        max_length=254,
        null=True,
        blank=True
    )
    info = models.TextField(
        null=True,
        blank=True
    )
    transactionId = models.CharField(
        default='',
        max_length=255,
        editable=False
    )

    class Meta:
        verbose_name = 'Withdraw transaction'
        verbose_name_plural = 'Withdraw transactions'


class WithdrawRequest(models.Model):
    user = models.ForeignKey(
        'auth.User'
    )
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    transaction = models.ForeignKey(
        WithdrawTransaction,
        editable=False,
        null=True
    )
    notification = models.ForeignKey(
        Notification,
        null=True
    )
    confirmed = models.BooleanField(
        default=False
    )
    hash = models.CharField(
        max_length=255,
        default=uniqueUuid,
        unique=True,
        editable=False
    )
    requestedAmount = models.FloatField(
        default=0.000,
        editable=False
    )
    requestedCurrency = models.CharField(
        max_length=20,
        editable=False
    )
    requestedCcAddress = models.CharField(
        max_length=254,
        editable=False
    )
    freezedUsd = models.FloatField(
        default=0.00,
        editable=False
    )
    freezedEur = models.FloatField(
        default=0.00,
        editable=False
    )

    class Meta:
        verbose_name = 'Withdraw request'
        verbose_name_plural = 'Withdraw requests'


# SIGNALS

def update_transaction_receipt_sequence(sender, instance, created, **kwargs):
    if created:
        instance.receiptSequence = "CC%s" % (instance.id)
        instance.save()


def update_transaction_paypal_receipt_sequence(sender, instance, created, **kwargs):
    if created:
        instance.receiptSequence = "PP%s" % (instance.id)
        instance.save()


def update_lwftransaction_receipt_sequence(sender, instance, created, **kwargs):
    if created:
        instance.receiptSequence = "IP%s" % (instance.id)
        instance.save()


def update_lwftransaction_withdraw_receipt_sequence(sender, instance, created, **kwargs):
    if created:
        instance.receiptSequence = "WD%s" % (instance.id)
        instance.save()


post_save.connect(update_transaction_receipt_sequence, sender=Transaction)
post_save.connect(update_transaction_paypal_receipt_sequence, sender=TransactionPaypal)
post_save.connect(update_lwftransaction_receipt_sequence, sender=PaymentTransaction)
post_save.connect(update_lwftransaction_withdraw_receipt_sequence, sender=WithdrawTransaction)
post_save.connect(update_lwftransaction_receipt_sequence, sender=AdminTransaction)
