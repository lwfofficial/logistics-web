# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf import settings
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User
from django.db import models

from admin_widgets import AdminImageFileWidget
# Register your models here.
from core.models import Profile, Notification, Address, Currency, Order, Issue, Chat, Configuration, OrderTrackingInfo, \
    PartnerCourierPrice, PartnerCourier, PartnerCourierDestinationZone, \
    PartnerCourierOriginDestinationZone, ClosedBetaEmailAddress, NewsLetterEmailAddress, Service

issueStatus = settings.ISSUE_STATUS.copy()


class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'
    readonly_fields = [
        'addresses',
        'keyExpires',
        'termsAgreement',
        'activationKey',
        'verificationCode',
        'ssn',
        'accountTier',
        'oneSignalPlayerId',
        'oneSignalPushToken',
    ]

    formfield_overrides = {
        models.ImageField: {'widget': AdminImageFileWidget},
    }


class CustomUserAdmin(UserAdmin):
    inlines = (ProfileInline,)

    def catch_bc(self, obj):
        html = ''
        if obj.id:
            if settings.REST_FRAMEWORK_CUSTOM_PATH != '':
                html += '<a href="/%s/admin/catch_user_bc.html?userId=%s" class="colorbox">Catch</a>' % (
                    settings.REST_FRAMEWORK_CUSTOM_PATH,
                    obj.id
                )
            else:
                html += '<a href="/admin/catch_user_bc.html?userId=%s" class="colorbox">Catch</a>' % (
                    obj.id
                )
        return html

    def send_bc(self, obj):
        html = ''
        if obj.id:
            if settings.REST_FRAMEWORK_CUSTOM_PATH != '':
                html += '<a href="/%s/admin/send_user_bc.html?userId=%s" class="colorbox">Send</a>' % (
                    settings.REST_FRAMEWORK_CUSTOM_PATH,
                    obj.id
                )
            else:
                html += '<a href="/admin/send_user_bc.html?userId=%s" class="colorbox">Send</a>' % (
                    obj.id
                )
        return html

    def documents(self, obj):
        html = ''
        if obj.id:
            if settings.REST_FRAMEWORK_CUSTOM_PATH != '':
                html += '<a href="/%s/admin/verification.html?userId=%s" class="colorbox">Verification</a>' % (
                    settings.REST_FRAMEWORK_CUSTOM_PATH,
                    obj.id
                )
            else:
                html += '<a href="/admin/verification.html?userId=%s" class="colorbox">Verification</a>' % (
                    obj.id
                )
        return html

    catch_bc.allow_tags = True
    send_bc.allow_tags = True
    documents.allow_tags = True

    list_display = [
        'username',
        'email',
        'first_name',
        'last_name',
        'is_active',
        'catch_bc',
        'send_bc',
        'documents'
    ]
    search_fields = [
        'username',
        'first_name',
        'last_name'
    ]

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return list()
        return super(CustomUserAdmin, self).get_inline_instances(request, obj)


class AddressAdmin(admin.ModelAdmin):
    model = Address
    list_display = [
        'city',
        'zipCode',
        'country'
    ]
    search_fields = [
        'city',
        'zipCode',
        'country'
    ]


class NotificationAdmin(admin.ModelAdmin):
    model = Notification
    verbose_name_plural = 'Notifications'
    ordering = ('-id',)
    list_display = [
        'id',
        'user',
        'dateCreated',
        'email',
        'emailNotified',
        'sms',
        'smsNotified',
        'alert',
        'alertNotified'
    ]
    search_fields = ['dateCreated', 'email', 'sms', 'alert', 'user']


class CurrencyAdmin(admin.ModelAdmin):
    model = Currency
    verbose_name_plural = 'Currencies'
    ordering = ('-id',)
    list_display = [
        'id',
        'code',
        'dateUpdated',
        'usd',
        'eur',
    ]
    search_fields = ['code']


class ServiceAdmin(admin.ModelAdmin):
    model = Service
    verbose_name_plural = 'Services'
    ordering = ('-id',)


class PartnerCourierPriceAdmin(admin.ModelAdmin):
    model = PartnerCourierPrice
    verbose_name_plural = 'Courier Prices'
    ordering = ('-id',)
    list_display = [
        'id',
        'partnerCourier',
        'weight',
        'zone',
        'price',
        'type',
    ]
    search_fields = [
        'weight',
        'zone',
        'price',
        'type',
    ]


