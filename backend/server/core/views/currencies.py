from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Currency


@api_view(['POST'])
def lwfBundleToCryptoCurrency(request):
    user = request.user
    code = request.data.get('code')
    amount = float(request.data.get('amount'))
    try:
        Profile.objects.get(user=user)
        freezedCurrency = Currency().getCurrency(code)
        newAmount = (amount / freezedCurrency.usd)
        return Response({
            'success': True,
            'value': "%0.8f" % (newAmount)
        })
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'auth.error'})


@api_view(['POST'])
def lwfBundleToEuro(request):
    user = request.user
    amount = float(request.data.get('amount'))
    try:
        Profile.objects.get(user=user)
        btcCurrency = Currency().getCurrency('BTC')
        return Response({
            'success': True,
            'value': amount * (btcCurrency.eur / btcCurrency.usd)
        })
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'auth.error'})

@api_view(['POST'])
def EuroToDollars(request):
    user = request.user
    amount = float(request.data.get('amount'))
    try:
        Profile.objects.get(user=user)
        btcCurrency = Currency().getCurrency('BTC')
        return Response({
            'success': True,
            'value': amount * (btcCurrency.usd / btcCurrency.eur)
        })
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'auth.error'})