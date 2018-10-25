import {BaseService} from "./base.service";
import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {Order} from "./order.service";


export const ISSUE_STATUS = {
    open: 'OPEN',
    closed: 'CLOSED',
};


@Injectable()
export class IssueService extends BaseService {

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/issue";
    }


    createIssue(data) {
        return this.http
            .post(`${this.getApiUrl()}/create/`,
                data,
                {headers: this.getHeaders()}
            );
    }

    getIssue(issueId) {
        return this.http
            .get<Order>(`${this.getApiUrl()}/${issueId}`,
                {headers: this.getHeaders()}
            );
    }

    closeIssue(issueId) {
        return this.http
            .post<Order>(`${this.getApiUrl()}/close/`,
                {
                    issueId: issueId,
                },
                {headers: this.getHeaders()}
            ).toPromise();
    }
}