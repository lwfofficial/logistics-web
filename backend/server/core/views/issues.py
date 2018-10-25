from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Order, Chat, Issue, Notification
from core.serializers import IssueProtectedSerializer, IssueWithAddressesSerializer
from debugapp.middleware import p_ex
from settings import ISSUE_STATUS

issueStatus = ISSUE_STATUS.copy()
ORDER_STATUS = settings.ORDER_STATUS.copy()


@api_view(['POST'])
def createIssue(request):
    try:
        order = Order.objects.get(id=request.data.get('order'))
        if checkExistingIssue(order):
            raise ValueError("Issue Already exists")
        user = request.user
        profile = Profile.objects.get(user=user)
        chat = createChat(order)
        issueSerializer = IssueProtectedSerializer(data=request.data)
        if issueSerializer.is_valid():
            request.data['profile'] = profile
            request.data['order'] = order
            request.data['chat'] = chat
            issue = issueSerializer.create(request.data)
            issue.save()

            issueNotification = Notification()
            issueNotification.alert = True
            if profile == order.profile:
                issueNotification.user = issue.order.service.profile.user
                alertText = "User %s opened an issue" % issue.order.profile.user.username
            else:
                issueNotification.user = issue.order.profile.user
                alertText = "User %s opened an issue" % issue.order.service.profile.user.username
            issueLink = "%sissue/%d" % (
                issueNotification.getEmailLinkBaseUrl(),
                issue.id
            )
            issueNotification.alertData = "%s|%s|%d" % (alertText, "/issue", issue.id)
            issueNotification.save()

            return Response({'success': True, 'issueId': issue.id},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success': False, 'errors': issueSerializer.errors})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['GET'])
def getIssue(request, issue_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        query = Q(order__profile=profile) | Q(order__service__profile=profile)
        issue = Issue.objects.get(query, id=issue_id)
        if issue.order.state == ORDER_STATUS['paid'] \
                or issue.order.state == ORDER_STATUS['new'] \
                or issue.order.state == ORDER_STATUS['refused']:
            issueSerializer = IssueProtectedSerializer(issue, context={'request': request})
        else:
            issueSerializer = IssueWithAddressesSerializer(issue, context={'request': request})

        return Response({'success': True, 'issue': issueSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def closeIssue(request):
    """
    Close issue from owner
    """
    issueId = request.data.get("issueId")
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        try:
            issue = Issue.objects.get(
                id=issueId
            )
            if issue.profile != profile:
                return Response({'success': False, 'code': 'issue.notowner'})
            issue.state = issueStatus['CLOSED']
            issue.save()
            return Response({'success': True})
        except Issue.DoesNotExist:
            return Response({'success': False, 'code': 'issue.notfound'})
    except Exception as e:
        p_ex(
            request,
            e,
            3,
            1,
            'Failed to close issue id: %s' % (issueId)
        )
        return Response({'success': False, 'code': 'issue.genericerror'})


def createChat(order):
    chat = Chat()
    chat.buyer = order.profile.user
    chat.forwarder = order.service.profile.user
    chat.admin = User.objects.get(
        username="admin"
    )
    chat.save()
    return chat


def checkExistingIssue(order):
    try:
        Issue.objects.get(order=order, state=issueStatus['OPEN'])
        return True
    except Issue.DoesNotExist:
        return False
