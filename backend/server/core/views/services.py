import django
from django.conf import settings
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Service, TimeSlot, Location, Configuration
from core.serializers import ServiceSerializer, ServiceProtectedSerializer
from debugapp.middleware import p_ex
from managers import CountryManager
from settings import SERVICE_TYPES
from transactions.models import Wallet


@api_view(['POST'])
def createService(request):
    try:
        user = request.user
        profile = Profile.objects.get(
            user=user,
            docVerified=True,
            ProofOfresidenceVerified=True,
            SelfIDocVerified=True
        )
        timeSlotIds = getTimeSlotIds(request)
        locationFrom = getLocationFrom(request)
        locationTosIds = getCountryTosIds(request)
        profileForwarderAddress = request.data['profileForwarderAddress']
        try: #fix fake frontend form field
            del request.data['locationFromSelect']
        except:
            pass
        serviceSerializer = ServiceSerializer(data=request.data)
        if serviceSerializer.is_valid():
            request.data['profile'] = profile
            service = serviceSerializer.create(request.data)
            service.timeSlots = timeSlotIds
            service.locationTos = locationTosIds
            service.locationFrom = locationFrom
            service.profileForwarderAddress = profileForwarderAddress
            service.save()
            return Response({'success': True},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success': False, 'errors': serviceSerializer.errors})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['POST'])
def toggleEnable(request):
    try:
        enabled = request.data.get('enabled')
        user = request.user
        profile = Profile.objects.get(
            user=user,
            docVerified=True,
            ProofOfresidenceVerified=True,
            SelfIDocVerified=True
        )
        services = Service.objects.filter(profile=profile)
        for service in services:
            service.enabled = enabled
            service.save()
        return Response({'success': True})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['POST'])
def singleToggleEnable(request):
    try:
        enabled = request.data.get('enabled')
        serviceId = request.data.get('serviceId')
        user = request.user
        profile = Profile.objects.get(
            user=user,
            docVerified=True,
            ProofOfresidenceVerified=True,
            SelfIDocVerified=True
        )
        service = Service.objects.get(
            profile=profile,
            id=int(serviceId)
        )
        service.enabled = enabled
        service.save()
        return Response({'success': True})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        p_ex(
            request,
            e,
            5,
            1,
            'Failed to toggle service id: %s' % (serviceId)
        )
        return Response({'success': False, 'errors': e.message})


@api_view(['PUT'])
def editService(request):
    try:
        user = request.user
        profile = Profile.objects.get(
            user=user,
            docVerified=True,
            ProofOfresidenceVerified=True,
            SelfIDocVerified=True
        )
        request.data['profile'] = profile
        timeSlotIds = getTimeSlotIds(request)
        locationFrom = getLocationFrom(request)
        locationTosIds = getCountryTosIds(request)
        profileForwarderAddress = request.data['profileForwarderAddress']
        serviceSerializer = ServiceSerializer(data=request.data)
        service = Service.objects.get(id=request.data.get('id'))
        if serviceSerializer.is_valid():
            service = serviceSerializer.update(service, request.data)
            service.timeSlots = timeSlotIds
            service.locationTos = locationTosIds
            service.locationFrom = locationFrom
            service.profileForwarderAddress = profileForwarderAddress
            service.updated = django.utils.timezone.now()
            service.save()
            return Response({'success': True},
                            status=status.HTTP_201_CREATED)
        else:
            return Response({'success': False, 'errors': serviceSerializer.errors})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['GET'])
def getServices(request):
    try:
        user = request.user
        profile = Profile.objects.get(
            user=user,
            docVerified=True,
            ProofOfresidenceVerified=True,
            SelfIDocVerified=True
        )
        services = Service.objects.filter(profile=profile).order_by("-updated")
        serviceSerializer = ServiceSerializer(services, many=True, context={'request': request})
        return Response({'success': True, 'services': serviceSerializer.data})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['GET'])
def getService(request, service_id):
    try:
        user = request.user
        Profile.objects.get(user=user)
        service = Service.objects.get(id=service_id)
        serviceSerializer = ServiceProtectedSerializer(service, context={'request': request})
        return Response({'success': True, 'service': serviceSerializer.data}, status=status.HTTP_202_ACCEPTED)
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['DELETE'])
def deleteService(request, service_id):
    try:
        user = request.user
        profile = Profile.objects.get(
            user=user,
            docVerified=True,
            ProofOfresidenceVerified=True,
            SelfIDocVerified=True
        )
        service = Service.objects.get(profile=profile, id=service_id)
        service.delete()
        return Response({'success': True}, status=status.HTTP_202_ACCEPTED)
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'profile.notfound'})
    except Exception as e:
        return Response({'success': False, 'errors': e.message})


