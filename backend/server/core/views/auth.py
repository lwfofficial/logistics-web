# -*- coding: utf-8 -*-

import uuid
from datetime import datetime, timedelta
from threading import Thread
import django

from django.conf import settings
from django.contrib.auth.models import User
from django.core.mail import EmailMessage
from django.http import Http404
from django.shortcuts import render
from django.template.loader import render_to_string
from django.utils import timezone
from django.core.files.base import ContentFile
from rest_framework.authtoken.models import Token
from rest_framework.compat import authenticate
from rest_framework.decorators import api_view
from rest_framework.generics import get_object_or_404
from rest_framework.response import Response
from rest_framework.status import HTTP_401_UNAUTHORIZED
from twilio.rest import Client

from core.models import Profile, AccountTier, Notification, Address, Event, Configuration, ClosedBetaEmailAddress, \
    NewsLetterEmailAddress, getDefaultAvatarImageData
from core.serializers import ProfileSerializer
from transactions.manager import TransactionManager
from transactions.models import Wallet
from debugapp.middleware import p_ex


@api_view(["POST"])
def login(request):
    username = request.data.get("username")
    if username:
        username = username.lower()
    password = request.data.get("password")
    disableLogEvent = request.data.get("disableLogEvent")

    user = authenticate(username=username, password=password)
    if not user:
        #maybe email
        try:
            user2Try = User.objects.get(email__iexact=username)
            user = authenticate(username=user2Try.username, password=password)
        except Exception as ex:
            user2Try = None
            user = None
        if not user2Try:
            return Response({"success": False, "error": "login.failed"}, status=HTTP_401_UNAUTHORIZED)
    try:
        profile = Profile.objects.get(user=user)
        if not profile.mobileVerified:
            return Response({
                "success": False,
                "error": 'mobile.notverified',
                'activationKey': profile.activationKey
            })
        wallet = Wallet.objects.get(
            profile=profile
        )
        profileSerializer = ProfileSerializer(
            profile,
            context={'request': request}
        )
    except Profile.DoesNotExist:
        return Response({"success": False, "error": "login.failed"}, status=HTTP_401_UNAUTHORIZED)

    token, _ = Token.objects.get_or_create(user=user)
    if not disableLogEvent:
        Event().createEvent(
            'LOGIN',
            'USERACTIVITY',
            '',
            profile,
            request
        )
    return Response({
        "success": True,
        "token": token.key,
        'profile': profileSerializer.data,
    })


@api_view(["POST"])
def logout(request):
    token = request.data.get("token")
    djangoToken = Token.objects.filter(key=token).first()
    if djangoToken:
        djangoToken.delete()
    return Response({
        "success": True
    })


def createDefaultWallets(profile):
    Wallet.objects.create(
        profile=profile,
    ).save()


@api_view(["POST"])
def signup(request):
    name = request.data.get("name")
    surname = request.data.get("surname")
    email = request.data.get("email")
    if email:
        email = email.lower()
    username = request.data.get("username")
    if username:
        username = username.lower()
    error = checkUserAlreadyRegistered(email, username)
    if error:
        return Response({
            'success': False,
            'error': error
        })
    user = User.objects.create_user(username, email, email, last_login=timezone.now())
    user.first_name = name
    user.last_name = surname
    user.is_active = False
    user.save()
    profile = Profile()
    profile.user = user
    profile.setActivationKey()
    profile.setKeyExpires()
    profile.save()
    createDefaultWallets(profile)

    #set default avatar
    try:
        imageData = getDefaultAvatarImageData()
        ext = settings.DEFAULT_AVATAR_IMAGE_PATH.split('/')[-1].split(".")[-1]
        avatarImageName = "%d.%s" % (profile.user.id, ext)
        data = ContentFile(imageData, name=avatarImageName)
        profile.avatarImage = data
        profile.save()
    except:
        pass

    # Admin Notification
    adminNotification = Notification()
    adminNotification.email = True
    adminNotification.user = User.objects.get(
        username="admin"
    )
    adminNotification.setEmailData(
        "New LWF user registered",
        "notifications/email/admin_email_user_registered.html",
        {
            'user': user,
        }
    )
    Thread(target=adminNotification.process, args=(), kwargs={}).start()
    sendRegistrationEmail(profile)
    return Response({'success': True})


@api_view(["POST"])
def verifySignup(request):
    activation_key = request.data.get("activationKey")
    profile = get_object_or_404(Profile, activationKey=activation_key)
    profile.accountTier = AccountTier.TIER_1
    profile.save()
    profileSerializer = ProfileSerializer(profile)
    return Response({
        'success': True,
        'profile': profileSerializer.data,
    })


@api_view(["POST"])
def verifyResetPassword(request):
    activation_key = request.data.get("activationKey")
    try:
        profile = get_object_or_404(Profile, activationKey=activation_key)
        if (django.utils.timezone.now() > (profile.keyExpires+timedelta(hours=settings.PROFILE_ACTIVATION_KEY_EXPIRE_TIMEOUT))):
            return Response({
                'success': False,
                'error': {
                    'code': 'key.expired',
                    'msg': ''
                }
            })
        return Response({
            'success': True,
        })
    except Http404 as e:
        return Response({'success': False, 'error': {'code': 'no.user.found', 'msg': e.message}})


