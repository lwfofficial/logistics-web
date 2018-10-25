import base64
import functools

import django
import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.paginator import Paginator
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Order, Service, OrderNote, Notification, OrderFeedback, OrderTrackingInfo, \
    Configuration, PartnerCourierPrice, Address
from core.serializers import OrderSerializer, OrderProtectedSerializer, OrderWithAddressesSerializer
from managers import FeedbackManager
from transactions.manager import TransactionManager

ORDER_STATUS = settings.ORDER_STATUS.copy()
STANDARD_SHIPPING = 1
EXPRESS_SHIPPING = 2


@api_view(['POST'])
def createOrder(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        service = Service.objects.get(id=request.data.get('service'))
        orderSerializer = OrderSerializer(data=request.data)

        #translate received id object for deliveryAddress into string (only for p2p)
        if request.data.get('deliveryAddress'):
            deliveryAddressId = int(request.data['deliveryAddress'])
            deliveryAddress = Address.objects.get(id=deliveryAddressId)
            request.data['deliveryAddress'] = '%s, %s %s %s' % (
                deliveryAddress.street,
                deliveryAddress.city,
                deliveryAddress.zipCode,
                deliveryAddress.country

            )

        if orderSerializer.is_valid():
            request.data['service'] = service
            request.data['profile'] = profile
            request.data['profileForwarderAddress'] = service.profileForwarderAddress
            order = orderSerializer.create(request.data)
            order.save()
            return Response({'success': True, 'orderId': order.id},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success': False, 'errors': orderSerializer.errors})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['POST'])
def editOrder(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        request.data['profile'] = profile
        order = Order.objects.get(id=request.data.get('orderId'))
        orderSerializer = OrderSerializer(data=request.data)

        #translate received id object for deliveryAddress into string (only for p2p)
        if request.data.get('deliveryAddress'):
            deliveryAddressId = int(request.data['deliveryAddress'])
            deliveryAddress = Address.objects.get(id=deliveryAddressId)
            request.data['deliveryAddress'] = '%s, %s %s %s' % (
                deliveryAddress.street,
                deliveryAddress.city,
                deliveryAddress.zipCode,
                deliveryAddress.country

            )

        if orderSerializer.is_valid():
            order = orderSerializer.update(order, request.data)
            order.save()
            return Response({'success': True, 'orderId': order.id},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success': False, 'errors': orderSerializer.errors})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


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
        ordersSerialized = []
        profile = Profile.objects.get(user=user)
        orders = Order.objects.filter(
            profile=profile
        ).exclude(state='NEW').order_by(sort)
        paginator = Paginator(orders, maxPerPage)
        ordersPaginator = paginator.page(page)

        for o in ordersPaginator:
            if o.state == ORDER_STATUS['paid'] \
                    or o.state == ORDER_STATUS['new'] \
                    or o.state == ORDER_STATUS['refused']:
                orderSerialized = OrderProtectedSerializer(
                    o,
                    context={'request': request}
                )
                ordersSerialized.append(
                    orderSerialized.data
                )
            else:
                orderSerialized = OrderWithAddressesSerializer(
                    o,
                    context={'request': request}
                )
                ordersSerialized.append(
                    orderSerialized.data
                )

        return Response({'success': True, 'orders': ordersSerialized, 'ordersCount': paginator.count})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def getForwarderOrders(request):
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
        ordersSerialized = []
        profile = Profile.objects.get(user=user)
        orders = Order.objects.filter(
            service__profile=profile
        ).exclude(state=ORDER_STATUS['new']).order_by(sort)
        paginator = Paginator(orders, maxPerPage)
        ordersPaginator = paginator.page(page)

        for o in ordersPaginator:
            if o.state == ORDER_STATUS['paid'] \
                    or o.state == ORDER_STATUS['new'] \
                    or o.state == ORDER_STATUS['refused']:
                orderSerialized = OrderProtectedSerializer(
                    o,
                    context={'request': request}
                )
                ordersSerialized.append(
                    orderSerialized.data
                )
            else:
                orderSerialized = OrderWithAddressesSerializer(
                    o,
                    context={'request': request}
                )
                ordersSerialized.append(
                    orderSerialized.data
                )
        return Response({'success': True, 'orders': ordersSerialized, 'ordersCount': paginator.count})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getOrder(request, order_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=order_id, profile=profile)
        # exclude sensitive data for service if order.state paid, new, refused

        if order.state == ORDER_STATUS['paid'] \
                or order.state == ORDER_STATUS['new'] \
                or order.state == ORDER_STATUS['refused']:
            orderSerializer = OrderProtectedSerializer(
                order,
                context={'request': request}
            )
        else:
            orderSerializer = OrderWithAddressesSerializer(
                order,
                context={'request': request},
            )

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def getForwarderOrder(request, order_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=order_id, service__profile=profile)
        if order.state == ORDER_STATUS['paid'] \
                or order.state == ORDER_STATUS['new'] \
                or order.state == ORDER_STATUS['refused']:
            orderSerializer = OrderProtectedSerializer(
                order,
                context={'request': request}
            )
        else:
            orderSerializer = OrderWithAddressesSerializer(
                order,
                context={'request': request},
            )
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def acceptOrRefuse(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), service__profile=profile)
        if request.data.get('accept'):
            order.state = ORDER_STATUS['accepted']
            order.save()
            orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})
        else:
            order.state = ORDER_STATUS['refused']
            order.save()
            orderSerializer = OrderProtectedSerializer(order, context={'request': request})


        # Notification to buyer
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.profile.user
        orderLink = "%sorders/buyer/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order %s" % (order.state),
            "notifications/email/buyer_order_change_status.html",
            {
                'order': order,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d changed status to %s" % (order.id, order.state)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/buyer/", order.id)
        orderNotification.save()

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def delivered(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), service__profile=profile)
        order.state = ORDER_STATUS['collecting']
        order.save()
        # Notification to buyer
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.profile.user
        orderLink = "%sorders/buyer/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order %s" % (order.state),
            "notifications/email/buyer_order_change_status.html",
            {
                'order': order,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d changed status to %s" % (order.id, order.state)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/buyer/", order.id)
        orderNotification.save()
        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def collecting(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), service__profile=profile)
        order.state = ORDER_STATUS['collecting']
        order.save()
        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})

        # Notification to buyer
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.profile.user
        orderLink = "%sorders/buyer/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order %s" % (order.state),
            "notifications/email/buyer_order_change_status.html",
            {
                'order': order,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d changed status to %s" % (order.id, order.state)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/buyer/", order.id)
        orderNotification.save()

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def forwardedDelivered(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), service__profile=profile)
        if order.service.type == settings.SERVICE_TYPES[0][0]:
            order.state = ORDER_STATUS['forwarded']
            order.forwardedDate = django.utils.timezone.now()
        if order.service.type == settings.SERVICE_TYPES[1][0]:
            order.state = ORDER_STATUS['delivered']
        order.save()
        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})

        # Notification to buyer
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.profile.user
        orderLink = "%sorders/buyer/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order %s" % (order.state),
            "notifications/email/buyer_order_change_status.html",
            {
                'order': order,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d changed status to %s" % (order.id, order.state)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/buyer/", order.id)
        orderNotification.save()

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def received(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), profile=profile)
        order.state = ORDER_STATUS['received']
        order.save()
        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})

        outWalletId = order.service.profile.wallet.id
        TransactionManager.completePaymentTransaction(
            order=order,
            outWalletId=outWalletId,
        )

        # Notification to forwarder
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.service.profile.user
        orderLink = "%sorders/forwarder/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order %s" % (order.state),
            "notifications/email/forwarder_order_change_status.html",
            {
                'order': order,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d changed status to %s" % (order.id, order.state)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/forwarder/", order.id)
        orderNotification.save()

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def updateBuyerTrackingInfo(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), profile=profile)
        try:
            orderTrackingInfo = OrderTrackingInfo.objects.get(
                order=order,
                profile=profile,
                fromForwarder=False,
                trackingStatus=settings.ORDER_TRACKING_INFO_STATUS_CHOICES[0][0]
            )
            orderTrackingInfo.courier = request.data.get('courier')
            orderTrackingInfo.courierOther = request.data.get('courierOther')
            orderTrackingInfo.trn = request.data.get('trn')
            orderTrackingInfo.link = request.data.get('link')
        except OrderTrackingInfo.DoesNotExist:
            orderTrackingInfo = OrderTrackingInfo(
                order=order,
                profile=profile,
                fromForwarder=False,
                courier=request.data.get('courier'),
                courierOther=request.data.get('courierOther'),
                trn=request.data.get('trn'),
                link=request.data.get('link'),
                trackingStatus=settings.ORDER_TRACKING_INFO_STATUS_CHOICES[0][0]
            )
        orderTrackingInfo.save()
        order.save()
        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})

        # Notification to forwarder
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.service.profile.user
        orderLink = "%sorders/forwarder/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order Tracking Info Updated",
            "notifications/email/forwarder_order_tracking_changed.html",
            {
                'order': order,
                'orderTrackingInfo': orderTrackingInfo,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d tracking info updated" % (order.id)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/forwarder/", order.id)
        orderNotification.save()

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def updateForwarderTrackingInfo(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), service__profile=profile)
        try:
            orderTrackingInfo = OrderTrackingInfo.objects.get(
                order=order,
                profile=profile,
                fromForwarder=True,
                trackingStatus=settings.ORDER_TRACKING_INFO_STATUS_CHOICES[1][0]
            )
            orderTrackingInfo.courier = request.data.get('courier')
            orderTrackingInfo.courierOther = request.data.get('courierOther')
            orderTrackingInfo.trn = request.data.get('trn')
            orderTrackingInfo.link = request.data.get('link')
        except OrderTrackingInfo.DoesNotExist:
            orderTrackingInfo = OrderTrackingInfo(
                order=order,
                profile=profile,
                fromForwarder=True,
                courier=request.data.get('courier'),
                courierOther=request.data.get('courierOther'),
                trn=request.data.get('trn'),
                link=request.data.get('link'),
                trackingStatus=settings.ORDER_TRACKING_INFO_STATUS_CHOICES[1][0]
            )
        orderTrackingInfo.save()
        order.save()
        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})

        # Notification to buyer
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.profile.user
        orderLink = "%sorders/buyer/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order Tracking Info Updated",
            "notifications/email/buyer_order_tracking_changed.html",
            {
                'order': order,
                'orderTrackingInfo': orderTrackingInfo,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d tracking info updated" % (order.id)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/buyer/", order.id)
        orderNotification.save()

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def updateForwarderPartnerTrackingInfo(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), service__profile=profile)
        try:
            orderTrackingInfo = OrderTrackingInfo.objects.get(
                order=order,
                profile=profile,
                fromForwarder=True,
                trackingStatus=settings.ORDER_TRACKING_INFO_STATUS_CHOICES[2][0]
            )
            orderTrackingInfo.courier = request.data.get('courier')
            orderTrackingInfo.courierOther = request.data.get('courierOther')
            orderTrackingInfo.trn = request.data.get('trn')
            orderTrackingInfo.link = request.data.get('link')
        except OrderTrackingInfo.DoesNotExist:
            orderTrackingInfo = OrderTrackingInfo(
                order=order,
                profile=profile,
                fromForwarder=True,
                courier=request.data.get('courier'),
                courierOther=request.data.get('courierOther'),
                trn=request.data.get('trn'),
                link=request.data.get('link'),
                trackingStatus=settings.ORDER_TRACKING_INFO_STATUS_CHOICES[2][0]
            )
        orderTrackingInfo.save()
        order.save()
        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})
        # Notification to buyer
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.profile.user
        orderLink = "%sorders/buyer/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order Tracking Info Updated",
            "notifications/email/buyer_order_tracking_changed.html",
            {
                'order': order,
                'orderTrackingInfo': orderTrackingInfo,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d tracking info updated" % (order.id)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/buyer/", order.id)
        orderNotification.save()

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def updateRefuseReason(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), service__profile=profile)
        order.refuseReason = request.data.get("reasonText")
        order.save()
        orderSerializer = OrderProtectedSerializer(order, context={'request': request})

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def cancel(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=request.data.get('orderId'), profile=profile)
        order.state = ORDER_STATUS['cancelled']
        order.save()
        orderSerializer = OrderProtectedSerializer(order, context={'request': request})

        # Notification to forwarder
        orderNotification = Notification()
        orderNotification.email = True
        orderNotification.alert = True
        orderNotification.user = order.service.profile.user
        orderLink = "%sorders/forwarder/%s" % (
            orderNotification.getEmailLinkBaseUrl(),
            order.id
        )
        orderNotification.setEmailData(
            "LWF Order %s" % (order.state),
            "notifications/email/forwarder_order_change_status.html",
            {
                'order': order,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d changed status to %s" % (order.id, order.state)
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/forwarder/", order.id)
        orderNotification.save()

        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def deleteOrder(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=int(request.data.get('orderId')), profile=profile)
        order.delete()
        return Response({'success': True})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def createOrderNote(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        file = request.data.get('noteImage')
        description = request.data.get('noteText')
        orderId = int(request.data.get('orderId'))
        query = Q(profile=profile) | Q(service__profile=profile)
        order = Order.objects.get(query, id=orderId)
        maxOrderNotes = int(Configuration.objects.get(
            key__iexact='max_order_notes'
        ).value)
        if len(order.notes) >= maxOrderNotes:
            return Response({'success': False, 'error': 'maxOrderNotesReached'})
        if file:
            if file.find("http://") > -1 or file.find("https://") > -1:
                imgstr = base64.b64encode(requests.get(file).content)
                ext = file.split('/')[-1].split(".")[-1]
                noteImageName = "%d.%s" % (user.id, ext)
                data = ContentFile(base64.b64decode(imgstr), name=noteImageName)
                if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                    return Response({'success': False, 'error':'file.toobig'}, 500)
            elif request.data.get('noteImage').find(';base64,') > -1:
                format, imgstr = request.data.get('noteImage').split(';base64,')
                ext = format.split('/')[-1]
                noteImageName = "%d.%s" % (user.id, ext)
                data = ContentFile(base64.b64decode(imgstr), name=noteImageName)
                if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                    return Response({'success': False, 'error':'file.toobig'}, 500)
            else:
                data = None

            newOrderNote = OrderNote()
            newOrderNote.profile = profile
            newOrderNote.order = order
            newOrderNote.orderStatus = order.state
            if data:
                if data.size < settings.MAX_IMAGE_SIZE_UPLOAD:
                    newOrderNote.document = data
            newOrderNote.description = description
            newOrderNote.save()
            order = Order.objects.get(id=orderId)

            if order.state == ORDER_STATUS['paid'] \
                    or order.state == ORDER_STATUS['new'] \
                    or order.state == ORDER_STATUS['refused']:
                orderSerializer = OrderProtectedSerializer(
                    order,
                    context={'request': request}
                )
            else:
                orderSerializer = OrderWithAddressesSerializer(
                    order,
                    context={'request': request},
                )

            # Notification to buyer or Forwarder
            orderNotification = Notification()
            orderNotification.email = True
            orderNotification.alert = True
            alertText = "Order #%d has new note" % (order.id)
            if user.id == order.profile.user.id:
                orderNotification.user = order.service.profile.user
                notificationProfile = order.service.profile
                orderLink = "%sorders/forwarder/%s" % (
                    orderNotification.getEmailLinkBaseUrl(),
                    order.id
                )
                orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/forwarder/", order.id)
            else:
                orderNotification.user = order.profile.user
                notificationProfile = order.profile
                orderLink = "%sorders/buyer/%s" % (
                    orderNotification.getEmailLinkBaseUrl(),
                    order.id
                )
                orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/buyer/", order.id)
            orderNotification.setEmailData(
                "LWF Order Has New Note",
                "notifications/email/order_note_new.html",
                {
                    'order': order,
                    'profile': notificationProfile,
                    'orderLink': orderLink
                }
            )
            orderNotification.save()

            return Response({'success': True, 'order': orderSerializer.data})
        else:
            return Response({'success': False, 'error': 'nofile'})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def addOrderBuyerFeedbackToForwarder(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=int(request.data.get('orderId')), profile=profile)
        orderFeedback = getOrderFeedback(order, profile)
        orderFeedback.score = request.data.get('score')
        orderFeedback.text = request.data.get('text')
        orderFeedback.save()
        forwarderProfile = order.service.profile
        forwarderProfile.feedback = FeedbackManager.updateForwarderProfileFeedback(forwarderProfile)
        forwarderProfile.save()

        feedbackNotification = Notification()
        feedbackNotification.alert = True
        feedbackNotification.user = forwarderProfile.user
        orderLink = "%sforwarder" % (
            feedbackNotification.getEmailLinkBaseUrl()
        )
        alertText = "User %s left a feedback %.2f/5" % (profile.user.username, orderFeedback.score)
        feedbackNotification.alertData = "%s|%s" % (alertText, "/forwarder")
        feedbackNotification.save()

        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def addOrderForwarderFeedbackToBuyer(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = Order.objects.get(id=int(request.data.get('orderId')), service__profile=profile)
        orderFeedback = getOrderFeedback(order, profile)
        orderFeedback.score = request.data.get('score')
        orderFeedback.text = request.data.get('text')
        orderFeedback.save()
        buyerProfile = order.profile
        buyerProfile.feedback = FeedbackManager.updateBuyerProfileFeedback(buyerProfile)
        buyerProfile.save()

        feedbackNotification = Notification()
        feedbackNotification.alert = True
        feedbackNotification.user = buyerProfile.user
        orderLink = "%sbuyer" % (
            feedbackNotification.getEmailLinkBaseUrl()
        )
        alertText = "User %s left a feedback %.2f/5" % (profile.user.username, orderFeedback.score)
        feedbackNotification.alertData = "%s|%s" % (alertText, "/buyer")
        feedbackNotification.save()

        orderSerializer = OrderWithAddressesSerializer(order, context={'request': request})
        return Response({'success': True, 'order': orderSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


def getOrderFeedback(order, profile):
    try:
        orderFeedback = OrderFeedback.objects.get(order=order, profile=profile)
    except OrderFeedback.DoesNotExist:
        orderFeedback = OrderFeedback()
        orderFeedback.profile = profile
        orderFeedback.order = order
    return orderFeedback


@api_view(['GET'])
def getCouriers(request):
    try:
        couriers = []
        for c in settings.COURIER_TYPES_CHOICES:
            couriers.append({
                'id': c[0],
                'name': c[1]
            })
        return Response({'success': True, 'couriers': couriers})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def partnerOrderPrice(request):
    try:
        user = request.user
        Profile.objects.get(user=user)
        originCountry = request.data.get('originCountry')
        destinationCountry = request.data.get('destinationCountry')
        shippingWeight = request.data.get('shippingWeight')
        shippingMode = request.data.get('shippingMode')
        service = Service.objects.get(id=request.data.get('service'))
        if shippingMode == EXPRESS_SHIPPING:
            serviceCosts = Service.computeExpressCosts(
                shippingWeight,
                originCountry,
                destinationCountry,
                service.partnerForwarderMargin
            )
        else:
            serviceCosts = Service.computeStandardCosts(
                shippingWeight,
                originCountry,
                destinationCountry,
                service.partnerForwarderMargin
            )
        finalPrice = functools.reduce(lambda a, b: a + b, map(lambda p: p['amount'], serviceCosts))
        finalPrice = Service.eurToUsdConversion(finalPrice)

        return Response({'success': True, 'price': finalPrice})
    except Exception as e:
        return Response({'success': False, 'error': e.message})



@api_view(['POST'])
def getPartnerCourierWeightList(request):
    try:
        user = request.user
        Profile.objects.get(user=user)
        courierType = request.data.get("type")

        weights = PartnerCourierPrice.objects.filter(
            type=courierType
        ).order_by("weight").values('weight').distinct()

        return Response({'success': True, 'weights': weights})
    except Exception as e:
        return Response({'success': False, 'error': e.message})

