# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import django
from django.conf import settings
from django.db import models
from django.utils.crypto import random

issueStatus = settings.ISSUE_STATUS.copy()

from core.models import Location, TimeSlot, Profile, Chat


class InstantDeliveryCourier(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Create DateTime"
    )
    dateUpdated = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Create DateTime"
    )
    acceptedPacksFromPrivate = models.BooleanField(default=False)
    acceptedPacksFromCompany = models.BooleanField(default=False)
    enableNewRequests = models.BooleanField(default=True)
    profile = models.ForeignKey(Profile)
    pickUpLocationCity = models.CharField(
        max_length=255,
        default='',
        blank=True
    )
    pickUpLocationAddress = models.CharField(
        max_length=255,
        default='',
        blank=True
    )
    pickUpLocationLat = models.FloatField(default=0.0)
    pickUpLocationLng = models.FloatField(default=0.0)
    priceRange10Km = models.FloatField(default=0.0)
    enableRange10Km = models.BooleanField(default=False)
    priceRange20Km = models.FloatField(default=0.0)
    enableRange20Km = models.BooleanField(default=False)
    priceRange50Km = models.FloatField(default=0.0)
    enableRange50Km = models.BooleanField(default=False)
    priceRangeMore50Km = models.FloatField(default=0.0)
    enableRangeMore50Km = models.BooleanField(default=False)


class InstantDeliveryOrder(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Create DateTime"
    )
    dateUpdated = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Create DateTime"
    )
    buyer = models.ForeignKey(Profile, related_name='instant_buyer')
    courier = models.ForeignKey(Profile, related_name='instant_courier', null=True)
    sender = models.CharField(max_length=50, default='', blank=True)
    locationFromCity = models.CharField(max_length=50, default='', blank=True)
    locationFromAddress = models.CharField(max_length=255, default='', blank=True)
    locationFromLat = models.FloatField(default=0.0)
    locationFromLng = models.FloatField(default=0.0)
    receiver = models.CharField(max_length=50, default='', blank=True)
    locationToCity = models.CharField(max_length=50, default='', blank=True)
    locationToAddress = models.CharField(max_length=255, default='', blank=True)
    locationToLat = models.FloatField(default=0.0)
    locationToLng = models.FloatField(default=0.0)
    pickupFrom = models.TimeField(null=True)
    pickupTo = models.TimeField(null=True)
    deliveryFrom = models.TimeField(null=True)
    deliveryTo = models.TimeField(null=True)
    state = models.CharField(
        max_length=25,
        default=settings.ORDER_INSTANT_DELIVERY_STATUS['new'],
        choices=settings.ORDER_INSTANT_DELIVERY_STATUS_CHOICES
    )
    isUrgent = models.BooleanField(default=False)
    numberOfSmallBoxes = models.IntegerField(default=0)
    numberOfMediumBoxes = models.IntegerField(default=0)
    numberOfLargeBoxes = models.IntegerField(default=0)
    priceRange = models.FloatField(default=0.0)
    distance = models.FloatField(default=0.0)
    notes = models.CharField(max_length=500, default='', null=True, blank=True)
    expired = models.BooleanField(default=False)
    courierPIN = models.IntegerField(default=0)
    collectPIN = models.IntegerField(default=0)
    deliveryConfirmationPIN = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Instant Delivery Order'
        verbose_name_plural = 'Instant Delivery Orders'

    def __unicode__(self):
        return "%d" % self.id

    def setCourierPIN(self):
        self.courierPIN = ''.join(random.sample('0123456789', settings.MOBILE_ORDER_PIN_DIGITS))

    def setCollectPIN(self):
        self.collectPIN = ''.join(random.sample('0123456789', settings.MOBILE_ORDER_PIN_DIGITS))

    def setDeliveryConfirmationPIN(self):
        self.deliveryConfirmationPIN = ''.join(random.sample('0123456789', settings.MOBILE_ORDER_PIN_DIGITS))

    def generatePINs(self):
        self.setCourierPIN()
        self.setCollectPIN()
        self.setDeliveryConfirmationPIN()

    @property
    def feedback(self):
        feedback = {}
        try:
            buyerFeedback = InstantDeliveryOrderFeedback.objects.get(order=self, profile=self.buyer)
            feedback['buyer'] = {
                'score': "{:.2f}".format(buyerFeedback.score),
                'text': buyerFeedback.text
            }
        except InstantDeliveryOrderFeedback.DoesNotExist:
            feedback['buyer'] = None
        try:
            forwarderFeedback = InstantDeliveryOrderFeedback.objects.get(order=self, profile=self.courier)
            feedback['courier'] = {
                'score': "{:.2f}".format(forwarderFeedback.score),
                'text': forwarderFeedback.text
            }
        except InstantDeliveryOrderFeedback.DoesNotExist:
            feedback['courier'] = None
        return feedback


class InstantDeliveryOrderFeedback(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    score = models.FloatField(default=0)
    text = models.TextField(
        null=True,
        blank=True
    )
    order = models.ForeignKey(InstantDeliveryOrder)
    profile = models.ForeignKey(Profile)

    @property
    def username(self):
        return self.profile.user.username


class InstantDeliveryOrderIssue(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    type = models.IntegerField(
        choices=settings.ISSUE_TYPES_CHOICES
    )
    description = models.TextField(max_length=500, default='')
    state = models.CharField(
        max_length=25,
        default=issueStatus['OPEN'],
        choices=settings.ISSUE_STATUS_CHOICES
    )
    profile = models.ForeignKey(Profile)
    order = models.ForeignKey(InstantDeliveryOrder)
    chat = models.ForeignKey(Chat)

    def __unicode__(self):
        return "%d" % self.id

    class Meta:
        verbose_name = 'Issue'
        verbose_name_plural = 'Issues'
