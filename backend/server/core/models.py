# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import datetime
import functools
import hashlib
import os
import random
import uuid

# Create your models here.
import django
from django.conf import settings
from django.core.mail import EmailMessage
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.template.loader import render_to_string
from rest_framework.authtoken.models import Token

issueStatus = settings.ISSUE_STATUS.copy()


class AccountTier(object):
    TIER_0 = 'TIER_0'
    TIER_1 = 'TIER_1'
    TIER_2 = 'TIER_2'
    TIER_3 = 'TIER_3'


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)


def getDefaultAvatarImageData():
    imgstr = open(settings.DEFAULT_AVATAR_IMAGE_PATH, 'r').read()
    return imgstr


class Address(models.Model):
    street = models.CharField(max_length=255, null=True)
    city = models.CharField(max_length=255, null=True)
    zipCode = models.CharField(max_length=255, null=True)
    region = models.CharField(max_length=255, null=True)
    country = models.CharField(max_length=255, null=True)

    class Meta:
        verbose_name = 'Location address'
        verbose_name_plural = 'Location addresses'

    def __unicode__(self):
        return "%s, %s (%s)" % (
            self.city if self.city else "No city",
            self.zipCode if self.zipCode else "No zipCode",
            self.country if self.country else "No country",
        )


class Profile(models.Model):
    user = models.OneToOneField('auth.User', related_name='profile')
    activationKey = models.CharField(max_length=40)
    verificationCode = models.CharField(max_length=6, default='0000')
    keyExpires = models.DateTimeField()
    dob = models.DateField(null=True)
    ssn = models.CharField(default=None, max_length=255, null=True, unique=True)
    mobile = models.CharField(default='', max_length=255)
    mobileVerified = models.BooleanField(default=False)
    enable2FASMS = models.BooleanField(default=False)
    enable2FAGoogle = models.BooleanField(default=False)
    termsAgreement = models.BooleanField(default=False)
    accountTier = models.CharField(max_length=6, default=AccountTier.TIER_0)
    feedback = models.FloatField(default=0.000)
    avatarImage = models.ImageField(
        upload_to='avatar/',
        null=True,
        blank=True
    )
    IDDocFrontImage = models.ImageField(
        upload_to='id_docs_front/',
        null=True,
        blank=True
    )
    IDDocBackImage = models.ImageField(
        upload_to='id_docs_back/',
        null=True,
        blank=True
    )
    docVerified = models.BooleanField(default=False)
    ProofOfresidenceImage = models.ImageField(
        upload_to='por_docs/',
        null=True,
        blank=True
    )
    ProofOfresidenceVerified = models.BooleanField(default=False)
    SelfIDocImage = models.ImageField(
        upload_to='self_id_docs/',
        null=True,
        blank=True
    )
    SelfIDocVerified = models.BooleanField(default=False)

    defaultAddress = models.ForeignKey(Address, related_name="default_address", null=True)

    addresses = models.ManyToManyField(Address)

    oneSignalPlayerId = models.CharField(
        null=True,
        editable=False,
        max_length=255
    )

    oneSignalPushToken = models.CharField(
        null=True,
        editable=False,
        max_length=255
    )

    languageSetting = models.CharField(
        max_length=40,
        choices=settings.PROFILE_LANGUAGE_SETTINGS,
        default=settings.PROFILE_LANGUAGE_SETTINGS[0][0]
    )
    currencySetting = models.CharField(
        max_length=40,
        choices=settings.PROFILE_CURRENCY_SETTINGS,
        default=settings.PROFILE_CURRENCY_SETTINGS[0][0]
    )
    measuresSetting = models.CharField(
        max_length=40,
        choices=settings.PROFILE_MEASURE_SETTINGS,
        default=settings.PROFILE_MEASURE_SETTINGS[0][0]
    )

    def setActivationKey(self):
        self.activationKey = hashlib.md5(os.urandom(128)).hexdigest()

    def setVerificationCode(self):
        self.verificationCode = ''.join(random.sample('0123456789', 4))

    def setKeyExpires(self):
        self.keyExpires = datetime.datetime.strftime(datetime.datetime.now() + datetime.timedelta(hours=settings.PROFILE_ACTIVATION_KEY_EXPIRE_TIMEOUT),
                                                     "%Y-%m-%d %H:%M:%S")

    def isForwarder(self):
        if self.docVerified and \
                self.ProofOfresidenceVerified and \
                self.SelfIDocVerified:
            return True
        return False

    def forwarderData(self):
        forwarder_data = {
            'verified': False,
            'feedback': 0,
            'level': 1,
            'caution': 0.00,
            'maxGoodValue': 0,
            'servicesLimits': [
                {
                    'type': settings.SERVICE_TYPES[0][0],
                    'name': settings.SERVICE_TYPES[0][1],
                    'description': 'Forwarding',
                    'used': 0,
                    'total': 0
                },
                {
                    'type': settings.SERVICE_TYPES[1][0],
                    'name': settings.SERVICE_TYPES[1][1],
                    'description': 'Package',
                    'used': 0,
                    'total': 0
                },
                {
                    'type': settings.SERVICE_TYPES[2][0],
                    'name': settings.SERVICE_TYPES[2][1],
                    'description': 'Express delivery',
                    'used': 0,
                    'total': 0
                }
            ]
        }

        # STATUS
        forwarder_data['verified'] = self.isForwarder()

        # ORDERS
        orders = Order.objects.filter(
            service__profile=self
        )
        for o in orders:
            if o.service.type == settings.SERVICE_TYPES[0][0]:
                forwarder_data['servicesLimits'][0]['used'] += 1
            elif o.service.type == settings.SERVICE_TYPES[1][0]:
                forwarder_data['servicesLimits'][1]['used'] += 1
            elif o.service.type == settings.SERVICE_TYPES[2][0]:
                forwarder_data['servicesLimits'][2]['used'] += 1

        forwarder_data['maxGoodValue'] = self.wallet.deposit * 3

        return forwarder_data

    @property
    def buyerFeedback(self):
        return OrderFeedback.objects \
                   .filter(order__profile=self) \
                   .order_by("-dateCreated") \
                   .exclude(profile=self).distinct()[:5]

    @property
    def forwarderFeedback(self):
        return OrderFeedback.objects \
                   .filter(order__service__profile=self) \
                   .order_by("-dateCreated") \
                   .exclude(profile=self).distinct()[:5]

    def __unicode__(self):
        return "%s %s" % (
            self.user.first_name if self.user.first_name else "Empty First Name",
            self.user.last_name if self.user.last_name else "Empty Last Name",
        )


