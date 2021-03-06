# -*- coding: utf-8 -*-
# Generated by Django 1.11.8 on 2018-09-14 10:15
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('transactions', '0009_auto_20180906_1400'),
    ]

    operations = [
        migrations.CreateModel(
            name='WalletToCCA',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('assignedDate', models.DateTimeField(default=django.utils.timezone.now)),
            ],
        ),
        migrations.RemoveField(
            model_name='cryptocurrencyaddress',
            name='assigned',
        ),
        migrations.RemoveField(
            model_name='cryptocurrencyaddress',
            name='assignedDate',
        ),
        migrations.RemoveField(
            model_name='cryptocurrencyaddress',
            name='username',
        ),
        migrations.RemoveField(
            model_name='wallet',
            name='addresses',
        ),
        migrations.AddField(
            model_name='wallettocca',
            name='address',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.CASCADE, to='transactions.CryptoCurrencyAddress'),
        ),
        migrations.AddField(
            model_name='wallettocca',
            name='wallet',
            field=models.ForeignKey(editable=False, on_delete=django.db.models.deletion.CASCADE, to='transactions.Wallet'),
        ),
    ]
