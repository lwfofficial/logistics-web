import time
import traceback

from datetime import datetime
from dateutil.parser import parse

import requests
from django.conf import settings


class AddressTransactionsManager(object):

    def __init__(self, url, address,  *args, **kwargs):
        self.url = url
        self.address = self.clean(address)
        self.tx_data_schema = {
            "hash": None,
            "value": 0,
            "confirmations": 0,
            "positive": False,
            "date": None,
        }
        self.error_data_schema = {
            "error": True,
            "message": None
        }
        super(AddressTransactionsManager, self).__init__(*args, **kwargs)

    def clean(self, stringData):
        stringData = stringData.replace(" ","")
        stringData = stringData.replace("\r","")
        stringData = stringData.replace("\n","")
        stringData = stringData.replace("\t","")
        return stringData

    def doReq(self):
        req = requests.get(self.url)
        return req.json()

    def getData(self):
        self.url = self.url.replace("ADDRESS", self.address)
        resp = self.doReq()
        return resp

    def errorReport(self, errorData):
        tmp_errorData = self.error_data_schema.copy()
        tmp_errorData['message'] = errorData['message']
        return [tmp_errorData]


class AtmBtc(AddressTransactionsManager):

    def __init__(self, address, *args, **kwargs):
        super(AtmBtc, self).__init__(
            settings.BTC_URL_ADDRESS_TRANSACTIONS,
            address,
            *args,
            **kwargs
        )

    def parseDateTime(self, dateTimeString):
        parsedDateTime = parse(dateTimeString)
        return parsedDateTime

    def getTransactions(self, onlyPositive=True):
        time.sleep(0.5)
        transactions = []
        data = self.getData()
        if data.get("error"):
            return self.errorReport({
                "message": data['error']
            })
        if data.get("txrefs"):
            for tx in data['txrefs']:
                #print self.clean(tx['tx_hash'])
                tmp_data = self.tx_data_schema.copy()
                tmp_data['hash'] = self.clean(tx['tx_hash'])
                tmp_data['value'] = tx['value'] / 100000000.0
                tmp_data['confirmations'] = tx.get('confirmations', 0)
                if tx['tx_input_n'] < 0:
                    tmp_data['positive'] = True
                tmp_data['date'] = self.parseDateTime(tx.get("confirmed")) \
                    if tx.get("confirmed") else None
                if onlyPositive:
                    if tmp_data['positive']:
                        transactions.append(tmp_data)
                else:
                    transactions.append(tmp_data)
        return transactions


class AtmEth(AddressTransactionsManager):

    def __init__(self, address, *args, **kwargs):
        super(AtmEth, self).__init__(
            settings.ETH_URL_ADDRESS_TRANSACTIONS,
            address,
            *args,
            **kwargs
        )

    def getTransactions(self, onlyPositive=True):
        time.sleep(0.5)
        transactions = []
        data = self.getData()
        if int(data["status"]) == 0:
            if not data['message'] == u'No transactions found':
                return self.errorReport({
                    "message": data['message']
                })
        for tx in data.get('result'):
            if int(tx['isError']) == 0 and str(tx['to']) == self.address:
                tmp_data = self.tx_data_schema.copy()
                tmp_data['hash'] = self.clean(str(tx['hash']))
                tmp_data['value'] = int(tx['value']) / 1000000000000000000.0
                tmp_data['confirmations'] = int(tx.get('confirmations', 0))
                tmp_data['positive'] = True
                tmp_data['date'] = datetime.fromtimestamp(int(tx["timeStamp"]))
                if onlyPositive:
                    if tmp_data['positive']:
                        transactions.append(tmp_data)
                else:
                    transactions.append(tmp_data)
        return transactions


class AtmLwf(AddressTransactionsManager):

    def __init__(self, address, *args, **kwargs):
        super(AtmLwf, self).__init__(
            settings.LWF_URL_ADDRESS_TRANSACTIONS,
            address,
            *args,
            **kwargs
        )

    def getTransactions(self, onlyPositive=True):
        time.sleep(0.5)
        transactions = []
        data = self.getData()
        if data.get('transactions') is None:
            return self.errorReport({
                "message": u'No transactions found'
            })
        for tx in data.get('transactions'):
            tmp_data = self.tx_data_schema.copy()
            tmp_data['hash'] = self.clean(str(tx['id']))
            tmp_data['value'] = int(tx['amount']) / 100000000.0
            tmp_data['confirmations'] = int(tx.get('confirmations', 0))
            if str(tx['recipientId']) == self.address:
                if int(tx['amount']) > 0:
                    tmp_data['positive'] = True
            tmp_data['date'] = datetime.fromtimestamp(int(tx["timestamp"])+1464112800)
            if onlyPositive:
                if tmp_data['positive']:
                    transactions.append(tmp_data)
            else:
                transactions.append(tmp_data)

        return transactions