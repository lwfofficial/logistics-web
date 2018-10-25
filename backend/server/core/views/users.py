# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import base64

import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.paginator import Paginator
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Address, OrderFeedback, Notification, getDefaultAvatarImageData
from core.serializers import ProfileSerializer, AddressSerializer, OrderFeedbackSerializer, NotificationSerializer
from transactions.models import Wallet
from transactions.serializers import WalletSerializer


@api_view(['POST'])
def uploadUserAvatar(request):
    user = request.user
    profile = Profile.objects.get(user=user)
    file = request.data.get('avatarImage')
    if file:
        if type(file) is dict:
            file = file['changingThisBreaksApplicationSecurity']
        if file.find("http://") > -1 or file.find("https://") > -1:
            imgstr = base64.b64encode(requests.get(file).content)
            ext = file.split('/')[-1].split(".")[-1]
            avatarImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=avatarImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.avatarImage:
                profile.avatarImage.delete(save=True)
            profile.avatarImage = data
            profile.save()
            return Response({'success': True})
        else:
            datapost = request.data.get('avatarImage')
            if type(datapost) is dict:
                datapost = datapost['changingThisBreaksApplicationSecurity']
            format, imgstr = datapost.split(';base64,')
            ext = format.split('/')[-1]
            avatarImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=avatarImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.avatarImage:
                profile.avatarImage.delete(save=True)
            profile.avatarImage = data
            profile.save()
            profileSerializer = ProfileSerializer(
                profile,
                context={'request': request}
            )
            return Response({'success': True, 'profile': profileSerializer.data})
    return Response({'success': False})


@api_view(['POST'])
def uploadIDDocFront(request):
    success = False
    user = request.user
    profile = Profile.objects.get(user=user)
    file = request.data.get('IDDocFrontImage')
    if file:
        if type(file) is dict:
            file = file['changingThisBreaksApplicationSecurity']
        if file.find("http://") > -1 or file.find("https://") > -1:
            imgstr = base64.b64encode(requests.get(file).content)
            ext = file.split('/')[-1].split(".")[-1]
            IDDocFrontImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=IDDocFrontImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.IDDocFrontImage:
                profile.IDDocFrontImage.delete(save=True)
            profile.IDDocFrontImage = data
            profile.save()
            success = True
        else:
            datapost = request.data.get('IDDocFrontImage')
            if type(datapost) is dict:
                datapost = datapost['changingThisBreaksApplicationSecurity']
            format, imgstr = datapost.split(';base64,')
            ext = format.split('/')[-1]
            IDDocFrontImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=IDDocFrontImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.IDDocFrontImage:
                profile.IDDocFrontImage.delete(save=True)
            profile.IDDocFrontImage = data
            profile.save()
            success = True
    return Response({'success': success})


@api_view(['POST'])
def uploadIDDocBack(request):
    success = False
    user = request.user
    profile = Profile.objects.get(user=user)
    file = request.data.get('IDDocBackImage')
    if file:
        if type(file) is dict:
            file = file['changingThisBreaksApplicationSecurity']
        if file.find("http://") > -1 or file.find("https://") > -1:
            imgstr = base64.b64encode(requests.get(file).content)
            ext = file.split('/')[-1].split(".")[-1]
            IDDocBackImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=IDDocBackImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.IDDocBackImage:
                profile.IDDocBackImage.delete(save=True)
            profile.IDDocBackImage = data
            profile.save()
            success = True
        else:
            datapost = request.data.get('IDDocBackImage')
            if type(datapost) is dict:
                datapost = datapost['changingThisBreaksApplicationSecurity']
            format, imgstr = datapost.split(';base64,')
            ext = format.split('/')[-1]
            IDDocBackImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=IDDocBackImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.IDDocBackImage:
                profile.IDDocBackImage.delete(save=True)
            profile.IDDocBackImage = data
            profile.save()
            success = True

    if success:
        # Admin Notification
        adminNotification = Notification()
        adminNotification.email = True
        adminNotification.user = User.objects.get(
            username="admin"
        )
        adminNotification.setEmailData(
            "User uploaded documents",
            "notifications/email/admin_email_user_uploaded_docs.html",
            {
                'user': user,
                'documentType': 'Identity Verification'
            }
        )

    return Response({'success': success})


