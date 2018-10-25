import {Injectable} from "@angular/core";
import {BaseService} from "./base.service";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {Transaction} from "./wallet.service";


@Injectable()
export class CurrencyService extends BaseService {

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/currency";
    }

    lwfBundleToCryptoCurrency(code: string, amount: number) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/lwfbundletocryptocurrency/`,
                {
                    code: code,
                    amount: amount
                },
                {headers: this.getHeaders()}
            ).toPromise();
    }

    lwfBundleToEuro(amount: number) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/lwfBundleToEuro/`,
                {
                    amount: amount
                },
                {headers: this.getHeaders()}
            ).toPromise();
    }

    EuroToDollars(amount: number) {
        return this.http
            .post(`${this.getApiUrl()}/EuroToDollars/`,
                {
                    amount: amount
                },
                {headers: this.getHeaders()}
            ).toPromise();
    }
}