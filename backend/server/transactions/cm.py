import requests

from django.conf import settings


class CurrencyManager(object):
    """
    Class for obtain currencies from coinmarketcap
    api v2
    """

    def __init__(self, *args, **kwargs):
        self.url = settings.CURRENCY_API_URL
        self.urlLwf = settings.LWF_CURRENCY_API_URL
        self.currency_data_schema = {
            "code": None,
            "eur": 0,
            "usd": 0
        }
        super(CurrencyManager, self).__init__(*args, **kwargs)

    def clean(self, stringData):
        stringData = stringData.replace(" ","")
        stringData = stringData.replace("\r","")
        stringData = stringData.replace("\n","")
        stringData = stringData.replace("\t","")
        return stringData

    def doReq(self):
        req = requests.get(self.url)
        return req.json()

    def doReqLwf(self):
        req = requests.get(self.urlLwf)
        return req.json()

    def processResponse(self, resp):
        data = []

        if resp.get("data"):
            for k, c in resp.get("data").iteritems():
                cData = self.currency_data_schema.copy()
                cData['code'] = self.clean(
                    c.get("symbol").upper()
                ) if c.get("symbol") else None
                if c.get("quotes"):
                    if c.get("quotes").get("USD"):
                        cData['usd'] = float(
                            c.get("quotes").get("USD")['price']
                        )
                if c.get("quotes"):
                    if c.get("quotes").get("EUR"):
                        cData['eur'] = float(
                            c.get("quotes").get("EUR")['price']
                        )
                data.append(cData)

        return data

    def processResponseLwf(self, resp):
        data = []

        if resp.get("data"):
            cData = self.currency_data_schema.copy()
            cData['code'] = self.clean(
                resp.get("data").get("symbol").upper()
            ) if resp.get("data").get("symbol") else None
            if resp.get("data").get("quotes"):
                if resp.get("data").get("quotes").get("USD"):
                    cData['usd'] = float(
                        resp.get("data").get("quotes").get("USD")['price']
                    )
            if resp.get("data").get("quotes"):
                if resp.get("data").get("quotes").get("EUR"):
                    cData['eur'] = float(
                        resp.get("data").get("quotes").get("EUR")['price']
                    )
            data.append(cData)

        return data

    def getCurrencies(self):
        data = []

        resp = self.doReq()
        respLwf = self.doReqLwf()

        dataBigList = self.processResponse(resp)
        dataLwf = self.processResponseLwf(respLwf)

        for c in dataBigList:
            data.append(c)

        for c in dataLwf:
            data.append(c)

        return data
