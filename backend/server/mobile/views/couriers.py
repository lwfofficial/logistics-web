import django
import requests
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile
from mobile.models import InstantDeliveryCourier, InstantDeliveryOrder
from mobile.serializers import InstantDeliveryCourierSerializer, InstantDeliveryOrderSerializer

GOOGLE_DISTANCE_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json?&origins=%s&destinations=%s&key=%s'


@api_view(['POST'])
def createCourier(request):
    try:
        user = request.user
        profile = Profile.objects.get(
            user=user,
            docVerified=True,
            ProofOfresidenceVerified=True,
            SelfIDocVerified=True
        )
        courierSerializer = InstantDeliveryCourierSerializer(data=request.data)
        if courierSerializer.is_valid():
            request.data['profile'] = profile
            courier = courierSerializer.create(request.data)
            courier.save()
            courierSerializer = InstantDeliveryCourierSerializer(courier, context={'request': request})
            return Response({'success': True, 'courier': courierSerializer.data},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success': False, 'errors': courierSerializer.errors})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['PUT'])
def editCourier(request):
    try:
        user = request.user
        profile = Profile.objects.get(
            user=user,
            docVerified=True,
            ProofOfresidenceVerified=True,
            SelfIDocVerified=True
        )
        request.data['profile'] = profile
        courierSerializer = InstantDeliveryCourierSerializer(data=request.data)
        courier = InstantDeliveryCourier.objects.get(id=request.data.get('id'))
        if courierSerializer.is_valid():
            courier = courierSerializer.update(courier, request.data)
            courier.dateUpdated = django.utils.timezone.now()
            courier.save()
            courierSerializer = InstantDeliveryCourierSerializer(courier, context={'request': request})
            return Response({'success': True, 'courier': courierSerializer.data},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success': False, 'errors': courierSerializer.errors})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['GET'])
def getCourier(request, courier_id):
    try:
        user = request.user
        Profile.objects.get(user=user)
        courier = InstantDeliveryCourier.objects.get(id=courier_id)
        courierSerializer = InstantDeliveryCourierSerializer(courier, context={'request': request})
        return Response({'success': True, 'courier': courierSerializer.data}, status=status.HTTP_202_ACCEPTED)
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['GET'])
def getCourierByProfile(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        courier = InstantDeliveryCourier.objects.get(profile=profile)
        courierSerializer = InstantDeliveryCourierSerializer(courier, context={'request': request})
        return Response({'success': True, 'courier': courierSerializer.data}, status=status.HTTP_202_ACCEPTED)
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['POST'])
def toggleEnableNewRequests(request):
    try:
        user = request.user
        profile = Profile.objects.get(user=user)
        courier = InstantDeliveryCourier.objects.get(profile=profile)
        courier.enableNewRequests = request.data.get('enableNewRequests')
        courier.save()
        courierSerializer = InstantDeliveryCourierSerializer(courier, context={'request': request})
        return Response({'success': True, 'courier': courierSerializer.data}, status=status.HTTP_202_ACCEPTED)
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['POST'])
def searchCourier(request):
    try:
        user = request.user
        Profile.objects.get(user=user)
        priceRange = request.data.get('priceRange')
        originLat = request.data.get('locationFromLat')
        originLng = request.data.get('locationFromLng')
        latDelta = request.data.get('latDelta')
        lngDelta = request.data.get('lngDelta')
        destinationLat = request.data.get('locationToLat')
        destinationLng = request.data.get('locationToLng')
        originString = "%s,%s" % (originLat, originLng)
        destinationString = "%s,%s" % (destinationLat, destinationLng)
        url = GOOGLE_DISTANCE_URL % (originString, destinationString, settings.GOOGLE_API_KEY)
        response = requests.get(url).json()
        distance = response['rows'][0]['elements'][0]['distance']['value']
        couriers = InstantDeliveryCourier.objects.filter(
            pickUpLocationLat__gte=originLat - latDelta,
            pickUpLocationLat__lte=originLat + latDelta,
            pickUpLocationLng__gte=originLng - lngDelta,
            pickUpLocationLng__lte=originLng + lngDelta,
        )
        courierSerializer = InstantDeliveryCourierSerializer(couriers, many=True, context={'request': request})
        return Response(
            {
                'success': True,
                'distance': distance / 1000.0,
                'couriers': courierSerializer.data,
                'couriersFound': len(couriers),
                'cheapestPrice': 0.0
            },
            status=status.HTTP_202_ACCEPTED
        )
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['POST'])
def searchCourierOrderRequests(request):
    try:
        user = request.user
        Profile.objects.get(user=user)
        latDelta = request.data.get('latDelta')
        lngDelta = request.data.get('lngDelta')
        pickupLat = request.data.get('pickupLat')
        pickupLng = request.data.get('pickupLng')
        orders = InstantDeliveryOrder.objects.filter(
            locationFromLat__gte=pickupLat - latDelta,
            locationFromLat__lte=pickupLat + latDelta,
            locationFromLng__gte=pickupLng - lngDelta,
            locationFromLng__lte=pickupLng + lngDelta,
            state='NEW',
            expired=False
        )
        orderSerializer = InstantDeliveryOrderSerializer(orders, many=True, context={'request': request})
        return Response({
            'success': True,
            'orders': orderSerializer.data,
        },
            status=status.HTTP_202_ACCEPTED
        )
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})