@api_view(['POST'])
def signupLevel1(request):
    activationKey = request.data.get('activationKey')
    verifyMobileNumber = request.data.get('verifyMobileNumber')
    profile = get_object_or_404(Profile, activationKey=activationKey)
    profile.user.set_password(request.data.get('password'))
    profile.user.is_active = True
    profile.user.save()
    profile.dob = request.data.get('dob')
    address = Address()
    address.country = request.data.get('country')
    address.region = request.data.get('region')
    address.city = request.data.get('city')
    address.street = request.data.get('address')
    address.zipCode = request.data.get('zipcode')
    address.save()
    profile.defaultAddress = address
    profile.mobile = request.data.get('mobile')
    if request.data.get('ssn') and len(request.data.get('ssn')) > 0:
        profile.ssn = request.data.get('ssn')
    profile.termsAgreement = request.data.get('agreement')
    profile.setVerificationCode()
    profile.save()
    try:
        if verifyMobileNumber:
            messageSend = sendVerificationCodeSMS(request, profile.verificationCode, profile.mobile)
        else:
            profile.setActivationKey()
            profile.mobileVerified = True
            profile.save()
        return Response({'success': True})
    except Exception as e:
        return Response({'success': False, 'error': {'code': 'no.sms.sent', 'msg': e.message}})


@api_view(['POST'])
def verifyMobileNumber(request):
    verificationCode = request.data.get('code')
    email = request.data.get('email')
    if email:
        email = email.lower()
    user = get_object_or_404(User, email__iexact=email)
    profile = get_object_or_404(Profile, user=user)
    success = profile.verificationCode == verificationCode
    if success:
        profile.setActivationKey()
        profile.setVerificationCode()
        profile.mobileVerified = True
        if profile.accountTier < AccountTier.TIER_2:
            profile.accountTier = AccountTier.TIER_2
    profile.save()
    return Response({'success': success})


@api_view(['POST'])
def sendVerifyMobileNumber(request):
    email = request.data.get('email')
    if email:
        email = email.lower()
    user = get_object_or_404(User, email__iexact=email)
    profile = get_object_or_404(Profile, user=user)
    profile.setVerificationCode()
    profile.save()
    messageSend = sendVerificationCodeSMS(request, profile.verificationCode, profile.mobile)
    if not messageSend:
        return Response({'success': False, 'error': {'code': 'no.sms.sent', 'msg': e.message}})
    return Response({'success': True})


@api_view(['POST'])
def send2FASMS(request):
    email = request.data.get('email')
    if email:
        email = email.lower()
    success = False
    try:
        user = get_object_or_404(User, email__iexact=email)
        profile = get_object_or_404(Profile, user=user)
        wallet = Wallet.objects.get(profile=profile)
        TransactionManager.createVerify2FASMSTransaction(settings.TWO_FACTOR_SMS_COST, wallet.id)
        profile.setVerificationCode()
        profile.save()
        messageSend = sendVerificationCodeSMS(request, profile.verificationCode, profile.mobile)
        success = messageSend
    except ValueError:
        profile.enable2FASMS = False
        notification = Notification()
        notification.alert = True
        notification.user = profile.user
        alertText = "Two factor authentication has been disabled due to low credit"
        notification.alertData = alertText
        notification.save()
        profile.save()
    except Exception as e:
        return Response({'success': False, 'error': {'code': 'no.sms.sent', 'msg': e.message}})
    return Response({'success': success})


@api_view(['POST'])
def passwordRecovery(request):
    email = request.data.get('email')
    if email:
        email = email.lower()
    try:
        user = get_object_or_404(User, email__iexact=email)
        profile = get_object_or_404(Profile, user=user)
        Thread(target=sendPasswordResetEmail, args=(profile,), kwargs={}).start()
        return Response({'success': True})
    except Http404 as e:
        return Response({'success': False, 'error': {'code': 'no.user.found', 'msg': e.message}})


@api_view(["POST"])
def resetPassword(request):
    activation_key = request.data.get("activationKey")
    try:
        profile = get_object_or_404(Profile, activationKey=activation_key)
        profile.user.set_password(request.data.get('newPassword'))
        profile.user.save()
        profile.setActivationKey()
        profile.save()
        return Response({
            'success': True,
        })
    except Http404 as e:
        return Response({'success': False, 'error': {'code': 'no.user.found', 'msg': e.message}})


