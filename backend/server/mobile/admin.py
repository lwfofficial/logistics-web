# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin
from models import InstantDeliveryOrder


class InstantDeliveryOrderAdmin(admin.ModelAdmin):
    model = InstantDeliveryOrder
    ordering = ('-id',)

    list_display = [
        'id',
        'dateCreated',
        'state',
        'buyer',
        'courier',
        'sender',
        'expired'
    ]


admin.site.register(InstantDeliveryOrder, InstantDeliveryOrderAdmin)