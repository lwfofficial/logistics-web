import datetime
import traceback

import django
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Configuration
from mobile.models import InstantDeliveryOrder
from mobile.onesignal import OneSignal
from transactions.manager import TransactionManager


@api_view(['GET'])
def processExpiredInstantDeliveryOrders(request):
    r = {
        'success': False,
        'total_expired_orders': 0,
        'errors': []
    }
    conf = Configuration().getConfiguration('instant_delivery_order_minutes_expire')
    now = django.utils.timezone.now()
    expiredOrders = InstantDeliveryOrder.objects.filter(
        dateCreated__lte=now - datetime.timedelta(minutes=conf),
        state='NEW',
        expired=False
    )
    for order in expiredOrders:
        try:
            TransactionManager.refundExpiredInstantDeliveryOrderPaymentTransaction(
                order=order
            )
            r['total_expired_orders'] += 1
            os = OneSignal()
            buyerPlayerId = order.buyer.oneSignalPlayerId
            if buyerPlayerId:
                if len(buyerPlayerId.replace(" ", "")) > 1:
                    os.sendSpecificNotification(
                        [buyerPlayerId],
                        {
                            'headings': {
                                'en': "Lwf Notification"
                            },
                            'contents': {
                                'en': "Your request expired!"
                            },
                        }
                    )
        except Exception as ex:
            r['errors'].append(
                "Order: %s | %s" % (
                    order.id,
                    traceback.format_exc()
                )
            )
    r['success'] = True
    return Response(r)
