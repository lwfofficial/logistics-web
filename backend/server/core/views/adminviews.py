# -*- coding: utf-8 -*-
import csv
import traceback

from django import forms
from django.conf import settings
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.models import Issue, PartnerCourier, Order, PartnerCourierPrice, OrderNote, Profile

issueTypes = settings.ISSUE_TYPES.copy()
issueStatus = settings.ISSUE_STATUS.copy()


@staff_member_required
def documentsVerification(request):
    m = {}
    userId = int(request.GET['userId'])
    user = User.objects.get(id=userId)
    profile = Profile.objects.get(user=user)
    m['user'] = user
    m['profile'] = profile
    return render(
        request,
        'admin/pages/verification.html',
        m
    )

@staff_member_required
def adminAjaxVerificationValidate(request):
    r = {
        'success': False,
    }
    userId = int(request.POST['userId'])
    user = User.objects.get(id=userId)
    profile = Profile.objects.get(user=user)
    typeOfDocument = request.POST['typeOfDocument']
    if typeOfDocument == 'IDDocFrontImage' or typeOfDocument == 'IDDocBackImage':
        profile.docVerified = True
        profile.save()
        r['success'] = True
    elif typeOfDocument == 'ProofOfresidenceImage':
        profile.ProofOfresidenceVerified = True
        profile.save()
        r['success'] = True
    elif typeOfDocument == 'SelfIDocImage':
        profile.SelfIDocVerified = True
        profile.save()
        r['success'] = True
    return JsonResponse(r)


@staff_member_required
def adminAjaxVerificationInvalidate(request):
    r = {
        'success': False,
    }
    userId = int(request.POST['userId'])
    user = User.objects.get(id=userId)
    profile = Profile.objects.get(user=user)
    typeOfDocument = request.POST['typeOfDocument']
    if typeOfDocument == 'IDDocFrontImage' or typeOfDocument == 'IDDocBackImage':
        profile.docVerified = False
        profile.save()
        r['success'] = True
    elif typeOfDocument == 'ProofOfresidenceImage':
        profile.ProofOfresidenceVerified = False
        profile.save()
        r['success'] = True
    elif typeOfDocument == 'SelfIDocImage':
        profile.SelfIDocVerified = False
        profile.save()
        r['success'] = True
    return JsonResponse(r)

@staff_member_required
def adminIssueManage(request):
    m = {}
    issueId = int(request.GET['issueId'])
    issue = Issue.objects.get(id=issueId)
    m['issue'] = issue
    m['typeStr'] = issueTypes[issue.type]
    return render(
        request,
        'admin/issues/issue_manage.html',
        m
    )


@staff_member_required
def adminAjaxIssueClose(request):
    r = {
        'success': False,
        'chat': None
    }
    try:
        issueId = int(request.POST['issueId'])
        issue = Issue.objects.get(id=issueId)
        issue.state = issueStatus['CLOSED']
        issue.save()
        r['success'] = True
    except Exception, ex:
        r['error'] = "%s" % (
            traceback.format_exc()
        )
    if r.get('error'):
        return JsonResponse(r, status=500)
    return JsonResponse(r)


class UpdateCourierPricesForm(forms.Form):
    file = forms.FileField()
    type = forms.ChoiceField(choices=(('standard', 'standard'), ('express', 'express')))
    partnerCourierId = forms.IntegerField(widget=forms.HiddenInput())


class DeleteCourierPricesForm(forms.Form):
    type = forms.ChoiceField(choices=(('standard', 'standard'), ('express', 'express')))
    partnerCourierId = forms.IntegerField(widget=forms.HiddenInput())


@staff_member_required
def adminCourierPriceManage(request):
    partnerCourierId = int(request.GET['partnerCourierId'])
    partnerCourier = PartnerCourier.objects.get(id=partnerCourierId)
    updateForm = UpdateCourierPricesForm(initial={'partnerCourierId': partnerCourierId})
    deleteForm = DeleteCourierPricesForm(initial={'partnerCourierId': partnerCourierId})
    return render(
        request,
        'admin/partnerCourier/courier_manage_prices.html',
        {
            'partnerCourier': partnerCourier,
            'updateForm': updateForm,
            'deleteForm': deleteForm
        }
    )


@api_view(['POST', ])
def deleteAllCourierPrices(request):
    form = UpdateCourierPricesForm(data=request.POST, files=request.FILES)
    partnerCourierId = form['partnerCourierId'].value()
    partnerCourier = PartnerCourier.objects.get(id=partnerCourierId)
    deleted, _ = PartnerCourierPrice.objects.filter(
        partnerCourier=partnerCourier,
        type=form['type'].value()
    ).delete()
    return Response({
        'success': True,
        'pricesDeleted': deleted,
    })


@api_view(['POST', ])
def updateCourierPrices(request):
    form = UpdateCourierPricesForm(data=request.POST, files=request.FILES)
    partnerCourierId = form['partnerCourierId'].value()
    partnerCourier = PartnerCourier.objects.get(id=partnerCourierId)
    if form.is_valid():
        data = csv.DictReader(request.FILES['file'])
        if data.fieldnames[0:9] != ['weight', '1', '2', '3', '4', '5', '6', '7', '8']:
            return Response(
                {
                    'success': False,
                    'errors': ["file format must be: weight,1,2,3, ... , N"]
                }
            )
        zones = data.fieldnames[1:]
        pricesUpdated = 0
        pricesCreated = 0
        for row in data:
            for zone in zones:
                try:
                    courierPrice = PartnerCourierPrice.objects.get(
                        partnerCourier=partnerCourier,
                        weight=float(row['weight']),
                        zone=zone,
                        type=form.cleaned_data['type']
                    )
                    courierPrice.price = row[zone]
                    courierPrice.save()
                    pricesUpdated += 1
                except PartnerCourierPrice.DoesNotExist:
                    newCourierPrice = PartnerCourierPrice()
                    newCourierPrice.partnerCourier = partnerCourier
                    newCourierPrice.zone = zone
                    newCourierPrice.weight = float(row['weight'])
                    newCourierPrice.type = form.cleaned_data['type']
                    newCourierPrice.price = row[zone]
                    newCourierPrice.save()
                    pricesCreated += 1
        return Response({
            'success': True,
            'pricesUpdated': pricesUpdated,
            'pricesCreated': pricesCreated
        })
    else:
        return Response({'success': False, 'errors': form.errors})


class OrderNotesForm(forms.ModelForm):
    class Meta:
        model = OrderNote
        exclude = ['id', 'dateCreated', 'orderStatus']
        widgets = {'order': forms.HiddenInput(), 'profile': forms.HiddenInput()}

    def __init__(self, *args, **kwargs):
        super(OrderNotesForm, self).__init__(*args, **kwargs)

        self.fields['document'].required = True
        self.fields['description'].required = True


@staff_member_required
def adminOrderNotesManage(request):
    orderId = int(request.GET['orderId'])
    order = Order.objects.get(id=orderId)
    return render(
        request,
        'admin/orders/orders_manage_notes.html',
        {
            'order': order,
            'form': OrderNotesForm(initial={
                'order': order,
                'profile': order.service.profile,
                'orderStatus': order.state
            })
        }
    )


@api_view(['POST', ])
def adminSendOrderNote(request):
    form = OrderNotesForm(data=request.POST, files=request.FILES)
    if form.is_valid():
        form.save()
        return Response({
            'success': True,
        })
    else:
        return Response({'success': False, 'errors': form.errors})
