import {Injectable} from "@angular/core";
import {BaseService} from "./base.service";
import {HttpClient} from "@angular/common/http";
import {Router} from "@angular/router";
import {LocaleService} from "angular-l10n";
import {Subject} from "rxjs";


@Injectable()
export class UserService extends BaseService {

    constructor(private router: Router,
                private localeService: LocaleService,
                http: HttpClient) {
        super(http);
        this.apiUrl = "api/user";
    }

    uploadAvatarImage(imageData) {
        let headers = this.getHeaders();
        return this.http
            .post(`${this.getApiUrl()}/uploadAvatar/`,
                {avatarImage: imageData},
                {headers: headers}
            ).toPromise();
    }

    uploadIDDocFrontImage(imageData) {
        let headers = this.getHeaders();
        return this.http
            .post(`${this.getApiUrl()}/uploadIDDocFront/`,
                {IDDocFrontImage: imageData},
                {headers: headers}
            ).toPromise();
    }

    uploadIDDocBackImage(imageData) {
        let headers = this.getHeaders();
        return this.http
            .post(`${this.getApiUrl()}/uploadIDDocBack/`,
                {IDDocBackImage: imageData},
                {headers: headers}
            ).toPromise();
    }

    uploadProofOfresidenceImage(imageData) {
        let headers = this.getHeaders();
        return this.http
            .post(`${this.getApiUrl()}/uploadProofOfresidence/`,
                {ProofOfresidenceImage: imageData},
                {headers: headers}
            ).toPromise();
    }

    uploadSelfIDocImage(imageData) {
        let headers = this.getHeaders();
        return this.http
            .post(`${this.getApiUrl()}/uploadSelfIDoc/`,
                {SelfIDocImage: imageData},
                {headers: headers}
            ).toPromise();
    }

    getUserProfile() {
        return this.http
            .post(`${this.getApiUrl()}/profile/`,
                {},
                {headers: this.getHeaders()}
            ).toPromise()
            .then((response: any) => {
                if (response.success) {
                    this.localeService.setCurrentCurrency(response.profile.currencySetting);
                    this.localeService.setDefaultLocale(
                        // response.profile.languageSetting,
                        // response.profile.languageSetting
                        'en',
                        'US'
                    );
                }
                return response;
            });
    }

    isRecipient(profile) {
        if (profile.docVerified) {
            return true;
        }
        return false;
    }

    isForwarder(profile) {
        if (profile.forwarderData.verified) {
            return true;
        }
        return false;
    }

    getFeedback(profile) {
        return 0;
    }

    isDocsSumbit(profile) {
        if (profile.IDDocFrontImage && profile.IDDocBackImage) {
            return true;
        }
        return false;
    }

    isProofOfresidenceSumbit(profile) {
        if (profile.ProofOfresidenceImage) {
            return true;
        }
        return false;
    }

    isSelfIDocImageSumbit(profile) {
        if (profile.SelfIDocImage) {
            return true;
        }
        return false;
    }

    changePassword(data) {
        return this.http
            .post(`${this.getApiUrl()}/changePassword/`,
                data,
                {headers: this.getHeaders()}
            ).toPromise();
    }

    addAddress(formData) {
        return this.http
            .post(`${this.getApiUrl()}/address/create/`,
                formData,
                {headers: this.getHeaders()}
            );
    }

    editAddress(formData) {
        return this.http
            .put(`${this.getApiUrl()}/address/edit/`,
                formData,
                {headers: this.getHeaders()}
            );
    }

    deleteAddress(addressId) {
        return this.http
            .delete(`${this.getApiUrl()}/address/delete/${addressId}`,
                {headers: this.getHeaders()}
            );
    }

    enable2FASMS(enable2FASMS) {
        return this.http
            .post(`${this.getApiUrl()}/profile/enable2FASMS/`,
                {enable2FASMS: enable2FASMS},
                {headers: this.getHeaders()}
            );
    }

    enable2FAGoogle(enable2FAGoogle) {
        return this.http
            .post(`${this.getApiUrl()}/profile/enable2FAGoogle/`,
                {enable2FAGoogle: enable2FAGoogle},
                {headers: this.getHeaders()}
            );
    }

    getForwarderFeedbacks(page: number, maxPerPage: number, forwarderId) {
        return this.http
            .post(`${this.getApiUrl()}/profile/forwarderFeedback/`,
                {
                    page: page,
                    maxPerPage: maxPerPage,
                    forwarderId: forwarderId
                },
                {headers: this.getHeaders()}
            );
    }

    getBuyerFeedbacks(page: number, maxPerPage: number, buyerId) {
        return this.http
            .post(`${this.getApiUrl()}/profile/buyerFeedback/`,
                {
                    page: page,
                    maxPerPage: maxPerPage,
                    buyerId: buyerId
                },
                {headers: this.getHeaders()}
            );
    }

    getUserNotifications() {
        return this.http
            .get(`${this.getApiUrl()}/notifications/`,
                {headers: this.getHeaders()}
            );
    }

    setNotificationAsRead() {
        return this.http
            .post(`${this.getApiUrl()}/notifications/read/`,
                {},
                {headers: this.getHeaders()}
            );
    }

    updateProfileSetting(settingName, settingValue) {
        return this.http
            .post(`${this.getApiUrl()}/updateProfileSetting/`,
                {
                    settingName: settingName,
                    settingValue: settingValue
                },
                {headers: this.getHeaders()}
            );
    }

}

export interface ProfileEvent {
    profile: any;
}


export class ProfileEventEmitter extends Subject<ProfileEvent> {
    constructor() {
        super();
    }

    emit(value) {
        super.next(value);
    }
}

export class ProfilePublisher {
    Stream: ProfileEventEmitter;

    constructor() {
        this.Stream = new ProfileEventEmitter();
    }
}