class PartnerCourierAdmin(admin.ModelAdmin):
    model = PartnerCourier
    verbose_name_plural = 'Partner Courier'
    ordering = ('-id',)

    def updatePrices(self, obj):
        html = ''
        if obj.id:
            if settings.REST_FRAMEWORK_CUSTOM_PATH != '':
                html += '<a href="/%s/admin/courier_manage_prices.html?partnerCourierId=%s" class="colorbox_big">Update Prices</a>' % (
                    settings.REST_FRAMEWORK_CUSTOM_PATH,
                    obj.id
                )
            else:
                html += '<a href="/admin/courier_manage_prices.html?partnerCourierId=%s" class="colorbox_big">Update Prices</a>' % (
                    obj.id
                )
        return html

    updatePrices.allow_tags = True

    list_display = [
        'id',
        'dateCreated',
        'name',
        'updatePrices'
    ]
    search_fields = ['name']


class ConfigurationAdmin(admin.ModelAdmin):
    model = Configuration
    ordering = ('-key',)
    list_display = [
        'key',
        'value',
    ]
    search_fields = [
        'key',
        'value'
    ]


class OrderAdmin(admin.ModelAdmin):
    model = Order
    ordering = ('-id',)

    def service_type(self, obj):
        html = ''
        if (obj):
            html = obj.service.type
        return html

    def forwarder(self, obj):
        html = ''
        if (obj):
            html = obj.service.profile.user
        return html

    def buyer(self, obj):
        html = ''
        if (obj):
            html = obj.profile.user
        return html

    def manageNotes(self, obj):
        html = ''
        if obj.id:
            if settings.REST_FRAMEWORK_CUSTOM_PATH != '':
                html += '<a href="/%s/admin/orders_manage_notes.html?orderId=%s" class="colorbox_big">Manage Notes</a>' % (
                    settings.REST_FRAMEWORK_CUSTOM_PATH,
                    obj.id
                )
            else:
                html += '<a href="/admin/orders_manage_notes.html?orderId=%s" class="colorbox_big">Manage Notes</a>' % (
                    obj.id
                )
        return html

    manageNotes.allow_tags = True

    list_display = [
        'id',
        'dateCreated',
        'state',
        'service_type',
        'buyer',
        'forwarder',
        'manageNotes'
    ]


class IssueAdmin(admin.ModelAdmin):
    model = Issue
    ordering = ('-id',)

    def issue_manage(self, obj):
        html = ''
        if obj.id:
            if obj.state == issueStatus['OPEN']:
                if settings.REST_FRAMEWORK_CUSTOM_PATH != '':
                    html += '<a href="/%s/admin/issue_manage.html?issueId=%s" class="colorbox_big">Manage</a>' % (
                        settings.REST_FRAMEWORK_CUSTOM_PATH,
                        obj.id
                    )
                else:
                    html += '<a href="/admin/issue_manage.html?issueId=%s" class="colorbox_big">Manage</a>' % (
                        obj.id
                    )
        return html

    issue_manage.allow_tags = True

    list_display = [
        'id',
        'dateCreated',
        'type',
        'state',
        'issue_manage'
    ]


class ChatAdmin(admin.ModelAdmin):
    model = Chat
    ordering = ('-id',)


class OrderTrackingInfoAdmin(admin.ModelAdmin):
    model = OrderTrackingInfo
    ordering = ('-id',)


class ClosedBetaEmailAddressAdmin(admin.ModelAdmin):
    model = ClosedBetaEmailAddress
    ordering = ('-id',)

    list_display = [
        'id',
        'email',
    ]

class NewsLetterEmailAddressAdmin(admin.ModelAdmin):
    model = NewsLetterEmailAddress
    ordering = ('-id',)

    list_display = [
        'id',
        'email',
    ]


class PartnerCourierDestinationZoneAdmin(admin.ModelAdmin):
    model = PartnerCourierDestinationZone
    ordering = ('-id',)

    search_fields = [
        'zone',
        'destinationCountryName'
    ]


class PartnerCourierOriginDestinationZoneAdmin(admin.ModelAdmin):
    model = PartnerCourierOriginDestinationZone
    ordering = ('-id',)

    search_fields = [
        'zone',
        'originArea',
        'destinationArea'
    ]


admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Address, AddressAdmin)
admin.site.register(Notification, NotificationAdmin)
admin.site.register(Currency, CurrencyAdmin)
admin.site.register(Configuration, ConfigurationAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(OrderTrackingInfo, OrderTrackingInfoAdmin)
admin.site.register(Issue, IssueAdmin)
admin.site.register(Chat, ChatAdmin)
admin.site.register(Service, ServiceAdmin)
admin.site.register(PartnerCourierPrice, PartnerCourierPriceAdmin)
admin.site.register(PartnerCourier, PartnerCourierAdmin)
admin.site.register(ClosedBetaEmailAddress, ClosedBetaEmailAddressAdmin)
admin.site.register(NewsLetterEmailAddress, NewsLetterEmailAddressAdmin)
admin.site.register(PartnerCourierDestinationZone, PartnerCourierDestinationZoneAdmin)
admin.site.register(PartnerCourierOriginDestinationZone, PartnerCourierOriginDestinationZoneAdmin)
