import base64

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.db.models import Q
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Issue, ChatMessage, Notification
from core.serializers import IssueProtectedSerializer, IssueWithAddressesSerializer

issueStatus = settings.ISSUE_STATUS.copy()
ORDER_STATUS = settings.ORDER_STATUS.copy()


@api_view(['POST'])
def createIssueChatMessage(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        file = request.data.get('messageImage')
        text = request.data.get('messageText')
        chatId = int(request.data.get('chatId'))
        query = Q(profile=profile) | Q(order__service__profile=profile) | Q(order__profile=profile)
        issue = Issue.objects.get(query, state=issueStatus['OPEN'], chat__id=chatId)
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
        issue = Issue.objects.get(query, chat__id=chatId)
        if issue.order.state == ORDER_STATUS['paid'] \
                or issue.order.state == ORDER_STATUS['new'] \
                or issue.order.state == ORDER_STATUS['refused']:
            issueSerializer = IssueProtectedSerializer(issue, context={'request': request})
        else:
            issueSerializer = IssueWithAddressesSerializer(issue, context={'request': request})

        issueNotification = Notification()
        issueNotification.alert = True
        if profile == issue.order.profile:
            issueNotification.user = issue.order.service.profile.user
            alertText = "User %s sent a new message" % issue.order.profile.user.username
        else:
            issueNotification.user = issue.order.profile.user
            alertText = "User %s sent a new message" % issue.order.service.profile.user.username
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
