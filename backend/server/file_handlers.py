import os

from django.conf import settings
from django.views.static import serve
from django.http import HttpResponse
from rest_framework.authtoken.models import Token


from core.models import Profile, Order, Issue, Chat, OrderNote, ChatMessage

def canServeFile(user, fullPath, smallPath):
    #docs
    if fullPath.lower().find("/media/id_docs_front/") > -1 \
            or fullPath.lower().find("/media/id_docs_back/") > -1 \
            or fullPath.lower().find("/media/por_docs/") > -1 \
            or fullPath.lower().find("/media/self_id_docs/") > -1:
        profile = Profile.objects.get(user=user)
        if profile.IDDocFrontImage:
            if fullPath.find(profile.IDDocFrontImage.url) > -1:
                return True
        if profile.IDDocBackImage:
            if fullPath.find(profile.IDDocBackImage.url) > -1:
                return True
        if profile.ProofOfresidenceImage:
            if fullPath.find(profile.ProofOfresidenceImage.url) > -1:
                return True
        if profile.SelfIDocImage:
            if fullPath.find(profile.SelfIDocImage.url) > -1:
                return True

    #order notes
    elif fullPath.lower().find("/media/order_docs_front/") > -1:
        orderNoteList = OrderNote.objects.filter(
            document=smallPath
        )
        if len(orderNoteList) > 0:
            orderNote = orderNoteList[0]
            if orderNote.order.profile.user == user:
                return True
            elif orderNote.order.service.profile.user == user:
                return True

    #chat messages
    elif fullPath.lower().find("/media/issue_doc/") > -1:
        chatMessageList = ChatMessage.objects.filter(
            image=smallPath
        )
        if len(chatMessageList) > 0:
            chatMessage = chatMessageList[0]
            if chatMessage.chat.buyer == user:
                return True
            elif chatMessage.chat.forwarder == user:
                return True

    return False

def mediaServe(request, path, document_root=None, show_indexes=False):
    errorResponse = HttpResponse('', status=404)

    #public folders
    if request.path.lower().find("/media/avatar/") > -1:
        return serve(request, path, document_root, show_indexes)

    #check authentication
    if request.user.is_anonymous:
        token = request.COOKIES.get('token')
        if token:
            djangoToken = Token.objects.filter(key=token)
            if len(djangoToken) > 0:
                user = djangoToken[0].user
                canServe = canServeFile(user, request.path, path)
                if canServe:
                    return serve(request, path, document_root, show_indexes)
                else:
                    return errorResponse
            else:
                return errorResponse
        else:
            return errorResponse
    else:
        #staff member
        if request.user.is_staff:
            return serve(request, path, document_root, show_indexes)

    return errorResponse