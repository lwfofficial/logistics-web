"""server URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
import os

from django.conf import settings
from django.conf.urls import url, include
from django.contrib import admin
from django.views.static import serve
from rest_framework import routers

from core.urls import webapiUrls
from mobile.urls import mobileUrls
from transactions.ulrs import transactionUrls
from file_handlers import mediaServe

router = routers.DefaultRouter()

urlpatterns = [
                  url(
                      r'^',
                      include(router.urls)
                  ),
                  url(
                      r'^admin/',
                      admin.site.urls
                  ),
                  url(r'^adminmedia/(?P<path>.*)$', serve, {
                      'document_root': os.path.join(
                          os.path.dirname(os.path.dirname(__file__)),
                          'server/adminmedia/'
                      )
                  }),
                  url(r'^emailmedia/(?P<path>.*)$', serve, {
                      'document_root': os.path.join(
                          os.path.dirname(os.path.dirname(__file__)),
                          'server/emailmedia/'
                      )
                  }),
                  url(
                      r'^api-auth/',
                      include('rest_framework.urls', namespace='rest_framework')
                  ),
              ] \
              + [url(r'^%s(?P<path>.*)$' % settings.MEDIA_URL[1:], mediaServe, {'document_root': settings.MEDIA_ROOT})] \
              + transactionUrls \
              + webapiUrls \
              + mobileUrls
