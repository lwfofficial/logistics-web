# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from django.conf import settings

from transactions.models import TransactionsProcess, Transaction, CryptoCurrencyAddress, WalletToCCA, Wallet, WithdrawTransaction, WithdrawRequest, AdminTransaction, PaymentTransaction, InstantDeliveryPaymentTransaction, TransactionCaution, TransactionPaypal


class CryptoCurrencyAddressAdmin(admin.ModelAdmin):
    model = CryptoCurrencyAddress
    verbose_name_plural = 'CryptoCurrencyAddresses'
    list_display = ['address', 'currency']
    search_fields = ['address', 'currency']


class WalletToCCAAdmin(admin.ModelAdmin):
    model = WalletToCCA
    search_fields = ['address', 'wallet', 'assignedDate']

    def user(self, obj):
        html = ''
        if obj:
            html = obj.wallet.profile.user
        return html

    user.allow_tags = True

    list_display = ['address', 'user', 'wallet', 'assignedDate']

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class WithdrawTransactionAdmin(admin.ModelAdmin):
    model = WithdrawTransaction

    list_display = [
        'id',
        'transactionId',
        'dateCreated',
        'amount',
        'receiptSequence',
        'status',
    ]

    readonly_fields = []

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class WithdrawRequestAdmin(admin.ModelAdmin):
    model = WithdrawRequest

    def payment_done(self, obj):
        html = ''
        if obj:
            if obj.transaction:
                if obj.transaction.status != settings.TRANSACTION_STATUS[3][0]:
                    html = '<a href="#this" onclick="setAsPaidWithdrawRequest(\'%s\', %s);">Set paid</a>' % (
                        settings.REST_FRAMEWORK_ADMIN_SECRET_KEY,
                        obj.id
                    )
                elif obj.transaction.status == settings.TRANSACTION_STATUS[3][0]:
                    html = 'Done'
        return html

    def crypto_amount(self, obj):
        html = ''
        if obj:
            v = obj.requestedAmount / obj.freezedUsd
            html = "%0.8f" % (v)


        return html

    payment_done.allow_tags = True
    crypto_amount.allow_tags = True

    list_display = [
        'hash',
        'user',
        'dateCreated',
        'requestedCurrency',
        'requestedAmount',
        'crypto_amount',
        'requestedCcAddress',
        'confirmed',
        'payment_done'
    ]

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return True

class AdminTransactionAdmin(admin.ModelAdmin):
    model = AdminTransaction

    list_display = [
        'id',
        'dateCreated',
        'amount',
        'status',
        'inWallet',
        'outWallet',
        'receiptSequence'
    ]

    readonly_fields = []

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class TransactionAdmin(admin.ModelAdmin):
    model = Transaction
    verbose_name_plural = 'Transactions'
    list_display = [
        'hash',
        'date',
        'type',
        'currency',
        'amount',
        'feeAmount',
        'feePercentage',
        'freezedUsd',
        'freezedEur',
        'wallet',
        'address',
        'receiptSequence'
    ]
    search_fields = [
        'hash',
        'date',
        'amount'
    ]

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class TransactionCautionAdmin(admin.ModelAdmin):
    model = TransactionCaution

    list_display = [
        'id',
        'date',
        'wallet',
        'amount',
    ]

    readonly_fields = []

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class TransactionPaypalAdmin(admin.ModelAdmin):
    model = TransactionPaypal

    list_display = [
        'id',
        'paymentId',
        'date',
        'currency',
        'wallet',
        'amount',
        'receiptSequence'
    ]

    readonly_fields = []

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class PaymentTransactionAdmin(admin.ModelAdmin):
    model = PaymentTransaction

    verbose_name_plural = 'Payment Transactions'

    def force_complete(self, obj):
        html = ''
        if obj:
            if obj.status == settings.TRANSACTION_STATUS[4][0]:
                html = '<a href="#this" onclick="forceCompletePaymentTransaction(\'%s\', %s);">Force complete</a>' % (
                    settings.REST_FRAMEWORK_ADMIN_SECRET_KEY,
                    obj.id
                )
        return html

    force_complete.allow_tags = True

    list_display = [
        'id',
        'dateCreated',
        'amount',
        'feeAmount',
        'feePercentage',
        'order',
        'inWallet',
        'outWallet',
        'receiptSequence',
        'status',
        'force_complete'
    ]

    readonly_fields = []

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class InstantDeliveryPaymentTransactionAdmin(admin.ModelAdmin):
    model = InstantDeliveryPaymentTransaction

    verbose_name_plural = 'Instant Delivery Payment Transactions'

    def force_complete(self, obj):
        html = ''
        if obj:
            if obj.status == settings.TRANSACTION_STATUS[4][0] and obj.outWallet:
                html = '<a href="#this" onclick="forceCompleteInstantDeliveryPaymentTransaction(\'%s\', %s);">Force complete</a>' % (
                    settings.REST_FRAMEWORK_ADMIN_SECRET_KEY,
                    obj.id
                )
        return html

    force_complete.allow_tags = True

    list_display = [
        'id',
        'dateCreated',
        'amount',
        'feeAmount',
        'feePercentage',
        'order',
        'inWallet',
        'outWallet',
        'receiptSequence',
        'status',
        'force_complete'
    ]

    readonly_fields = []

    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class TransactionsProcessAdmin(admin.ModelAdmin):
    model = TransactionsProcess
    verbose_name_plural = 'Transactions Processes'
    ordering = ('-id',)
    list_display = ['id', 'dateStart', 'dateEnd', 'Process_Time']
    search_fields = ['dateStart', 'dateEnd']

    def Process_Time(self, obj):
        dif = obj.getTimeDif()
        if dif:
            return "%s (Seconds)" % (
                dif
            )
        else:
            return "Not Available"

    Process_Time.allow_tags = True

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


class WalletAdmin(admin.ModelAdmin):
    model = Wallet
    verbose_name_plural = 'Wallets'
    list_display = [
        'profile',
        'credit',
        'deposit'
    ]
    search_fields = [
        'profile',
        'credit',
        'deposit'
    ]

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Wallet, WalletAdmin)
admin.site.register(CryptoCurrencyAddress, CryptoCurrencyAddressAdmin)
admin.site.register(WalletToCCA, WalletToCCAAdmin)
admin.site.register(Transaction, TransactionAdmin)
admin.site.register(TransactionsProcess, TransactionsProcessAdmin)
admin.site.register(PaymentTransaction, PaymentTransactionAdmin)
admin.site.register(InstantDeliveryPaymentTransaction, InstantDeliveryPaymentTransactionAdmin)
admin.site.register(TransactionCaution, TransactionCautionAdmin)
admin.site.register(TransactionPaypal, TransactionPaypalAdmin)
admin.site.register(WithdrawTransaction, WithdrawTransactionAdmin)
admin.site.register(WithdrawRequest, WithdrawRequestAdmin)
admin.site.register(AdminTransaction, AdminTransactionAdmin)