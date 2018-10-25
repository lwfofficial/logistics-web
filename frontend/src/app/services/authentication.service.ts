import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {CanActivate, Router} from "@angular/router";
import {AbstractApiService} from "./base.service";


@Injectable()
export class AuthenticationService extends AbstractApiService {

    private isLoggedInChecked: boolean = false;

    constructor(private router: Router,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/auth";
    }

    logout() {
        this.deleteAuthToken();
        this.delAuthCookie();
        this.router.navigate(['']);
    }

    login(user, disableLogEvent: boolean = false) {
        return this.http
            .post(`${this.getApiUrl()}/login/`, {
                username: user.username,
                password: user.password,
                disableLogEvent: disableLogEvent
            })
            .toPromise()
            .then((response: any) => {
                if (response.success) {
                    localStorage.setItem('token', response.token);
                    this.setAuthCookie(response.token, 3650);
                }
                return response;
            })
            .catch(response => {
                if (response.status == 401) {
                    return response.error;
                }
            });
    }

    signup(signupData) {
        return this.http
            .post(`${this.getApiUrl()}/signup/`, signupData)
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    verifySignup(activationKey) {
        return this.http
            .post(`${this.getApiUrl()}/verifySignup/`, {
                activationKey: activationKey
            })
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    withdrawConfirm(hashKey) {
        return this.http
            .post(`${this.getApiUrl()}/withdrawConfirm/`, {
                hashKey: hashKey
            })
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    verifyResetPassword(activationKey) {
        return this.http
            .post(`${this.getApiUrl()}/verifyResetPassword/`, {
                activationKey: activationKey
            })
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    passwordReset(activationKey, newPassword) {
        return this.http
            .post(`${this.getApiUrl()}/resetPassword/`, {
                activationKey: activationKey,
                newPassword: newPassword
            })
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    signupLevel1(formdata) {
        return this.http
            .post(`${this.getApiUrl()}/signupLevel1/`, formdata)
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    verifyMobileNumber(formdata) {
        return this.http
            .post(`${this.getApiUrl()}/verifyMobileNumber/`, formdata)
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    sendMobileVerification(email) {
        return this.http
            .post(
                `${this.getApiUrl()}/send2FASMS/`,
                {'email': email}
            );
    }

    sendVerifyMobileNumber(email) {
        return this.http
            .post(
                `${this.getApiUrl()}/sendVerifyMobileNumber/`,
                {'email': email}
            );
    }


    isLoggedIn() {
        let ls = localStorage.getItem('token');
        let ac = this.getAuthCookie();
        if (ls && ac) {
            return true;
        }
        return false;
    }

    sendPasswordResetEmail(email) {
        return this.http
            .post(`${this.getApiUrl()}/passwordRecovery/`, {
                email: email
            })
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    addNewsLetterEmail(email) {
        return this.http
            .post(`${this.getApiUrl()}/addNewsLetterEmail/`, {
                email: email
            })
            .toPromise()
            .then((response: any) => {
                return response;
            });
    }

    public deleteAuthToken() {
        let token = localStorage.getItem('token');
        if (token) {
            this.http
                .post(`${this.getApiUrl()}/logout/`, {
                    token: token
                })
                .toPromise()
                .then((response: any) => {
                })
                .catch(response => {
                });
        }
        localStorage.removeItem('token');

    }

    public setAuthCookie(value: string, expireDays: number) {
        const d: Date = new Date();
        d.setTime(d.getTime() + expireDays * 24 * 60 * 60 * 1000);
        const expires = `expires=${d.toUTCString()}`;
        document.cookie = `token=${value}; ${expires}; path=/`;
    }

    public delAuthCookie() {
        this.setAuthCookie('', -1);
    }

    public getAuthCookie() {
        const ca: Array<string> = document.cookie.split(';');
        const caLen: number = ca.length;
        const cookieName = `token=`;
        let c: string;

        for (let i  = 0; i < caLen; i += 1) {
            c = ca[i].replace(/^\s+/g, '');
            if (c.indexOf(cookieName) === 0) {
                return c.substring(cookieName.length, c.length);
            }
        }
        return null;
    }
}

@Injectable()
export class LoggedInGuard implements CanActivate {
    constructor(private router: Router,
                private authenticationService: AuthenticationService) {
    }

    canActivate() {
        if (!this.authenticationService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return false;
        }
        return true;
    }
}