@api_view(['POST'])
def quickSearchForwarders(request):
    user = request.user
    countryCodeFrom = request.data.get('countryCodeFrom')
    countryCodeTo = request.data.get('countryCodeTo')
    locationCountryTos = Location.objects.filter(countryCode=countryCodeTo).values_list('pk', flat=True)
    services = Service.objects.filter(
        type='p2p-freight',
        enabled=True,
        locationFrom__countryCode=countryCodeFrom,
        locationTos__in=list(locationCountryTos),
    ).distinct()
    serviceSerializer = ServiceProtectedSerializer(services, many=True, context={'request': request})

    return Response({
        'success': True,
        'services': serviceSerializer.data,
        'startPrice': findLowestPrice(services, countryCodeTo),
    })


def findLowestPrice(services, countryCodeTo):
    if len(services) == 0:
        return 0
    for s in services:
        originCountry = CountryManager.countryByCoutryCode(s.locationFrom.countryCode)['name']
        destinationCountry = CountryManager.countryByCoutryCode(countryCodeTo)['name']
        s.setLowestPrice(
            shippingWeight=0.5,
            originCountry=originCountry,
            destinationCountry=destinationCountry,
            margin=s.partnerForwarderMargin
        )

    return min(map(lambda s: s.lowestPrice, services))


@api_view(['POST'])
def searchP2PForwarders(request):
    user = request.user
    profile = Profile.objects.get(user=user)
    locationFrom = request.data.get('locationFrom')
    locationFromList = Location.objects.filter(countryCode=locationFrom['countryCode'])
    locationFrom = locationFromList.values_list('pk', flat=True)
    locationTo = request.data.get('locationTo')
    locationToList = Location.objects.filter(countryCode=locationTo['countryCode'])
    locationTo = locationToList.values_list('pk', flat=True)
    maxWeight = request.data.get('maxWeight')
    maxSize = request.data.get('maxSize')
    maxGoodValue = request.data.get('maxGoodValue')
    if profile.currencySetting == settings.PROFILE_CURRENCY_SETTINGS[1][0]:
        maxGoodValue = Service.eurToUsdConversion(maxGoodValue)
    configMaxGoodValuePercentage = Configuration().getConfiguration("p2p_forwarder_maxgoodvalue_percentage")
    services = []
    if request.data.get('acceptedPacksFromPrivateOrCompany'):
        acceptPackagesFromprivateOrCompanyQuery = Q(acceptedPacksFromPrivate=True)
    else:
        acceptPackagesFromprivateOrCompanyQuery = Q(acceptedPacksFromCompany=True)
    servicesTmp = Service.objects.filter(
        Q(
            type=SERVICE_TYPES[0][0],
            enabled=True,
            locationFrom__in=list(locationFrom),
            locationTos__in=list(locationTo),
            maxSize__gte=maxSize,
            maxWeight__gte=maxWeight,
        )
        & acceptPackagesFromprivateOrCompanyQuery
    ).exclude(profile=profile).distinct()

    # Check Max Good Value in Service -> profile -> wallet
    for s in servicesTmp:
        wallet = Wallet.objects.get(
            profile=s.profile
        )
        if wallet.deposit > 0:
            walletMaxGoodValue = (configMaxGoodValuePercentage * wallet.deposit) / 100
            if walletMaxGoodValue >= maxGoodValue:
                services.append(s)
    shippingWeight = 0.5
    if maxWeight == 1:
        shippingWeight = 7
    elif maxWeight == 2:
        shippingWeight = 8
    for s in services:
        originCountry = CountryManager.countryByCoutryCode(s.locationFrom.countryCode)['name']
        destinationCountry = CountryManager.countryByCoutryCode(locationToList[0].countryCode)['name']
        s.setLowestPrice(
            shippingWeight=shippingWeight,
            originCountry=originCountry,
            destinationCountry=destinationCountry,
            margin=s.partnerForwarderMargin
        )

    serviceSerializer = ServiceProtectedSerializer(services, many=True, context={'request': request})


    return Response({'success': True, 'services': serviceSerializer.data})


