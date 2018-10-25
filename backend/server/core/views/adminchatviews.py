# -*- coding: utf-8 -*-

import traceback

from django.conf import settings
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.models import User

from core.models import Profile, Chat, ChatMessage, Notification, Issue
from core.serializers import ChatSerializer, ChatMessageSerializer


@staff_member_required
def adminAjaxGetChatData(request):
    r = {
        'success': False,
        'chat': None
    }
    try:
        chatId = int(request.GET['chatId'])
        chat = Chat.objects.get(id=chatId)
        chatSerializer = ChatSerializer(chat, context={'request': request})
        r['chat'] = chatSerializer.data
        r['success'] = True
    except Exception, ex:
        r['error'] = "%s" % (
            traceback.format_exc()
        )
    if r.get('error'):
        return JsonResponse(r, status=500)
    return JsonResponse(r)


@staff_member_required
def adminAjaxPostChatMessage(request):
    r = {
        'success': False,
        'chat': None
    }
    adminUser = User.objects.get(
        username="admin"
    ) #EMULATE ADMIN USER
    try:
        chatId = int(request.POST['chatId'])
        chat = Chat.objects.get(id=chatId)
        message = request.POST['message']
        chatMessage = ChatMessage(
            sender=adminUser,
            text=message,
            chat=chat
        )
        chatMessage.save()

        issue = Issue.objects.get(chat=chat)

        issueNotificationBuyer = Notification()
        issueNotificationBuyer.alert = True
        issueNotificationBuyer.user = issue.order.profile.user
        alertText = "Admin sent a new message"
        issueLink = "%sissue/%d" % (
            issueNotificationBuyer.getEmailLinkBaseUrl(),
            issue.id
        )
        issueNotificationBuyer.alertData = "%s|%s" % (alertText, issueLink)
        issueNotificationBuyer.save()

        issueNotificationForwarder = Notification()
        issueNotificationForwarder.alert = True
        issueNotificationForwarder.user = issue.order.service.profile.user
        alertText = "Admin sent a new message"
        issueLink = "%sissue/%d" % (
            issueNotificationForwarder.getEmailLinkBaseUrl(),
            issue.id
        )
        issueNotificationForwarder.alertData = "%s|%s" % (alertText, issueLink)
        issueNotificationForwarder.save()

        chatSerializer = ChatSerializer(chat, context={'request': request})
        chatMessageSerializer = ChatMessageSerializer(chatMessage, context={'request': request})
        r['chat'] = chatSerializer.data
        r['message'] = chatMessageSerializer.data
        r['success'] = True
    except Exception, ex:
        r['error'] = "%s" % (
            traceback.format_exc()
        )
    if r.get('error'):
        return JsonResponse(r, status=500)
    return JsonResponse(r)
