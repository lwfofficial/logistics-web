import requests
from rest_framework.response import Response
from rest_framework.decorators import api_view

from django.conf import settings

AUTOCOMPLETE_BASE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json?input=%s&types=(cities)&language=en&key=%s'
DETAILS_BASE_URL = 'https://maps.googleapis.com/maps/api/place/details/json?placeid=%s&key=%s'
GEOCODE_SEARCH_URL = 'https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s'



@api_view(['POST'])
def autocomplete(request):
    url = AUTOCOMPLETE_BASE_URL % (request.data.get('place'), settings.GOOGLE_API_KEY)
    return Response({'success': True,
                     'places': requests.get(url).json()
                     })


@api_view(['POST'])
def details(request):
    url = DETAILS_BASE_URL % (request.data.get('placeId'), settings.GOOGLE_API_KEY)
    return Response({'success': True,
                     'places': requests.get(url).json()
                     })


@api_view(['POST'])
def geocodeSearch(request):
    url = GEOCODE_SEARCH_URL % (request.data.get('address'), settings.GOOGLE_API_KEY)
    return Response({'success': True,
                     'places': requests.get(url).json()
                     })