@api_view(['POST'])
def searchPackageCollectors(request):
    user = request.user
    profile = Profile.objects.get(user=user)
    locationFrom = request.data.get('locationFrom')
    locationFrom = Location.objects.filter(countryCode=locationFrom['countryCode'],
                                           name=locationFrom['name']).values_list('pk', flat=True)
    maxWeight = request.data.get('maxWeight')
    maxSize = request.data.get('maxSize')
    deliveryOnTimeSlotQuery = Q()
    deliveryOnWeekDaysQuery = Q()
    if request.data.get('acceptedPacksFromPrivateOrCompany'):
        acceptPackagesFromprivateOrCompanyQuery = Q(acceptedPacksFromPrivate=True)
    else:
        acceptPackagesFromprivateOrCompanyQuery = Q(acceptedPacksFromCompany=True)
    if request.data.get("deliveryOnDawn"):
        deliveryOnTimeSlotQuery = Q(deliveryOnDawn=request.data.get("deliveryOnDawn"))
    if request.data.get("deliveryOnMorning"):
        deliveryOnTimeSlotQuery |= Q(deliveryOnMorning=request.data.get("deliveryOnMorning"))
    if request.data.get("deliveryOnLunchTime"):
        deliveryOnTimeSlotQuery |= Q(deliveryOnLunchTime=request.data.get("deliveryOnLunchTime"))
    if request.data.get("deliveryOnAfternoon"):
        deliveryOnTimeSlotQuery |= Q(deliveryOnAfternoon=request.data.get("deliveryOnAfternoon"))
    if request.data.get("deliveryOnEvening"):
        deliveryOnTimeSlotQuery |= Q(deliveryOnEvening=request.data.get("deliveryOnEvening"))
    if request.data.get("deliveryOnNight"):
        deliveryOnTimeSlotQuery |= Q(deliveryOnNight=request.data.get("deliveryOnNight"))
    if request.data.get("sunday"):
        deliveryOnWeekDaysQuery |= Q(sunday=request.data.get("sunday"))
    if request.data.get("monday"):
        deliveryOnWeekDaysQuery |= Q(monday=request.data.get("monday"))
    if request.data.get("tuesday"):
        deliveryOnWeekDaysQuery |= Q(tuesday=request.data.get("tuesday"))
    if request.data.get("wednesday"):
        deliveryOnWeekDaysQuery |= Q(wednesday=request.data.get("wednesday"))
    if request.data.get("thursday"):
        deliveryOnWeekDaysQuery |= Q(thursday=request.data.get("thursday"))
    if request.data.get("friday"):
        deliveryOnWeekDaysQuery |= Q(friday=request.data.get("friday"))
    if request.data.get("saturday"):
        deliveryOnWeekDaysQuery |= Q(saturday=request.data.get("saturday"))
    services = Service.objects.filter(
        Q(
            type=SERVICE_TYPES[1][0],
            enabled=True,
            locationFrom__in=list(locationFrom),
            maxSize__gte=maxSize,
            maxWeight__gte=maxWeight
        ),
        acceptPackagesFromprivateOrCompanyQuery,
        deliveryOnTimeSlotQuery,
        deliveryOnWeekDaysQuery
    ).exclude(profile=profile).distinct()
    serviceSerializer = ServiceProtectedSerializer(services, many=True, context={'request': request})
    return Response({'success': True, 'services': serviceSerializer.data})


@api_view(['GET'])
def courierPartnerCost(request):
    try:
        user = request.user
        Profile.objects.get(user=user)
        curierFeeAmount = Configuration().getConfiguration(
            "dhl_partner_fee"
        )
        return Response({'success': True, 'curierFeeAmount': curierFeeAmount})
    except Exception as e:
        return Response({'success': False, 'error': e.message})


def getTimeSlotIds(request):
    if not request.data.get('timeSlots'):
        return []
    timeSlotIds = []
    for timeSlot in request.data.get('timeSlots'):
        try:
            newTimeSlot = TimeSlot.objects.get(start=timeSlot['start'], end=timeSlot['end'])
        except TimeSlot.DoesNotExist:
            newTimeSlot = TimeSlot.objects.create(start=timeSlot['start'], end=timeSlot['end'])
            newTimeSlot.save()
        newTimeSlot.save()
        timeSlotIds.append(newTimeSlot.id)
    del request.data['timeSlots']
    return timeSlotIds


def getLocationFrom(request):
    locationFrom = request.data.get('locationFrom')
    if not locationFrom:
        return None
    try:
        newLocationFrom = Location.objects.get(name=locationFrom['name'], countryCode=locationFrom['countryCode'])
    except Location.DoesNotExist:
        newLocationFrom = Location.objects.create(
            name=locationFrom['name'],
            countryCode=locationFrom['countryCode'],
            lat=locationFrom['lat'],
            lng=locationFrom['lng']
        )
    newLocationFrom.save()
    del request.data['locationFrom']
    return newLocationFrom


def getCountryTosIds(request):
    if not request.data.get('locationTos'):
        return []
    locationTosIds = []
    for locationTo in request.data.get('locationTos'):
        try:
            newLocationTo = Location.objects.get(name=locationTo['name'], countryCode=locationTo['countryCode'])
        except Location.DoesNotExist:
            newLocationTo = Location.objects.create(
                name=locationTo['name'],
                countryCode=locationTo['countryCode'],
            )
            newLocationTo.save()
        newLocationTo.save()
        locationTosIds.append(newLocationTo.id)
    del request.data['locationTos']
    return locationTosIds
