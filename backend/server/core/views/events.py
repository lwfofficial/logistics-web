from django.core.paginator import Paginator
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Profile, Event
from core.serializers import EventSerializer


@api_view(['POST'])
def getEvents(request):
    user = request.user
    order = request.data.get('order')
    if order == 'desc':
        order = ''
    else:
        order = '-'
    sort = "%s%s" % (order, request.data.get('sort'))
    page = request.data.get('page')
    maxPerPage = request.data.get('maxPerPage')
    try:
        profile = Profile.objects.get(user=user)
        events = Event.objects.filter(profile=profile).order_by(sort)
        paginator = Paginator(events, maxPerPage)
        events = EventSerializer(paginator.page(page), many=True, context={'request': request})
        return Response({'success': True, 'events': events.data, 'eventsCount': paginator.count})
    except Profile.DoesNotExist:
        return Response({'success': False, 'error': 'auth.error'})
