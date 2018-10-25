import {Injectable} from "@angular/core";
import {BaseService} from "./base.service";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {Subject} from "rxjs";

@Injectable()
export class ConfigurationService extends BaseService {

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/configuration";
    }

    getConfiguration() {
        return this.http
            .get(`${this.getApiUrl()}/get/`,
                {}
            ).toPromise();
    }

    getConfByKey(key){
        let confs:any = JSON.parse(atob(localStorage.getItem('configuration')));
        for (let conf of confs){
            if( conf.key === key ) {
                return conf;
            }
        }
        return null;
    }
}