@api_view(["POST"])
def addNewsLetterEmail(request):
    email = request.data.get("email")
    if email:
        email = email.lower()
    try:
        NewsLetterEmailAddress.objects.get(email__iexact=email)
    except NewsLetterEmailAddress.DoesNotExist:
        newEmail = NewsLetterEmailAddress()
        newEmail.email = email
        newEmail.save()
        adminNotification = Notification()
        adminNotification.email = True
        adminNotification.user = User.objects.get(
            username="admin"
        )
        adminNotification.setEmailData(
            "New user signed for newsletter",
            "notifications/email/newsletter_email_registered.html",
            {
                'email': email,
            }
        )
        Thread(target=adminNotification.process, args=(), kwargs={}).start()
    return Response({
        'success': True,
    })


def sendVerificationCodeSMS(request, verificationCode, mobileNumber):
    client = Client(
        settings.SMS_API_SID,
        settings.SMS_API_TOKEN
    )
    try:
        message = client.messages.create(
            to=mobileNumber,
            messaging_service_sid=settings.SMS_SERVICE_SID,
            body='Verification code: %s' % verificationCode
        )
        message.sid
        return True
    except Exception, ex:
        p_ex(
            request,
            ex,
            3,
            1,
            'Failed to send sms to: %s' % (mobileNumber)
        )
        return False
    p_ex(
        request,
        ex,
        3,
        1,
        'Failed to send sms to: %s' % (mobileNumber)
    )
    return False


def sendRegistrationEmail(profile):
    protocol = 'http'
    if settings.FRONTEND_SSL:
        protocol = 'https'
    confirmationLink = "%s://%s:%s/signup/%s" % (
        protocol,
        settings.FRONTEND_HOST,
        settings.FRONTEND_PORT,
        str(profile.activationKey)
    )

    # User Notification
    userNotification = Notification()
    userNotification.email = True
    userNotification.user = profile.user
    userNotification.setEmailData(
        "Confirm your registration to LWF",
        "notifications/email/user_registration.html",
        {
            'user': profile.user,
            'confirmation_link': confirmationLink
        }
    )

    Thread(target=userNotification.process, args=(), kwargs={}).start()

    profile.setKeyExpires()
    profile.save()


def checkUserAlreadyRegistered(email, username):
    closedBetaEnabled = Configuration.objects.get(key='enable_closed_signup_list').value
    if closedBetaEnabled == 'True':
        try:
            ClosedBetaEmailAddress.objects.get(email__iexact=email)
        except ClosedBetaEmailAddress.DoesNotExist:
            return {
                'code': 'signup.closed.beta',
                'msg': 'Sign up enabled only for closed beta users.'
            }
    try:
        user = User.objects.get(email__iexact=email)
        profile = Profile.objects.get(user=user)
        if not user.is_active and profile.keyExpires < timezone.now():
            sendRegistrationEmail(profile)
            return {
                'code': 'signup.expired',
                'msg': 'Signup expired'
            }
        return {
            'code': 'email.alreadyregistered',
            'msg': 'User already registered.'
        }
    except User.DoesNotExist:
        pass
    except Profile.DoesNotExist:
        pass
    try:
        user = User.objects.get(username__iexact=username)
        profile = Profile.objects.get(user=user)
        if not user.is_active and profile.keyExpires < timezone.now():
            return {
                'code': 'signup.expired',
                'msg': 'Signup expired'
            }
        return {
            'code': 'username.alreadyregistered',
            'msg': 'User already registered.'
        }
    except User.DoesNotExist:
        pass
    return None


def sendPasswordResetEmail(profile):
    protocol = 'http'
    profile.setKeyExpires()
    profile.save()
    if settings.FRONTEND_SSL:
        protocol = 'https'

    confirmationLink = "%s://%s:%s/password-recovery/reset/%s" % (
        protocol,
        settings.FRONTEND_HOST,
        settings.FRONTEND_PORT,
        str(profile.activationKey)
    )
    emailId = str(uuid.uuid4())
    now = datetime.now()
    headers = {
        "Date": "%s, %s %s %s %s:%s:%s -0000" % (
            datetime.strftime(now, "%a"),
            datetime.strftime(now, "%d"),
            datetime.strftime(now, "%b"),
            datetime.strftime(now, "%Y"),
            datetime.strftime(now, "%H"),
            datetime.strftime(now, "%M"),
            datetime.strftime(now, "%S")
        ),
        "Message-ID": emailId
    }
    mailBody = render_to_string(
        'password_reset_mail.html',
        {
            'confirmation_link': confirmationLink,
            'user': profile.user,
            'validityHours': settings.PROFILE_ACTIVATION_KEY_EXPIRE_TIMEOUT,
            'baseUrl': Notification().getEmailBaseUrl()
        }
    )

    emailMessage = EmailMessage(subject='Reset your LWF password',
                                headers=headers,
                                body=mailBody,
                                from_email=settings.EMAIL_DEFAULT_FROM,
                                to=[profile.user.email])
    emailMessage.content_subtype = "html"  # Main content is now text/html
    emailMessage.send()


def testTemplateEmail(request):
    protocol = 'http'
    if settings.FRONTEND_SSL:
        protocol = 'https'

    obj = {
        'currency': 'ciao'
    }
    m = {
        'confirmation_link': 'http://www.google.it'
    }
    return render(request, "notifications/email/registration_mail.html", m)