class TimeSlot(models.Model):
    start = models.TimeField()
    end = models.TimeField()


class Location(models.Model):
    name = models.CharField(max_length=40, default='', null=True, blank=True)
    countryCode = models.CharField(max_length=40, default='', null=True, blank=True)
    street = models.CharField(max_length=40, default='', null=True, blank=True)
    zipcode = models.CharField(max_length=40, default='', null=True, blank=True)
    lat = models.FloatField(default=0.0, null=True)
    lng = models.FloatField(default=0.0, null=True)


class Service(models.Model):
    created = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Create DateTime"
    )
    updated = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Create DateTime"
    )
    profile = models.ForeignKey(Profile)
    type = models.CharField(
        max_length=25,
        choices=settings.SERVICE_TYPES
    )
    title = models.CharField(max_length=100, default='')
    enabled = models.BooleanField(default=False)
    profileForwarderAddress = models.CharField(
        max_length=255,
        default='',
    )
    locationFrom = models.ForeignKey(Location, related_name='location_from', null=True)
    locationTos = models.ManyToManyField(Location, related_name='location_tos')
    maxSize = models.IntegerField(default=0)
    maxWeight = models.IntegerField(default=0)
    totalAssurance = models.BooleanField(default=False)
    acceptedPacksFromPrivate = models.BooleanField(default=False)
    acceptedPacksFromCompany = models.BooleanField(default=False)
    addPartnerForwarder = models.BooleanField(default=False)
    partnerForwarderMargin = models.FloatField(default=0.00000)
    addOtherPartner = models.BooleanField(default=False)
    otherCourierPartnerName = models.CharField(max_length=100, default='', null=True, blank=True)
    price = models.FloatField(default=0.0)
    priceCheap = models.FloatField(default=0.0)
    priceStandard = models.FloatField(default=0.0)
    priceExpress = models.FloatField(default=0.0)
    priceCheapEnabled = models.BooleanField(default=True)
    priceStandardEnabled = models.BooleanField(default=False)
    priceExpressEnabled = models.BooleanField(default=False)
    timeSlots = models.ManyToManyField(TimeSlot)
    sunday = models.BooleanField(default=False)
    monday = models.BooleanField(default=False)
    tuesday = models.BooleanField(default=False)
    wednesday = models.BooleanField(default=False)
    thursday = models.BooleanField(default=False)
    friday = models.BooleanField(default=False)
    saturday = models.BooleanField(default=False)
    deliveryOnDawn = models.BooleanField(default=False)
    deliveryOnMorning = models.BooleanField(default=False)
    deliveryOnLunchTime = models.BooleanField(default=False)
    deliveryOnAfternoon = models.BooleanField(default=False)
    deliveryOnEvening = models.BooleanField(default=False)
    deliveryOnNight = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Service'
        verbose_name_plural = 'Services'

    def __init__(self, *args, **kwargs):
        super(Service, self).__init__(*args, **kwargs)
        self._lowestPrice = 0

    def __unicode__(self):
        return "%s | %s" % (
            self.type if self.type else "No type set",
            self.profile if self.profile else "No profile set",
        )

    @property
    def lowestPrice(self):
        return self._lowestPrice

    @property
    def highestPrice(self):
        if self.priceExpressEnabled:
            return self.priceExpress
        elif self.priceStandardEnabled:
            return self.priceStandard
        return self.priceCheap

    @lowestPrice.setter
    def lowestPrice(self, value):
        self._lowestPrice = value

    def setLowestPrice(self, shippingWeight, originCountry, destinationCountry, margin=0.0):
        if self.addPartnerForwarder:
            try:
                self._lowestPrice = self.computeExpressCosts(
                    shippingWeight,
                    originCountry,
                    destinationCountry,
                    margin=margin
                )
                self._lowestPrice = functools.reduce(lambda a, b: a + b, map(lambda p: p['amount'], self._lowestPrice))
                self._lowestPrice = Service.eurToUsdConversion(self._lowestPrice)
            except Exception as e:
                print(e.message)
                self._lowestPrice = 0
        elif self.priceCheapEnabled:
            self._lowestPrice = self.priceCheap
        elif self.priceStandardEnabled:
            self._lowestPrice = self.priceStandard
        else:
            self._lowestPrice = self.priceExpress

    @staticmethod
    def eurToUsdConversion(eurAmount):
        btcCurrency = Currency().getCurrency('BTC')
        return eurAmount * (btcCurrency.usd / btcCurrency.eur)

    @staticmethod
    def usdToEuroConversion(usdAmount):
        btcCurrency = Currency().getCurrency('BTC')
        return usdAmount * (btcCurrency.eur / btcCurrency.usd)

    @staticmethod
    def computeStandardCosts(shippingWeight, originCountry, destinationCountry, margin=0.0):
        dhlWeight = float(shippingWeight)
        dhlCourier = PartnerCourier.objects.get(name=settings.DEFAULT_FORWARDER_PARTNER_NAME)
        gasCostConfiguration = Configuration.objects.get(
            key__iexact='courier_partner_gas_percentage'
        )
        dutyCostConfiguration = Configuration.objects.get(
            key__iexact='courier_partner_duty_percentage'
        )
        vatCostConfiguration = Configuration.objects.get(
            key__iexact='courier_partner_vat_percentage'
        )
        destinationZone = PartnerCourierDestinationZone.objects.get(
            partnerCourier=dhlCourier,
            destinationCountryName=originCountry
        )
        zone = destinationZone.zone
        price = PartnerCourierPrice.objects.get(partnerCourier=dhlCourier,
                                                zone=zone,
                                                type=settings.SERVICE_PRICE_TYPES[1][0],
                                                weight=dhlWeight)

        dhlImportPrice = price.price
        dhlImportGasCost = dhlImportPrice * float(gasCostConfiguration.value) / 100
        dhlImportVATCost = dhlImportPrice * float(vatCostConfiguration.value) / 100
        dhlImportDutyCost = dhlImportPrice * float(dutyCostConfiguration.value) / 100
        dhlImportPriceTotal = dhlImportPrice + dhlImportGasCost + dhlImportVATCost + dhlImportDutyCost

        destinationZone = PartnerCourierDestinationZone.objects.get(
            partnerCourier=dhlCourier,
            destinationCountryName=destinationCountry
        )
        zone = destinationZone.zone
        price = PartnerCourierPrice.objects.get(partnerCourier=dhlCourier,
                                                zone=zone,
                                                type=settings.SERVICE_PRICE_TYPES[1][0],
                                                weight=dhlWeight)
        dhlExportPrice = price.price
        dhlExportGasCost = dhlExportPrice * float(gasCostConfiguration.value) / 100
        dhlExportVATCost = dhlExportPrice * float(vatCostConfiguration.value) / 100
        dhlExportDutyCost = dhlExportPrice * float(dutyCostConfiguration.value) / 100
        dhlExportPriceTotal = dhlExportPrice + dhlExportGasCost + dhlExportVATCost + dhlExportDutyCost
        forwarderMargin = (dhlImportPriceTotal + dhlExportPriceTotal) * margin / 100.0
        forwarderMargin = forwarderMargin

        return [
            {
                'description': 'DHL Price To Italy',
                'amount': dhlImportPrice
            },
            {
                'description': 'DHL Fuel Price To Italy',
                'amount': dhlImportGasCost
            },
            {
                'description': 'DHL VAT Price To Italy',
                'amount': dhlImportVATCost
            },
            {
                'description': 'DHL Duty Price To Italy',
                'amount': dhlImportDutyCost
            },
            {
                'description': 'DHL Price From Italy',
                'amount': dhlExportPrice
            },
            {
                'description': 'DHL Fuel Price From Italy',
                'amount': dhlExportGasCost
            },
            {
                'description': 'DHL VAT Price From Italy',
                'amount': dhlExportVATCost
            },
            {
                'description': 'DHL Duty Price From Italy',
                'amount': dhlExportDutyCost
            },
            {
                'description': 'Forwarder Margin',
                'amount': forwarderMargin
            }
        ]

    @staticmethod
    def computeExpressCosts(shippingWeight, originCountry, destinationCountry, margin=0):
        dhlCourier = PartnerCourier.objects.get(name=settings.DEFAULT_FORWARDER_PARTNER_NAME)
        dhlWeight = float(shippingWeight)
        gasCostConfiguration = Configuration.objects.get(
            key__iexact='courier_partner_vat_percentage_3C'
        )
        originArea = PartnerCourierArea.objects.get(partnerCourier=dhlCourier, countryName=originCountry)
        destinationArea = PartnerCourierArea.objects.get(
            partnerCourier=dhlCourier,
            countryName=destinationCountry
        )
        zone = PartnerCourierOriginDestinationZone.objects.get(originArea=originArea.areaName,
                                                               destinationArea=destinationArea.areaName)

        price = PartnerCourierPrice.objects.get(partnerCourier=dhlCourier,
                                                zone=zone.zone,
                                                type=settings.SERVICE_PRICE_TYPES[2][0],
                                                weight=dhlWeight)
        dhlPriceGasCost = price.price * float(gasCostConfiguration.value) / 100
        dhlPriceTotal = price.price + dhlPriceGasCost

        forwarderMargin = dhlPriceTotal * margin / 100

        return [
            {
                'description': 'DHL Price',
                'amount': price.price
            },
            {
                'description': 'DHL Fuel Cost',
                'amount': dhlPriceGasCost
            },
            {
                'description': 'Forwarder Margin',
                'amount': forwarderMargin
            },

        ]


