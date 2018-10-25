# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import requests
import uuid
import os
from datetime import datetime

from django.conf import settings
from django.contrib.auth.models import User, Group
from django.http import HttpResponse, HttpResponseRedirect, HttpResponseServerError
from django.template import RequestContext
from django.shortcuts import render

from transactions.manager import TransactionManager
from transactions.models import Wallet
from core.models import Profile


def adminCatchUserBc(request):
    m = {}
    success = False
    userId = int(request.GET['userId'])
    userToCatch = User.objects.get(id=userId)
    profileToCatch = Profile.objects.get(user=userToCatch)
    walletToCatch = Wallet.objects.get(profile=profileToCatch)
    allManagers = User.objects.filter(
        is_staff=True,
        groups__name=settings.MANAGERS_GROUP_NAME
    )
    managers = []
    for user in allManagers:
        user.profile = Profile.objects.get(user=user)
        user.wallet = Wallet.objects.get(profile=user.profile)
        managers.append(user)

    if request.method == 'POST':
        amount = float(request.POST['amount'])
        managerId = int(request.POST['manager'])
        managerToSend = User.objects.get(id=managerId)
        profileToSend = Profile.objects.get(user=managerToSend)
        walletToSend = Wallet.objects.get(profile=profileToSend)

        if amount > walletToCatch.credit:
            m['outofcash'] = True
        else:
            if walletToCatch.id == walletToSend.id:
                m['samewallet'] = True
            else:
                if amount > 0:
                    TransactionManager.createAdminTransaction(
                        amount,
                        walletToCatch.id,
                        walletToSend.id,
                        request.user
                    )
                    success = True

        #REFRESH DATA
        walletToCatch = Wallet.objects.get(profile=profileToCatch)

    m['userToCatch'] = userToCatch
    m['profileToCatch'] = profileToCatch
    m['walletToCatch'] = walletToCatch
    m['managers'] = managers

    if success:
        if request.scheme.lower().find('https') > -1:
            redirUrl = "%s&success=true" % (
                request.build_absolute_uri().replace("http://", "https://")
            )
        else:
            redirUrl = "%s&success=true" % (
                request.build_absolute_uri().replace("https://", "http://")
            )
        return HttpResponseRedirect(
            redirUrl
        )
    else:
        return render(
            request,
            'admin/pages/catch_user_bc.html',
            m
        )


def adminSendUserBc(request):
    m = {}
    success = False
    userId = int(request.GET['userId'])
    userToSend = User.objects.get(id=userId)
    profileToSend = Profile.objects.get(user=userToSend)
    walletToSend = Wallet.objects.get(profile=profileToSend)
    allManagers = User.objects.filter(
        is_staff=True,
        groups__name=settings.MANAGERS_GROUP_NAME
    )
    managers = []
    for user in allManagers:
        user.profile = Profile.objects.get(user=user)
        user.wallet = Wallet.objects.get(profile=user.profile)
        managers.append(user)

    if request.method == 'POST':
        amount = float(request.POST['amount'])
        managerId = int(request.POST['manager'])
        managerToCatch = User.objects.get(id=managerId)
        profileToCatch = Profile.objects.get(user=managerToCatch)
        walletToCatch = Wallet.objects.get(profile=profileToCatch)
        m['managerToCatch'] = managerToCatch
        m['walletToCatch'] = walletToCatch

        if amount > walletToCatch.credit:
            m['outofcash'] = True
        else:
            if walletToSend.id == walletToCatch.id:
                m['samewallet'] = True
            else:
                if amount > 0:
                    TransactionManager.createAdminTransaction(
                        amount,
                        walletToCatch.id,
                        walletToSend.id,
                        request.user
                    )
                    success = True

        #REFRESH DATA
        walletToSend = Wallet.objects.get(profile=profileToSend)

    m['userToSend'] = userToSend
    m['profileToSend'] = profileToSend
    m['walletToSend'] = walletToSend
    m['managers'] = managers

    if success:
        if request.scheme.lower().find('https') > -1:
            redirUrl = "%s&success=true" % (
                request.build_absolute_uri().replace("http://", "https://")
            )
        else:
            redirUrl = "%s&success=true" % (
                request.build_absolute_uri().replace("https://", "http://")
            )
        return HttpResponseRedirect(
            redirUrl
        )
    else:
        return render(
            request,
            'admin/pages/send_user_bc.html',
            m
        )