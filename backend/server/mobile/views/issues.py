import base64

import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Chat, Notification, ChatMessage
from core.serializers import IssueSerializer
from mobile.models import InstantDeliveryOrder, InstantDeliveryOrderIssue
from settings import ISSUE_STATUS

issueStatus = ISSUE_STATUS.copy()


@api_view(['GET'])
def getIssue(request, orderId):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        order = InstantDeliveryOrder.objects.get(id=orderId)
        try:
            issue = InstantDeliveryOrderIssue.objects.get(order=order, state=issueStatus['OPEN'])
        except InstantDeliveryOrderIssue.DoesNotExist:
            issue = InstantDeliveryOrderIssue()
            issue.type = settings.ISSUE_TYPES_CHOICES[3][0]
            issue.state = settings.ISSUE_STATUS_CHOICES[0][0]
            chat = createChat(order)
            issue.profile = profile
            issue.order = order
            issue.chat = chat
            issue.save()
        issueSerializer = IssueSerializer(issue, context={'request': request})
        return Response({'success': True, 'issue': issueSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def createIssueChatMessage(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        file = request.data.get('messageImage')
        text = request.data.get('messageText')
        chatId = int(request.data.get('chatId'))
        query = Q(profile=profile) | Q(order__buyer=profile) | Q(order__courier=profile)
        issue = InstantDeliveryOrderIssue.objects.get(query, state=issueStatus['OPEN'], chat__id=chatId)
        chatMessage = ChatMessage()
        if file:
            if file.find("http://") > -1 or file.find("https://") > -1:
                imgstr = base64.b64encode(requests.get(file).content)
                ext = file.split('/')[-1].split(".")[-1]
                noteImageName = "%d.%s" % (user.id, ext)
                data = ContentFile(base64.b64decode(imgstr), name=noteImageName)
                if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                    return Response({'success': False, 'error':'file.toobig'}, 500)
            else:
                format, imgstr = request.data.get('messageImage').split(';base64,')
                ext = format.split('/')[-1]
                noteImageName = "%d.%s" % (user.id, ext)
                data = ContentFile(base64.b64decode(imgstr), name=noteImageName)
                if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                    return Response({'success': False, 'error':'file.toobig'}, 500)
            chatMessage.image = data

        chatMessage.chat = issue.chat
        chatMessage.sender = profile.user
        chatMessage.text = text
        chatMessage.save()
        issue = InstantDeliveryOrderIssue.objects.get(query, chat__id=chatId)
        issueSerializer = IssueSerializer(issue, context={'request': request})

        issueNotification = Notification()
        issueNotification.alert = True
        if profile == issue.order.courier:
            issueNotification.user = issue.order.courier.user
            alertText = "User %s sent a new message" %  issue.order.courier.user.username
        else:
            issueNotification.user = issue.order.buyer.user
            alertText = "User %s sent a new message" % issue.order.buyer.user.username
        issueLink = "%sissue/%d" % (
            issueNotification.getEmailLinkBaseUrl(),
            issue.id
        )
        issueNotification.alertData = "%s|%s|%d" % (alertText, "/issue", issue.id)
        issueNotification.save()

        return Response({'success': True, 'issue': issueSerializer.data})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


def createChat(order):
    chat = Chat()
    chat.buyer = order.buyer.user
    chat.forwarder = order.courier.user
    chat.admin = User.objects.get(
        username="admin"
    )
    chat.save()
    return chat