class Order(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Create DateTime"
    )
    estimatedDate = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Estimated DateTime"
    )
    forwarderDeliveryDate = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Estimated Delivery DateTime"
    )
    collectorDeliveryDate = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Collector Delivery DateTime"
    )
    forwardedDate = models.DateTimeField(
        null=True,
        blank=False,
        verbose_name="Forwarded DateTime"
    )
    goodType = models.IntegerField(default=0)
    shippingMode = models.IntegerField(default=0)
    totalPrice = models.FloatField(default=0)
    shippingModePrice = models.FloatField(default=0)
    shippingWeight = models.FloatField(default=0)
    totalInsurance = models.BooleanField(default=False)
    state = models.CharField(
        max_length=25,
        default=settings.ORDER_STATUS['new'],
        choices=settings.ORDER_STATUS_CHOICES
    )
    code = models.CharField(max_length=25, default='')
    refuseReason = models.TextField(
        null=True,
        blank=True
    )
    goodValue = models.FloatField(default=0.0)
    currency = models.CharField(
        max_length=4,
        choices=settings.PROFILE_CURRENCY_SETTINGS,
        default=settings.PROFILE_CURRENCY_SETTINGS[0][0]
    )
    parcelSize = models.IntegerField(default=0)
    parcelWeight = models.IntegerField(default=0)
    buyGoodsFrom = models.BooleanField(default=False)
    deliveryAddress = models.CharField(
        max_length=255,
        default=''
    )
    profileForwarderAddress = models.CharField(
        max_length=255,
        default=''
    )

    profile = models.ForeignKey(Profile)
    service = models.ForeignKey(Service)

    @property
    def eta(self):
        delta = django.utils.timezone.now() - self.dateCreated
        return delta.days

    @property
    def forwarder(self):
        return self.service.profile.user.username

    @property
    def notes(self):
        return OrderNote.objects.filter(order=self).order_by("-dateCreated").distinct()

    @property
    def trackings(self):
        return OrderTrackingInfo.objects.filter(order=self).order_by("-dateCreated").distinct()

    @property
    def issue(self):
        try:
            issue = Issue.objects.get(order=self, state=issueStatus['OPEN'])
            return issue.id
        except Issue.DoesNotExist:
            return False

    @property
    def feedback(self):
        feedback = {}
        try:
            buyerFeedback = OrderFeedback.objects.get(order=self, profile=self.profile)
            feedback['buyer'] = {
                'score': "{:.2f}".format(buyerFeedback.score),
                'text': buyerFeedback.text
            }
        except OrderFeedback.DoesNotExist:
            feedback['buyer'] = None
        try:
            forwarderFeedback = OrderFeedback.objects.get(order=self, profile=self.service.profile)
            feedback['forwarder'] = {
                'score': "{:.2f}".format(forwarderFeedback.score),
                'text': forwarderFeedback.text
            }
        except OrderFeedback.DoesNotExist:
            feedback['forwarder'] = None
        return feedback

    @property
    def forwarderGoodValue(self):
        if self.service.profile.currencySetting == 'EUR' and self.currency == 'USD':
            return Service.eurToUsdConversion(self.goodValue)
        if self.service.profile.currencySetting == 'USD' and self.currency == 'EUR':
            return Service.usdToEuroConversion(self.goodValue)
        return self.goodValue

    @property
    def buyerGoodValue(self):
        if self.profile.currencySetting == 'EUR' and self.currency == 'USD':
            return Service.eurToUsdConversion(self.goodValue)
        if self.profile.currencySetting == 'USD' and self.currency == 'EUR':
            return Service.usdToEuroConversion(self.goodValue)
        return self.goodValue

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __unicode__(self):
        return "%d" % self.id

    def computeCosts(self):
        isP2PService = self.service.type == settings.SERVICE_TYPES[0][0]
        partnerNeeded = self.service.addPartnerForwarder
        if not isP2PService or (isP2PService and not partnerNeeded):
            return [{
                'description': 'Total',
                'amount': self.service.price
            }]
        if self.shippingModePrice == 1:
            return self.service.computeStandardCosts(
                self.shippingWeight,
                self.service.profile.defaultAddress.country,
                self.profile.defaultAddress.country,
                self.service.partnerForwarderMargin
            )
        elif self.shippingModePrice == 2:
            return self.service.computeExpressCosts(
                self.shippingWeight,
                self.profile.defaultAddress.country,
                self.service.profile.defaultAddress.country,
                self.service.partnerForwarderMargin
            )
        return [{
            'description': 'Total',
            'amount': self.service.price
        }]

    def getTotal(self):
        return functools.reduce(lambda a, b: a + b, map(lambda c: c['amount'], self.computeCosts()))


