import time
import traceback

from datetime import datetime
from dateutil.parser import parse

import requests
from django.conf import settings


class OneSignal(object):

    def __init__(self, *args, **kwargs):
        self.urlSendNotification = 'https://onesignal.com/api/v1/notifications'
        self.apiKey = settings.ONESIGNAL_REST_API_KEY
        self.appId = settings.ONESIGNAL_APP_ID
        super(OneSignal, self).__init__(*args, **kwargs)

    def clean(self, stringData):
        stringData = stringData.replace(" ","")
        stringData = stringData.replace("\r","")
        stringData = stringData.replace("\n","")
        stringData = stringData.replace("\t","")
        return stringData

    def getHeaders(self):
        headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic %s' % self.apiKey,
        }
        return headers

    def getBaseData(self):
        data = {
            'app_id': self.appId
        }
        return data

    def doReq(self, url, data={}):
        data.update(self.getBaseData())
        req = requests.post(
            url,
            json=data,
            headers=self.getHeaders()
        )
        return req.json()

    def sendSpecificNotification(self, playerIdList=[], notificationData={}):
        r = {
            'success': False
        }
        notificationData.update({
            'include_player_ids': playerIdList
        })
        notification = self.doReq(
            self.urlSendNotification,
            notificationData
        )
        if notification.get('error'):
            r['error'] = notification['error']
        elif notification.get('errors'):
            r['error'] = ''
            for e in notification['errors']:
                r['error'] += '%s ' % e
        else:
            r['success'] = True
        return r
