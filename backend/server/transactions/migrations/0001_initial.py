# -*- coding: utf-8 -*-
# Generated by Django 1.11.8 on 2018-05-30 14:48
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone
import transactions.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0001_initial'),
        ('mobile', '__first__'),
    ]

    operations = [
        migrations.CreateModel(
            name='CryptoCurrencyAddress',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('address', models.CharField(default=b'', max_length=255)),
                ('currency', models.CharField(default=b'', max_length=15)),
                ('assigned', models.BooleanField(default=False)),
                ('username', models.CharField(blank=True, default=b'', max_length=255, null=True)),
                ('assignedDate', models.DateTimeField(null=True)),
            ],
        ),
        migrations.CreateModel(
            name='LWFTransaction',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[(b'NEW', b'NEW'), (b'PENDING', b'PENDING'), (b'ABORTED', b'ABORTED'), (b'COMPLETED', b'COMPLETED'), (b'HOLDING', b'HOLDING')], default=(b'NEW', b'NEW'), max_length=20)),
                ('type', models.CharField(choices=[(b'PAYMENT', b'PAYMENT'), (b'WITHDRAW', b'WITHDRAW'), (b'REFUND', b'REFUND'), (b'ADMIN', b'ADMIN'), (b'2FASMS', b'2FASMS')], default=(b'PAYMENT', b'PAYMENT'), max_length=20)),
                ('dateCreated', models.DateTimeField(default=django.utils.timezone.now)),
                ('dateUpdated', models.DateTimeField(default=django.utils.timezone.now)),
                ('amount', models.FloatField(default=0.0)),
                ('feeAmount', models.FloatField(default=0.0)),
                ('feePercentage', models.FloatField(default=0.0)),
            ],
            options={
                'verbose_name': 'LWF Transaction',
                'verbose_name_plural': 'LWF Transactions',
            },
        ),
        migrations.CreateModel(
            name='LWFTransactionInfo',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.CharField(default=b'', max_length=255)),
                ('cost', models.FloatField(default=0.0)),
            ],
        ),
        migrations.CreateModel(
            name='LWFWallet',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dateCreated', models.DateTimeField(default=django.utils.timezone.now)),
                ('dateUpdated', models.DateTimeField(default=django.utils.timezone.now)),
                ('name', models.CharField(max_length=20, unique=True)),
                ('credit', models.FloatField(default=0.0)),
            ],
            options={
                'verbose_name': 'LWF Wallet',
                'verbose_name_plural': 'LWF Wallets',
            },
        ),
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('hash', models.CharField(default=b'', max_length=255)),
                ('date', models.DateTimeField(blank=True, default=None, null=True)),
                ('type', models.CharField(default=b'', max_length=10)),
                ('currency', models.CharField(default=b'', max_length=5)),
                ('amount', models.FloatField(default=0.0)),
                ('feeAmount', models.FloatField(default=0.0)),
                ('feePercentage', models.FloatField(default=0.0)),
                ('info', models.TextField(blank=True, null=True)),
                ('receiptSequence', models.CharField(default=transactions.models.uniqueUuid, editable=False, max_length=254, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='TransactionCaution',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(default=django.utils.timezone.now)),
                ('amount', models.FloatField(default=0.0)),
                ('info', models.TextField(blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Caution Deposit Transaction',
                'verbose_name_plural': 'Caution Deposit Transactions',
            },
        ),
        migrations.CreateModel(
            name='TransactionInfo',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('description', models.CharField(default=b'', max_length=255)),
                ('cost', models.FloatField(default=0.0)),
            ],
        ),
        migrations.CreateModel(
            name='TransactionsProcess',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('dateStart', models.DateTimeField(default=django.utils.timezone.now, null=True, verbose_name=b'Start DateTime')),
                ('dateEnd', models.DateTimeField(default=django.utils.timezone.now, null=True, verbose_name=b'End DateTime')),
                ('processData', models.TextField(blank=True, null=True, verbose_name=b'Process Data')),
            ],
        ),
        migrations.CreateModel(
            name='Wallet',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('deposit', models.FloatField(default=0.0)),
                ('credit', models.FloatField(default=0.0)),
                ('addresses', models.ManyToManyField(to='transactions.CryptoCurrencyAddress')),
                ('profile', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='core.Profile')),
            ],
            options={
                'verbose_name': 'Wallet',
                'verbose_name_plural': 'Wallets',
            },
        ),
        migrations.CreateModel(
            name='AdminTransaction',
            fields=[
                ('lwftransaction_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='transactions.LWFTransaction')),
                ('info', models.TextField(blank=True, null=True)),
                ('inWallet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='in_wallet_admin', to='transactions.Wallet')),
                ('outWallet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='out_wallet_admin', to='transactions.Wallet')),
            ],
            options={
                'verbose_name': 'Admin transaction',
                'verbose_name_plural': 'Admin transactions',
            },
            bases=('transactions.lwftransaction',),
        ),
        migrations.CreateModel(
            name='InstantDeliveryPaymentTransaction',
            fields=[
                ('lwftransaction_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='transactions.LWFTransaction')),
                ('info', models.TextField(blank=True, null=True)),
                ('inWallet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='instant_delivery_in_wallet', to='transactions.Wallet')),
                ('order', models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='instant_delivery_order', to='mobile.InstantDeliveryOrder')),
                ('outWallet', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='instant_delivery_out_wallet', to='transactions.Wallet')),
            ],
            options={
                'verbose_name': 'Instant Delivery Payment transaction',
                'verbose_name_plural': 'Instant Delivery Payment transactions',
            },
            bases=('transactions.lwftransaction',),
        ),
        migrations.CreateModel(
            name='PaymentTransaction',
            fields=[
                ('lwftransaction_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='transactions.LWFTransaction')),
                ('info', models.TextField(blank=True, null=True)),
                ('courierPartnerFeeAmount', models.FloatField(default=0.0)),
                ('inWallet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='in_wallet', to='transactions.Wallet')),
                ('order', models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='order', to='core.Order')),
                ('outWallet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='out_wallet', to='transactions.Wallet')),
            ],
            options={
                'verbose_name': 'Payment transaction',
                'verbose_name_plural': 'Payment transactions',
            },
            bases=('transactions.lwftransaction',),
        ),
        migrations.CreateModel(
            name='TransactionPaypal',
            fields=[
                ('transaction_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='transactions.Transaction')),
                ('paymentId', models.CharField(default=b'', max_length=255)),
            ],
            options={
                'verbose_name': 'Paypal Deposit Transaction',
                'verbose_name_plural': 'Paypal Deposit Transactions',
            },
            bases=('transactions.transaction',),
        ),
        migrations.CreateModel(
            name='Verify2FASMSTransaction',
            fields=[
                ('lwftransaction_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='transactions.LWFTransaction')),
                ('inWallet', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='in_2fasms_wallet', to='transactions.Wallet')),
            ],
            bases=('transactions.lwftransaction',),
        ),
        migrations.CreateModel(
            name='WithdrawTransaction',
            fields=[
                ('lwftransaction_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='transactions.LWFTransaction')),
                ('address', models.CharField(blank=True, max_length=254, null=True)),
                ('info', models.TextField(blank=True, null=True)),
                ('inLWFWallet', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='transactions.LWFWallet')),
                ('inWallet', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='transactions.Wallet')),
            ],
            options={
                'verbose_name': 'Withdraw transaction',
                'verbose_name_plural': 'Withdraw transactions',
            },
            bases=('transactions.lwftransaction',),
        ),
        migrations.AddField(
            model_name='transactioninfo',
            name='transaction',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='transactions.Transaction'),
        ),
        migrations.AddField(
            model_name='transactioncaution',
            name='wallet',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='transactions.Wallet'),
        ),
        migrations.AddField(
            model_name='transaction',
            name='address',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='transactions.CryptoCurrencyAddress'),
        ),
        migrations.AddField(
            model_name='transaction',
            name='wallet',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='transactions.Wallet'),
        ),
        migrations.AddField(
            model_name='lwftransactioninfo',
            name='transaction',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='transactions.LWFTransaction'),
        ),
        migrations.AddField(
            model_name='lwftransaction',
            name='user',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterUniqueTogether(
            name='transaction',
            unique_together=set([('hash', 'address')]),
        ),
    ]