class OrderFeedback(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    score = models.FloatField(default=0)
    text = models.TextField(
        null=True,
        blank=True
    )
    order = models.ForeignKey(Order)
    profile = models.ForeignKey(Profile)

    @property
    def username(self):
        return self.profile.user.username


class OrderNote(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    orderStatus = models.CharField(
        max_length=25,
        choices=settings.ORDER_STATUS_CHOICES,
        null=True
    )
    document = models.FileField(
        upload_to='order_docs_front/',
        null=True,
        blank=True
    )
    description = models.TextField(
        null=True,
        blank=True
    )
    profile = models.ForeignKey(Profile)
    order = models.ForeignKey(Order)


class OrderTrackingInfo(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    courier = models.CharField(
        max_length=100,
        choices=settings.COURIER_TYPES_CHOICES
    )
    courierOther = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )
    trn = models.CharField(
        max_length=100
    )
    link = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )
    fromForwarder = models.BooleanField(
        default=False
    )
    trackingStatus = models.CharField(
        max_length=100,
        choices=settings.ORDER_TRACKING_INFO_STATUS_CHOICES
    )

    @property
    def courierName(self):
        if self.courier == 'COURIERCUSTOM':
            return self.courierOther
        for c in settings.COURIER_TYPES_CHOICES:
            if self.courier == c[0]:
                return c[1]
        return 'Other'

    profile = models.ForeignKey(Profile)
    order = models.ForeignKey(Order)


class Event(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    description = models.TextField(
        null=True,
        blank=True
    )
    name = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )
    type = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )
    userAgent = models.TextField(
        null=True,
        blank=True
    )
    profile = models.ForeignKey(
        Profile,
        null=True
    )

    def createEvent(self, name='', type='', description='', profile=None, request=None):
        event = Event()
        event.name = name
        event.type = type
        event.description = description
        event.profile = profile
        if request:
            event.userAgent = request.META['HTTP_USER_AGENT']
            event.description += "\n%s" % (
                event.userAgent
            )
        event.save()
        return event

    class Meta:
        verbose_name = 'Event'
        verbose_name_plural = 'Events'


