import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {BaseService} from "./base.service";

@Injectable()
export class GeocodeService extends BaseService {

    constructor(http: HttpClient) {
        super(http);
        this.apiUrl = "api/maps";

    }

    autocomplete(place) {
        return this.http
            .post(`${this.getApiUrl()}/autocomplete/`,
                {place: place},
                // {headers: this.getHeaders()}
            );
    }

    details(placeId) {
        return this.http
            .post(`${this.getApiUrl()}/details/`,
                {placeId: placeId},
                // {headers: this.getHeaders()}
            );
    }

    geocodeSearch(address) {
        return this.http
            .post(`${this.getApiUrl()}/geocodeSearch/`,
                {address: address},
                // {headers: this.getHeaders()}
            );
    }

}