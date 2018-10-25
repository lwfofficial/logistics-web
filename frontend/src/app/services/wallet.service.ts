import {Injectable} from "@angular/core";
import {BaseService} from "./base.service";
import {Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";

export interface Transaction {
    hash: string;
    status: string;
    date: Date;
    type: string;
    currency: string;
    amount: number;
    address: any;
}

@Injectable()
export class WalletService extends BaseService {

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/wallet";
    }


    getDepositTransactions(sort: string, order: string, page: number, maxPerPage: number) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/transactions/deposit/`,
                {sort: sort, order: order, page: page, maxPerPage: maxPerPage},
                {headers: this.getHeaders()}
            );
    }

    getDepositPaypalTransactions(sort: string, order: string, page: number, maxPerPage: number) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/transactions/deposit/paypal/`,
                {sort: sort, order: order, page: page, maxPerPage: maxPerPage},
                {headers: this.getHeaders()}
            );
    }

    getWithdrawTransactions(sort: string, order: string, page: number, maxPerPage: number) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/transactions/withdraw/`,
                {sort: sort, order: order, page: page, maxPerPage: maxPerPage},
                {headers: this.getHeaders()}
            );
    }

    getDepositAddress(currency) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/getAddress/`,
                {currency: currency},
                {headers: this.getHeaders()}
            );
    }

    depositCaution(data) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/deposit/`,
                data,
                {headers: this.getHeaders()}
            );
    }

    withDraw(data) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/withdraw/`,
                data,
                {headers: this.getHeaders()}
            ).toPromise();
    }

    executePaypalPayment(paymentId, payerId) {
        return this.http
            .post<Transaction>(`${this.getApiUrl()}/deposit/paypal/`,
                {
                    paymentId: paymentId,
                    payerId: payerId
                },
                {headers: this.getHeaders()}
            );
    }


    getDepositReceipt(transactionId) {
        let headers = this.getHeaders();
        return this.http
            .get(`${this.getApiUrl()}/deposit/invoice/${transactionId}`,
                {headers: headers, responseType: 'blob'}
            );
    }

    getWithdrawReceipt(transactionId) {
        let headers = this.getHeaders();
        return this.http
            .get(`${this.getApiUrl()}/withdraw/invoice/${transactionId}`,
                {headers: headers, responseType: 'blob'}
            );
    }

    getDepositPaypalReceipt(transactionId) {
        let headers = this.getHeaders();
        return this.http
            .get(`${this.getApiUrl()}/deposit/paypal/invoice/${transactionId}`,
                {headers: headers, responseType: 'blob'}
            );
    }

    getBuyerOrderPaymentReport(orderId) {
        let headers = this.getHeaders();
        return this.http
            .get(`${this.getApiUrl()}/order/buyer/report/${orderId}`,
                {headers: headers, responseType: 'blob'}
            );
    }

    getForwarderOrderPaymentReport(orderId) {
        let headers = this.getHeaders();
        return this.http
            .get(`${this.getApiUrl()}/order/forwarder/report/${orderId}`,
                {headers: headers, responseType: 'blob'}
            );
    }

}