import {BaseService} from "./base.service";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";


export enum SHIPPING_MODE {
    CHEAP,
    STANDARD,
    EXPRESS
}

export const ORDER_STATUS = {
    new: 'NEW',
    cancelled: 'CANCELLED',
    paid: 'PAID',
    accepted: 'ACCEPTED',
    refused: 'REFUSED',
    collecting: 'COLLECTING',
    forwarded: 'FORWARDED',
    delivered: 'DELIVERED',
    received: 'RECEIVED',
};

export class Order {
    dateCreated;
    estimatedDate;
    forwarderDeliveryDate;
    goodType;
    shippingMode;
    totalPrice;
    totalInsurance;
    refuseReason;
    state;
    code;
    profile;
    service;
    notes;
    trackings;

    constructor() {
    }
}


@Injectable()
export class  OrderService extends BaseService {

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/order";
    }

    getOrders(sort: string, order: string, page: number, maxPerPage: number) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/`,
                {sort: sort, order: order, page: page, maxPerPage: maxPerPage},
                {headers: this.getHeaders()}
            );
    }

    getCouriers() {
        let headers = this.getHeaders();
        return this.http
            .get(`${this.getApiUrl()}/getCouriers/`,
                {headers: headers}
            );
    }

    getForwarderOrders(sort: string, order: string, page: number, maxPerPage: number) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/forwarder/`,
                {sort: sort, order: order, page: page, maxPerPage: maxPerPage},
                {headers: this.getHeaders()}
            );
    }

    getOrder(orderId) {
        return this.http
            .get<Order>(`${this.getApiUrl()}/${orderId}`,
                {headers: this.getHeaders()}
            );
    }

    getForwarderOrder(orderId) {
        return this.http
            .get<Order>(`${this.getApiUrl()}/forwarder/${orderId}`,
                {headers: this.getHeaders()}
            );
    }

    createOrder(formData) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/create/`,
                formData,
                {headers: this.getHeaders()}
            );
    }

    editOrder(formData) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/edit/`,
                formData,
                {headers: this.getHeaders()}
            );
    }

    deleteOrder(orderId) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/delete/`,
                {orderId},
                {headers: this.getHeaders()}
            ).toPromise();
    }

    payOrder(orderId) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/payment/`,
                {orderId},
                {headers: this.getHeaders()}
            );
    }

    createOrderNote(imageData, noteText, orderId) {
        let headers = this.getHeaders();
        return this.http
            .post(`${this.getApiUrl()}/createOrderNote/`,
                {
                    noteImage: imageData,
                    noteText: noteText,
                    orderId: orderId
                },
                {headers: headers}
            ).toPromise();
    }

    acceptOrRefuse(orderId, accept) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/forwarder/acceptOrRefuse/`,
                {accept: accept, orderId: orderId},
                {headers: this.getHeaders()}
            );
    }

    updateRefuseReason(orderId, reasonText) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/updateRefuseReason/`,
                {
                    orderId: orderId,
                    reasonText: reasonText
                },
                {headers: this.getHeaders()}
            );
    }

    collecting(orderId) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/forwarder/collecting/`,
                {orderId: orderId},
                {headers: this.getHeaders()}
            );
    }

    forwardedDelivered(orderId) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/forwarder/forwardedDelivered/`,
                {orderId: orderId},
                {headers: this.getHeaders()}
            );
    }

    cancel(orderId) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/buyer/cancel/`,
                {orderId: orderId},
                {headers: this.getHeaders()}
            );
    }

    delivered(orderId) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/buyer/delivered/`,
                {orderId: orderId},
                {headers: this.getHeaders()}
            );

    }

    received(orderId) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/buyer/received/`,
                {orderId: orderId},
                {headers: this.getHeaders()}
            );

    }

    updateBuyerTrackingInfo(form) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/buyer/updateTrackingInfo/`,
                form,
                {headers: this.getHeaders()}
            );
    }

    updateForwarderTrackingInfo(form) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/forwarder/updateTrackingInfo/`,
                form,
                {headers: this.getHeaders()}
            );

    }

    updateForwarderPartnerTrackingInfo(form) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/forwarder/updateForwarderPartnerTrackingInfo/`,
                form,
                {headers: this.getHeaders()}
            );

    }

    sendBuyerFeedbackToForwarder(form) {
        return this.http
            .post(`${this.getApiUrl()}/buyer/feedback/`,
                form,
                {headers: this.getHeaders()}
            );

    }

    sendForwarderFeedbackToBuyer(form) {
        return this.http
            .post(`${this.getApiUrl()}/forwarder/feedback/`,
                form,
                {headers: this.getHeaders()}
            );

    }

    getPartnerForwarderPrice(form) {
        return this.http
            .post(`${this.getApiUrl()}/partnerOrderPrice/`,
                form,
                {headers: this.getHeaders()}
            );

    }

    getPartnerCourierWeightList(type) {
        return this.http
            .post(`${this.getApiUrl()}/getPartnerCourierWeightList/`,
                {type:type},
                {headers: this.getHeaders()}
            );

    }

}