class Notification(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now,
        null=True,
        blank=False,
        verbose_name="Create DateTime"
    )
    email = models.BooleanField(
        default=False
    )
    sms = models.BooleanField(
        default=False
    )
    alert = models.BooleanField(
        default=False
    )
    emailNotified = models.BooleanField(
        default=False
    )
    smsNotified = models.BooleanField(
        default=False
    )
    alertNotified = models.BooleanField(
        default=False
    )
    emailSubject = models.TextField(
        null=True,
        blank=True,
        max_length=255
    )
    emailData = models.TextField(
        null=True,
        blank=True
    )
    smsData = models.TextField(
        null=True,
        blank=True
    )
    alertData = models.TextField(
        null=True,
        blank=True
    )
    user = models.ForeignKey(
        'auth.User',
        null=True,
        blank=True
    )

    def getEmailLinkBaseUrl(self):
        protocol = 'http'
        if settings.FRONTEND_SSL:
            protocol = 'https'
        url = "%s://%s:%s/" % (
            protocol,
            settings.FRONTEND_HOST,
            settings.FRONTEND_PORT,
        )
        return url

    def getEmailBaseUrl(self):
        """
        use only for backend templates rendering without a request object
        """
        if settings.BACKEND_SSL:
            protocol = 'https://'
        else:
            protocol = 'http://'

        if settings.REST_FRAMEWORK_CUSTOM_PATH != '':
            path = '/%s/' % settings.REST_FRAMEWORK_CUSTOM_PATH
        else:
            path = '/'

        url = '%s%s:%s%s' % (
            protocol,
            settings.BACKEND_HOST,
            settings.BACKEND_PORT,
            path
        )
        return url

    def getEmailHeaders(self):
        emailId = str(uuid.uuid4())
        now = datetime.datetime.now()
        headers = {
            "Date": "%s, %s %s %s %s:%s:%s -0000" % (
                datetime.datetime.strftime(now, "%a"),
                datetime.datetime.strftime(now, "%d"),
                datetime.datetime.strftime(now, "%b"),
                datetime.datetime.strftime(now, "%Y"),
                datetime.datetime.strftime(now, "%H"),
                datetime.datetime.strftime(now, "%M"),
                datetime.datetime.strftime(now, "%S")
            ),
            "Message-ID": emailId
        }
        return headers

    def setEmailData(self, subject, templatePath, extraData={}):
        self.emailSubject = subject
        extraData['baseUrl'] = self.getEmailBaseUrl()
        self.emailData = render_to_string(
            templatePath,
            extraData
        )
        self.save()
        return True

    def processEmail(self):
        if self.user:
            if self.user.email and self.emailSubject:
                emailMessage = EmailMessage(
                    subject=self.emailSubject,
                    headers=self.getEmailHeaders(),
                    body=self.emailData,
                    from_email=settings.EMAIL_DEFAULT_FROM,
                    to=[self.user.email])
                emailMessage.content_subtype = "html"
                emailMessage.send()
                self.emailNotified = True
                self.save()
                return True
        return False

    def process(self):
        if self.email:
            self.processEmail()


