# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import requests
from django.conf import settings
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Configuration
from managers import FeedbackManager
from mobile.models import InstantDeliveryOrder, InstantDeliveryOrderFeedback
from mobile.onesignal import OneSignal
from mobile.serializers import InstantDeliveryOrderSerializer
from transactions.manager import TransactionManager

orderState = settings.ORDER_INSTANT_DELIVERY_STATUS.copy()

GOOGLE_DISTANCE_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json?&origins=%s&destinations=%s&key=%s'


@api_view(['POST'])
def createOrder(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        request.data['buyer'] = profile.id
        request.data['distance'] = getDistanceInMeters(request)
        orderSerializer = InstantDeliveryOrderSerializer(data=request.data)
        if orderSerializer.is_valid():
            request.data['buyer'] = profile
            order = orderSerializer.create(request.data)
            order.save()
            inWalletId = order.buyer.wallet.id
            feePercentage = Configuration().getConfiguration(
                "forwarding_fee_percentage_level_1"
            )
            TransactionManager.createInstantDeliveryOrderPaymentTransaction(
                amount=order.priceRange,
                order=order,
                inWalletId=inWalletId,
                feePercentage=feePercentage
            )
            return Response({'success': True, 'orderId': order.id},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success': False, 'errors': orderSerializer.errors})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


def getDistanceInMeters(request):
    originLat = request.data.get('locationFromLat')
    originLng = request.data.get('locationFromLng')
    destinationLat = request.data.get('locationToLat')
    destinationLng = request.data.get('locationToLng')
    originString = "%s,%s" % (originLat, originLng)
    destinationString = "%s,%s" % (destinationLat, destinationLng)
    url = GOOGLE_DISTANCE_URL % (originString, destinationString, settings.GOOGLE_API_KEY)
    response = requests.get(url).json()
    distance = response['rows'][0]['elements'][0]['distance']['value']
    return distance


@api_view(['POST'])
def getHomeOrders(request):
    user = request.user
    order = request.data.get('order')
    if order == 'desc':
        order = ''
    else:
        order = '-'
    sort = "%s%s" % (order, request.data.get('sort'))
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        profile = Profile.objects.get(user=user)
        orders = InstantDeliveryOrder.objects.filter(
            buyer=profile,
            state__in=[
                orderState['accepted'],
                orderState['transit'],
                orderState['transit-2']
            ],
        ).order_by(sort)
        paginator = Paginator(orders, maxPerPage)
        orders = InstantDeliveryOrderSerializer(paginator.page(page), many=True, context={'request': request})
        return Response({'success': True, 'orders': orders.data, 'ordersCount': paginator.count})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def getOrders(request):
    user = request.user
    order = request.data.get('order')
    if order == 'desc':
        order = ''
    else:
        order = '-'
    sort = "%s%s" % (order, request.data.get('sort'))
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        profile = Profile.objects.get(user=user)
        orders = InstantDeliveryOrder.objects.filter(
            buyer=profile,
        ).order_by(sort)
        paginator = Paginator(orders, maxPerPage)
        orders = InstantDeliveryOrderSerializer(paginator.page(page), many=True, context={'request': request})
        return Response({'success': True, 'orders': orders.data, 'ordersCount': paginator.count})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getOrder(request, order_id):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        order = InstantDeliveryOrder.objects.get(buyer=profile, id=order_id)
        orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getCourierOrder(request, order_id):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        order = InstantDeliveryOrder.objects.get(courier=profile, id=order_id)
        orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getNewCourierOrder(request, order_id):
    user = request.user
    try:
        Profile.objects.get(user=user)
        order = InstantDeliveryOrder.objects.get(id=order_id, state='NEW')
        orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def getCourierOrders(request):
    user = request.user
    order = request.data.get('order')
    if order == 'desc':
        order = ''
    else:
        order = '-'
    sort = "%s%s" % (order, request.data.get('sort'))
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        profile = Profile.objects.get(user=user)
        orders = InstantDeliveryOrder.objects.filter(courier=profile).order_by(sort)
        paginator = Paginator(orders, maxPerPage)
        orders = InstantDeliveryOrderSerializer(paginator.page(page), many=True, context={'request': request})
        return Response({'success': True, 'orders': orders.data, 'ordersCount': paginator.count})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def getCourierHomeOrders(request):
    user = request.user
    order = request.data.get('order')
    if order == 'desc':
        order = ''
    else:
        order = '-'
    sort = "%s%s" % (order, request.data.get('sort'))
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        profile = Profile.objects.get(user=user)
        orders = InstantDeliveryOrder.objects.filter(
            courier=profile,
            state__in=[
                orderState['accepted'],
                orderState['transit'],
                orderState['transit-2']
            ],
        ).order_by(sort)
        paginator = Paginator(orders, maxPerPage)
        orders = InstantDeliveryOrderSerializer(paginator.page(page), many=True, context={'request': request})
        return Response({'success': True, 'orders': orders.data, 'ordersCount': paginator.count})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def acceptOrder(request, order_id):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        order = InstantDeliveryOrder.objects.get(id=order_id)
        order.courier = profile
        order.state = orderState['accepted']
        order.generatePINs()
        order.save()
        orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
        os = OneSignal()
        buyerPlayerId = order.buyer.oneSignalPlayerId
        if buyerPlayerId:
            if len(buyerPlayerId.replace(" ", "")) > 1:
                os.sendSpecificNotification(
                    [buyerPlayerId],
                    {
                        'headings': {
                            'en': "Lwf - Order Changed"
                        },
                        'contents': {
                            'en': "Your order has been accepted!"
                        },
                    }
                )

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def collectOrder(request, order_id):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        collectPIN = int(request.data.get('collectPIN'))
        order = InstantDeliveryOrder.objects.get(
            courier=profile,
            id=order_id,
            state=orderState['accepted']
        )
        if order.collectPIN == collectPIN:
            order.state = orderState['transit']
            order.save()
            orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
            os = OneSignal()
            buyerPlayerId = order.buyer.oneSignalPlayerId
            if buyerPlayerId:
                if len(buyerPlayerId.replace(" ", "")) > 1:
                    os.sendSpecificNotification(
                        [buyerPlayerId],
                        {
                            'headings': {
                                'en': "Lwf - Order Changed"
                            },
                            'contents': {
                                'en': "Your order is in transit!"
                            },
                        }
                    )
            return Response({'success': True, 'order': orderSerializer.data})
        return Response({'success': False, 'error': 'collect.pin.mismatch'})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def deliverOrder(request, order_id):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        deliveryConfirmationPIN = int(request.data.get('deliveryConfirmationPIN'))
        order = InstantDeliveryOrder.objects.get(
            courier=profile,
            id=order_id,
            state__in=[orderState['transit'], orderState['transit-2']]
        )
        if order.deliveryConfirmationPIN == deliveryConfirmationPIN:
            order.state = orderState['delivered']
            order.save()
            orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
            os = OneSignal()
            buyerPlayerId = order.buyer.oneSignalPlayerId
            if buyerPlayerId:
                if len(buyerPlayerId.replace(" ", "")) > 1:
                    os.sendSpecificNotification(
                        [buyerPlayerId],
                        {
                            'headings': {
                                'en': "Lwf - Order Changed"
                            },
                            'contents': {
                                'en': "Your order has been delivered!"
                            },
                        }
                    )
            return Response({'success': True, 'order': orderSerializer.data})
        return Response({'success': False, 'error': 'delivery.pin.mismatch'})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def secondTransitOrder(request, order_id):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        order = InstantDeliveryOrder.objects.get(
            courier=profile,
            id=order_id,
            state__in=[orderState['transit']]
        )
        order.state = orderState['transit-2']
        order.save()
        orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
        os = OneSignal()
        buyerPlayerId = order.buyer.oneSignalPlayerId
        if buyerPlayerId:
            if len(buyerPlayerId.replace(" ", "")) > 1:
                os.sendSpecificNotification(
                    [buyerPlayerId],
                    {
                        'headings': {
                            'en': "Lwf - Order Changed"
                        },
                        'contents': {
                            'en': "Your order is in transit for the second time!"
                        },
                    }
                )
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def orderNotDelivered(request, order_id):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        order = InstantDeliveryOrder.objects.get(
            courier=profile,
            id=order_id,
            state__in=[orderState['transit'], orderState['transit-2']]
        )
        order.state = orderState['not-delivered']
        order.save()
        orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
        os = OneSignal()
        buyerPlayerId = order.buyer.oneSignalPlayerId
        if buyerPlayerId:
            if len(buyerPlayerId.replace(" ", "")) > 1:
                os.sendSpecificNotification(
                    [buyerPlayerId],
                    {
                        'headings': {
                            'en': "Lwf - Order Changed"
                        },
                        'contents': {
                            'en': "Your order is not delivered!"
                        },
                    }
                )
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def sendFeedbackOrder(request, order_id):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        isBuyerOrCourierQuery = Q(buyer=profile) | Q(courier=profile)
        order = InstantDeliveryOrder.objects.get(
            Q(
                id=order_id,
                state__in=[orderState['delivered']]
            )
            &
            isBuyerOrCourierQuery
        )
        orderFeedback = InstantDeliveryOrderFeedback()
        orderFeedback.order = order
        orderFeedback.profile = profile
        orderFeedback.score = request.data.get('score')
        orderFeedback.text = request.data.get('text')
        orderFeedback.save()
        if profile.id == order.buyer.id:
            order.courier.feedback = FeedbackManager.updateForwarderProfileFeedback(order.courier)
            order.courier.save()
        if profile.id == order.courier.id:
            order.buyer.feedback = FeedbackManager.updateBuyerProfileFeedback(order.buyer)
            order.buyer.save()
        orderSerializer = InstantDeliveryOrderSerializer(order, context={'request': request})
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})