@api_view(['POST'])
def uploadProofOfresidence(request):
    success = False
    user = request.user
    profile = Profile.objects.get(user=user)
    file = request.data.get('ProofOfresidenceImage')
    if file:
        if type(file) is dict:
            file = file['changingThisBreaksApplicationSecurity']
        if file.find("http://") > -1 or file.find("https://") > -1:
            imgstr = base64.b64encode(requests.get(file).content)
            ext = file.split('/')[-1].split(".")[-1]
            ProofOfresidenceImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=ProofOfresidenceImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.ProofOfresidenceImage:
                profile.ProofOfresidenceImage.delete(save=True)
            profile.ProofOfresidenceImage = data
            profile.save()
            success = True
        else:
            datapost = request.data.get('ProofOfresidenceImage')
            if type(datapost) is dict:
                datapost = datapost['changingThisBreaksApplicationSecurity']
            format, imgstr = datapost.split(';base64,')
            ext = format.split('/')[-1]
            ProofOfresidenceImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=ProofOfresidenceImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.ProofOfresidenceImage:
                profile.ProofOfresidenceImage.delete(save=True)
            profile.ProofOfresidenceImage = data
            profile.save()
            success = True

    if success:
        # Admin Notification
        adminNotification = Notification()
        adminNotification.email = True
        adminNotification.user = User.objects.get(
            username="admin"
        )
        adminNotification.setEmailData(
            "User uploaded documents",
            "notifications/email/admin_email_user_uploaded_docs.html",
            {
                'user': user,
                'documentType': 'Proof of Residence'
            }
        )

    return Response({'success': success})


@api_view(['POST'])
def uploadSelfIDoc(request):
    success = False
    user = request.user
    profile = Profile.objects.get(user=user)
    file = request.data.get('SelfIDocImage')
    if file:
        if type(file) is dict:
            file = file['changingThisBreaksApplicationSecurity']
        if file.find("http://") > -1 or file.find("https://") > -1:
            imgstr = base64.b64encode(requests.get(file).content)
            ext = file.split('/')[-1].split(".")[-1]
            SelfIDocImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=SelfIDocImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.SelfIDocImage:
                profile.SelfIDocImage.delete(save=True)
            profile.SelfIDocImage = data
            profile.save()
            success = True
        else:
            datapost = request.data.get('SelfIDocImage')
            if type(datapost) is dict:
                datapost = datapost['changingThisBreaksApplicationSecurity']
            format, imgstr = datapost.split(';base64,')
            ext = format.split('/')[-1]
            SelfIDocImageName = "%d.%s" % (user.id, ext)
            data = ContentFile(base64.b64decode(imgstr), name=SelfIDocImageName)
            if data.size > settings.MAX_IMAGE_SIZE_UPLOAD:
                return Response({'success': False, 'error':'file.toobig'}, 500)
            if profile.SelfIDocImage:
                profile.SelfIDocImage.delete(save=True)
            profile.SelfIDocImage = data
            profile.save()
            success = True

    if success:
        # Admin Notification
        adminNotification = Notification()
        adminNotification.email = True
        adminNotification.user = User.objects.get(
            username="admin"
        )
        adminNotification.setEmailData(
            "User uploaded documents",
            "notifications/email/admin_email_user_uploaded_docs.html",
            {
                'user': user,
                'documentType': 'Selfie Id'
            }
        )

    return Response({'success': False})


@api_view(['POST'])
def userProfile(request):
    user = request.user

    try:
        profile = Profile.objects.get(
            user=user
        )
        wallet = Wallet.objects.get(
            profile=profile
        )
        profileSerializer = ProfileSerializer(
            profile,
            context={'request': request}
        )
        walletSerializer = WalletSerializer(
            wallet,
            context={'request': request}
        )
        return Response({
            'success': True,
            'profile': profileSerializer.data,
            'wallet': walletSerializer.data
        })
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def changePassword(request):
    user = request.user
    oldPassword = request.data.get('oldPassword')
    newPassword = request.data.get('newPassword')
    try:
        Profile.objects.get(user=user)
        if user.check_password(oldPassword):
            user.set_password(newPassword)
            user.save()
            return Response({'success': True})
        return Response({'success': False, 'error': 'password.wrong'})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['POST'])
def updatePlayerId(request):
    user = request.user
    playerId = request.data.get('userId')
    pushToken = request.data.get('pushToken')
    try:
        profile = Profile.objects.get(user=user)
        if len(playerId) > 10 and len(pushToken) > 10:
            profile.oneSignalPlayerId = playerId
            profile.oneSignalPushToken = pushToken
            profile.save()
            return Response({'success': True})
        Response({'success': False, 'error': 'Invalid playerId or pushToken'})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['POST'])
def addAddress(request):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        addressSerializer = AddressSerializer(data=request.data)
        address = addressSerializer.create(request.data)
        address.save()
        profile.addresses.add(address)
        profile.save()
        profileSerializer = ProfileSerializer(profile, context={'request': request})
        return Response({'success': True, 'profile': profileSerializer.data})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['PUT'])