class Currency(models.Model):
    """
    Class for all Currencies
    """
    dateUpdated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    code = models.CharField(
        unique=True,
        null=True,
        max_length=20
    )
    usd = models.FloatField(
        default=0.000
    )
    eur = models.FloatField(
        default=0.000
    )

    def getCurrency(self, code):
        """
        Get requested currency
        :param code: string
        :return: self
        """
        if code:
            try:
                c = Currency.objects.get(
                    code__iexact=code
                )
                return c
            except:
                c = None

        return None

    class Meta:
        verbose_name = 'Currency'
        verbose_name_plural = 'Currencies'


class Chat(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    admin = models.ForeignKey('auth.User', related_name="admin")
    buyer = models.ForeignKey('auth.User', related_name="buyer")
    forwarder = models.ForeignKey('auth.User', related_name="forwarder")

    @property
    def messages(self):
        return ChatMessage.objects.filter(chat=self).order_by("dateCreated").distinct()

    class Meta:
        verbose_name = 'Chat'
        verbose_name_plural = 'Chats'


class ChatMessage(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    sender = models.ForeignKey('auth.User', related_name="sender")
    text = models.TextField(max_length=500, default='')
    image = models.ImageField(
        upload_to='issue_doc/',
        null=True,
        blank=True
    )
    chat = models.ForeignKey(Chat)

    @property
    def senderAvatar(self):
        try:
            profile = Profile.objects.get(user=self.sender)
            return profile.avatarImage
        except Profile.DoesNotExist:
            return None

    @property
    def adminMessage(self):
        # TODO: define a default user group to manage issues
        return self.sender.username == 'admin'

    class Meta:
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'


class Issue(models.Model):
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
    order = models.ForeignKey(Order)
    chat = models.ForeignKey(Chat)

    def __unicode__(self):
        return "%d" % self.id

    class Meta:
        verbose_name = 'Issue'
        verbose_name_plural = 'Issues'


class Configuration(models.Model):
    key = models.CharField(
        null=False,
        blank=False,
        unique=True,
        max_length=100
    )
    value = models.TextField(
        null=False,
        blank=False
    )

    def getConfiguration(self, key):
        """
        Get requested currency
        :param key: string
        :return: value
        """
        conf = settings.CONFIGURATION_PARAMETERS.get(key)
        if conf is not None:
            try:
                overConf = Configuration.objects.get(
                    key__iexact=key
                )
            except:
                overConf = None
            if overConf:
                try:
                    conf = int(overConf.value)
                    return conf
                except:
                    pass

                try:
                    conf = float(overConf.value)
                    return conf
                except:
                    pass

                conf = overConf.value

        return conf

    def save(self, *args, **kwargs):
        if self.key:
            self.key = self.key.lower()
        super(Configuration, self).save(*args, **kwargs)

    def __unicode__(self):
        return "%s %s" % (
            self.key,
            self.value
        )

    class Meta:
        verbose_name = 'Configuration'
        verbose_name_plural = 'Configurations'


class PartnerCourier(models.Model):
    dateCreated = models.DateTimeField(
        default=django.utils.timezone.now
    )
    name = models.CharField(max_length=15, default='', unique=True)

    class Meta:
        verbose_name = 'Partner Courier'
        verbose_name_plural = 'Partner Couriers'

    def __unicode__(self):
        return self.name


class PartnerCourierArea(models.Model):
    partnerCourier = models.ForeignKey(PartnerCourier)
    countryName = models.CharField(max_length=100, default='')
    areaName = models.CharField(max_length=15, default='')


class PartnerCourierPrice(models.Model):
    partnerCourier = models.ForeignKey(PartnerCourier)
    weight = models.FloatField(default="0.0")
    price = models.FloatField(default="0.0")
    zone = models.IntegerField(default=0)
    type = models.CharField(
        max_length=25,
        default=settings.SERVICE_PRICE_TYPES[2][0],
        choices=settings.SERVICE_PRICE_TYPES
    )


class PartnerCourierOriginDestinationZone(models.Model):
    class Meta:
        verbose_name = 'Partner Courier Zone Express'
        verbose_name_plural = 'Partner Courier Zones Express'

    partnerCourier = models.ForeignKey(PartnerCourier)
    originArea = models.CharField(max_length=15, default='')
    destinationArea = models.CharField(max_length=15, default='')
    zone = models.IntegerField(default=0)

    def __unicode__(self):
        return "%s - %s -> %s (%s)" % (self.originArea, self.destinationArea, self.zone, self.partnerCourier.name)


class PartnerCourierDestinationZone(models.Model):
    class Meta:
        verbose_name = 'Partner Courier Zone Standard'
        verbose_name_plural = 'Partner Courier Zones Standard'

    partnerCourier = models.ForeignKey(PartnerCourier)
    destinationCountryName = models.CharField(max_length=55, default='')
    zone = models.IntegerField(default=0)

    def __unicode__(self):
        return "%s -> %s (%s)" % (self.destinationCountryName, self.zone, self.partnerCourier.name)


class NewsLetterEmailAddress(models.Model):
    email = models.EmailField()


class ClosedBetaEmailAddress(models.Model):
    email = models.EmailField()
