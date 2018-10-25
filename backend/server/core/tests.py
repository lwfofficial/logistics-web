# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib.auth.models import User
from django.test import TestCase

from core.models import Wallet, Profile

from core.views.users import generateBalances


class WebApiTest(TestCase):
    def setUp(self):
        user = User.objects.create_user('user', 'user', 'user')
        profile = Profile()
        profile.user = user
        profile.setActivationKey()
        profile.setKeyExpires()
        profile.save()
        wallets = [
            Wallet(currency='BTC', credit=0),
            Wallet(currency='ETH', credit=1.1),
            Wallet(currency='BTC', credit=0.1),
            Wallet(currency='BTC', credit=0.2),
            Wallet(currency='ETH', credit=1.2)
        ]
        for wallet in wallets:
            wallet.profile = profile
            wallet.save()
