import uuid

from django.conf import settings


def global_settings(request):
    if request.scheme.lower() == 'https':
        protocol = 'https://'
        port = '443'
    else:
        protocol = 'http://'
        port = settings.BACKEND_PORT
    if settings.REST_FRAMEWORK_CUSTOM_PATH != '':
        path = '/%s/' % settings.REST_FRAMEWORK_CUSTOM_PATH
    else:
        path = '/'
    return {
        'randomStr': str(uuid.uuid4()),
        'baseUrl': '%s%s:%s%s' % (
            protocol,
            settings.FRONTEND_HOST,
            port,
            path
        ),
        'settings': settings
    }