import copy, base64, hashlib, socket, traceback, hashlib

from django.utils.encoding import smart_str
from django.conf import settings
from models import *


def p_ex(request, exception, priority=3, category_id=1, extra_ex='', notes=''):
    """
    process exception
    """
    if settings.DEBUG_LOG_EXCEPTIONS:
        try:
            cat = DebugCategory.objects.get(id=category_id)
        except Exception, ex:
            cat = DebugCategory.objects.get(id=1)

        server_name = socket.gethostname()
        tb_text = traceback.format_exc()
        class_name = exception.__class__.__name__
        checksum = hashlib.md5(tb_text).hexdigest()

        if not request.user.is_anonymous:
            user = request.user
        else:
            user = None

        ex_str = "ClassName: %s\n\n%s" % (class_name, tb_text)

        if request.META:
            ex_str += '\n\nREQUEST META:\n'
            for e in request.META:
                ex_str += '\n%s: "%s"\n' % (e,smart_str(request.META[e]))

        dr = DebugRow(
            request_path=request.build_absolute_uri(),
            ex=ex_str + "\n",
            user=user,
            category=cat,
            priority=priority,
            extra_ex=extra_ex,
            notes=notes
        )
        dr.save()
    return True


class ExceptionLog(object):
    """
    Middleware for exceptions
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        p_ex(request, exception)
        return None