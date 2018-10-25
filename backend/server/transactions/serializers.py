from rest_framework import serializers

from core.serializers import UserSerializer
from transactions.models import CryptoCurrencyAddress, Transaction, LWFTransaction, WithdrawTransaction, Wallet, \
    TransactionPaypal, PaymentTransaction


class CryptoCurrencyAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CryptoCurrencyAddress
        fields = ['address']


class WalletSerializer(serializers.ModelSerializer):
    credit = serializers.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        model = Wallet
        exclude = ['profile']


class TransactionSerializer(serializers.ModelSerializer):
    address = CryptoCurrencyAddressSerializer(read_only=True)

    class Meta:
        model = Transaction
        exclude = ['wallet']


class TransactionPaypalSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransactionPaypal
        exclude = ['wallet']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        exclude = ['wallet']


class LWFTransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = LWFTransaction


class WithdrawTransactionSerializer(LWFTransactionSerializer):
    class Meta(LWFTransactionSerializer.Meta):
        model = WithdrawTransaction
        fields = '__all__'
