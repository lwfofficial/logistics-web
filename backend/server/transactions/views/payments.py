from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Order, Notification, Configuration
from transactions.manager import TransactionManager


@api_view(['POST'])
def orderPayment(request):
    try:
        order = Order.objects.get(id=request.data.get("orderId"))
        inWalletId = order.profile.wallet.id
        outWalletId = order.service.profile.wallet.id

        feePercentage = Configuration().getConfiguration(
            "forwarding_fee_percentage_level_1"
        )

        TransactionManager.createPaymentTransaction(
            amount=order.totalPrice,
            order=order,
            inWalletId=inWalletId,
            outWalletId=outWalletId,
            feePercentage=feePercentage
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
            "New LWF Order",
            "notifications/email/forwarder_order_new_status.html",
            {
                'order': order,
                'orderLink': orderLink
            }
        )
        alertText = "Order #%d has been paid" % order.id
        orderNotification.alertData = "%s|%s|%d" % (alertText, "/orders/forwarder", order.id)
        orderNotification.save()

        return Response({'success': True})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})
