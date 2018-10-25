# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Configuration
from core.serializers import ConfigurationSerializer


@api_view(['GET'])
def getConfiguration(request):

    configurations = Configuration.objects.all()

    configurationSerializer = ConfigurationSerializer(
        configurations,
        many=True,
        context={'request': request}
    )

    return Response({'success': True, 'configuration': configurationSerializer.data})