import {BaseService} from "./base.service";
import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {Time} from "@angular/common";

export const SERVICE_TYPE = {
    p2p: 'p2p-freight',
    cll: 'package-collecting',
    exp: 'express-delivery'
};


export enum MAX_WEIGHT {
    TINY,
    MEDIUM,
    HEAVY
}

export enum MAX_GOOD_VALUES {
    LOW,
    MEDIUM,
    HIGH
}

export enum GOOD_TYPES {
    ELECTRONICS,
    CLOTHING,
    BEAUTY,
    HOME,
    SPORTS,
}


export enum MAX_SIZE {
    SMALL,
    MEDIUM,
    LARGE
}

export class Location {
    name: string;
    countryCode: string;
    lat: string;
    lng: string;

    constructor(name, countryCode) {
        this.name = name;
        this.countryCode = countryCode;
    }
}

export class Service {
    id: any;
    type: string;
    title: string;
    enabled: boolean = false;
    price: number;
    priceCheap: number = 0.0;
    priceStandard: number = 0.0;
    priceExpress: number = 0.0;
    priceCheapEnabled: boolean = false;
    priceStandardEnabled: boolean = false;
    priceExpressEnabled: boolean = false;
    profileForwarderAddress: string;
    locationFrom: Location;
    locationTos: Location[];
    maxSize: number = MAX_SIZE.SMALL;
    maxWeight: number = MAX_WEIGHT.TINY;
    maxGoodValue: number = MAX_GOOD_VALUES.LOW;
    totalAssurance: boolean = false;
    acceptedPacksFromPrivate: boolean = false;
    acceptedPacksFromCompany: boolean = false;
    addPartnerForwarder: boolean = false;
    partnerForwarderMargin: number;
    otherCourierPartnerName: string;
    addOtherPartner: boolean = false;
    timeSlots: TimeSlot[];
    sunday: boolean = false;
    monday: boolean = false;
    tuesday: boolean = false;
    wednesday: boolean = false;
    thursday: boolean = false;
    friday: boolean = false;
    saturday: boolean = false;
    deliveryOnDawn: boolean = false;
    deliveryOnMorning: boolean = false;
    deliveryOnAfternoon: boolean = false;
    deliveryOnEvening: boolean = false;
    deliveryOnLunchTime: boolean = false;
    deliveryOnNight: boolean = false;
    profile: any;

    constructor(type) {
        this.type = type;
    }
}

export class TimeSlot {
    id: any;
    start: Time;
    end: Time;
}

export const SIZES = [MAX_SIZE.SMALL, MAX_SIZE.MEDIUM, MAX_SIZE.LARGE];
export const WEIGHTS = [MAX_WEIGHT.TINY, MAX_WEIGHT.MEDIUM, MAX_WEIGHT.HEAVY];
export const GOOD_VALUES = [MAX_GOOD_VALUES.LOW, MAX_GOOD_VALUES.MEDIUM, MAX_GOOD_VALUES.HIGH];
export const GOOD_TYPES_VALUES = [GOOD_TYPES.ELECTRONICS, GOOD_TYPES.CLOTHING, GOOD_TYPES.BEAUTY, GOOD_TYPES.HOME, GOOD_TYPES.SPORTS];


@Injectable()
export class ServiceService extends BaseService {

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/service";
    }

    createService(data) {
        return this.http
            .post(`${this.getApiUrl()}/create/`,
                data,
                {headers: this.getHeaders()}
            ).toPromise();
    }

    getServices() {
        return this.http
            .get<Service>(`${this.getApiUrl()}/`,
                {headers: this.getHeaders()}
            );
    }

    deleteService(serviceId) {
        return this.http
            .delete<Service>(`${this.getApiUrl()}/delete/${serviceId}`,
                {headers: this.getHeaders()}
            );
    }

    getService(serviceId) {
        return this.http
            .get<Service>(`${this.getApiUrl()}/${serviceId}`,
                {headers: this.getHeaders()}
            );
    }

    editService(service) {
        return this.http
            .put(`${this.getApiUrl()}/edit/`,
                service,
                {headers: this.getHeaders()}
            );
    }

    toggleEnableAllServices(enabled) {
        return this.http
            .post(`${this.getApiUrl()}/toggleEnable/`,
                {enabled: enabled},
                {headers: this.getHeaders()}
            );
    }

    singleToggleEnable(enabled, serviceId) {
        return this.http
            .post(`${this.getApiUrl()}/singleToggleEnable/`,
                {
                    enabled: enabled,
                    serviceId: serviceId
                },
                {headers: this.getHeaders()}
            ).toPromise();
    }

    forwarderQuickSearch(countryCodeFrom, countryCodeTo) {
        return this.http
            .post(`${this.getApiUrl()}/searchQuickForwarders/`,
                {countryCodeFrom: countryCodeFrom, countryCodeTo: countryCodeTo}
            ).toPromise();
    }

    forwarderSearch(formData) {
        return this.http
            .post(`${this.getApiUrl()}/searchForwarders/`, formData,
                {headers: this.getHeaders()})
            .toPromise();
    }

    packageCollectorSearch(formData) {
        return this.http
            .post(`${this.getApiUrl()}/searchPackageCollectors/`,
                formData,
                {headers: this.getHeaders()})
            .toPromise();
    }

    getPartnerCost() {
        return this.http
            .get(`${this.getApiUrl()}/courierPartnerCost/`,
                {headers: this.getHeaders()});
    }
}