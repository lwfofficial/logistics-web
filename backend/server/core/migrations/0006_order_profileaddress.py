# -*- coding: utf-8 -*-
# Generated by Django 1.11.15 on 2018-10-10 14:43
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_auto_20181010_1435'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='profileAddress',
            field=models.CharField(default='', max_length=255),
        ),
    ]
