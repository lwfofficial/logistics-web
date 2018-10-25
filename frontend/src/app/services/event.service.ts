import {BaseService} from "./base.service";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {Injectable} from "@angular/core";

export class Event {
    id: number;
    name: string;
    description: string;
    detail: string;
    dateCreated: Date;
}

@Injectable()
export class EventService extends BaseService {

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/event";
    }

    getEvents(sort: string, order: string, page: number, maxPerPage: number) {
        return this.http
            .post<Event>(`${this.getApiUrl()}/`,
                {sort: sort, order: order, page: page, maxPerPage: maxPerPage},
                {headers: this.getHeaders()}
            );
    }
}