def editAddress(request):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        address = Address.objects.get(id=request.data.get("id"))
        addressSerializer = AddressSerializer(data=request.data)
        if addressSerializer.is_valid():
            address = addressSerializer.update(address, request.data)
            address.save()
        profileSerializer = ProfileSerializer(profile, context={'request': request})
        return Response({'success': True, 'profile': profileSerializer.data})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['DELETE'])
def deleteAddress(request, address_id):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        address = Address.objects.get(id=address_id)
        profile.addresses.remove(address)
        profile.save()
        address.delete()
        profileSerializer = ProfileSerializer(profile, context={'request': request})
        return Response({'success': True, 'profile': profileSerializer.data})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def enable2FASMS(request):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        profile.enable2FASMS = request.data.get("enable2FASMS")
        if profile.enable2FASMS:
            profile.enable2FAGoogle = False
        profile.save()
        profileSerializer = ProfileSerializer(profile, context={'request': request})
        return Response({'success': True, 'profile': profileSerializer.data})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['POST'])
def enable2FAGoogle(request):
    user = request.user
    try:
        profile = Profile.objects.get(user=user)
        profile.enable2FAGoogle = request.data.get("enable2FAGoogle")
        if profile.enable2FAGoogle:
            profile.enable2FASMS = False
        profile.save()
        profileSerializer = ProfileSerializer(profile, context={'request': request})
        return Response({'success': True, 'profile': profileSerializer.data})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})


@api_view(['POST'])
def forwarderFeedback(request):
    user = request.user
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        Profile.objects.get(user=user)
        forwarderProfile = Profile.objects.get(id=request.data.get("forwarderId"))
        forwarderFeedbacks = OrderFeedback.objects \
            .filter(order__service__profile=forwarderProfile) \
            .order_by("-dateCreated") \
            .exclude(profile=forwarderProfile).distinct()
        paginator = Paginator(forwarderFeedbacks, maxPerPage)
        feedbackSerializer = OrderFeedbackSerializer(
            paginator.page(page),
            many=True,
            context={'request': request}
        )
        return Response({'success': True, 'feedbacks': feedbackSerializer.data, 'feedbacksCount': paginator.count})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'userProfile.notfound'})


@api_view(['POST'])
def buyerFeedback(request):
    user = request.user
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        Profile.objects.get(user=user)
        buyerProfile = Profile.objects.get(id=request.data.get("buyerId"))
        buyerFeedbacks = OrderFeedback.objects \
            .filter(order__profile=buyerProfile) \
            .order_by("-dateCreated") \
            .exclude(profile=buyerProfile).distinct()
        paginator = Paginator(buyerFeedbacks, maxPerPage)
        feedbackSerializer = OrderFeedbackSerializer(
            paginator.page(page),
            many=True,
            context={'request': request}
        )
        return Response({'success': True, 'feedbacks': feedbackSerializer.data, 'feedbacksCount': paginator.count})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'userProfile.notfound'})


@api_view(['GET'])
def userNotifications(request):
    user = request.user

    try:
        profile = Profile.objects.get(
            user=user
        )
        notifications = Notification.objects.filter(
            user=profile.user,
            alert=True
        ).exclude(alertData=None).order_by("-dateCreated")[:10]
        notificationSerializer = NotificationSerializer(
            notifications,
            many=True,
            context={'request': request}
        )
        return Response({
            'success': True,
            'notifications': notificationSerializer.data,
        })
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def setNotificationAsRead(request):
    user = request.user
    try:
        profile = Profile.objects.get(
            user=user
        )
        notifications = Notification.objects.filter(
            user=profile.user,
            alert=True,
            alertNotified=False
        )
        for notification in notifications:
            notification.alertNotified = True
            notification.save()
        return Response({
            'success': True
        })
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['POST'])
def updateProfileSetting(request):
    user = request.user
    settingName = request.data.get('settingName')
    settingValue = request.data.get('settingValue')
    try:
        profile = Profile.objects.get(
            user=user
        )
        if hasattr(profile, settingName):
            profile.__setattr__(settingName, settingValue)
            profile.save()
            profileSerializer = ProfileSerializer(
                profile,
                context={'request': request}
            )
            return Response({'success': True, 'profile': profileSerializer.data})
        return Response({'success': False, 'error': "no field with name %s" % settingName})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


@api_view(['GET'])
def updateAllUsersEmptyAvatarImages(request):
    r = Response({'success': True})
    allUsersProfiles = Profile.objects.all()
    imageData = getDefaultAvatarImageData()
    for profile in allUsersProfiles:
        if not profile.avatarImage:
            ext = settings.DEFAULT_AVATAR_IMAGE_PATH.split('/')[-1].split(".")[-1]
            avatarImageName = "%d.%s" % (profile.user.id, ext)
            data = ContentFile(imageData, name=avatarImageName)
            profile.avatarImage = data
            profile.save()
    return r
