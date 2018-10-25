import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation,
    ElementRef
} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ProfilePublisher, UserService} from "../../services/user.service";
import {FormValidators} from "../../utils/FormValidators";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material";
import {WalletService} from "../../services/wallet.service";
import {animate, state, style, transition, trigger} from '@angular/animations';
import {ProgressSpinnerComponent} from "../../components/common/common.component";
import {SignupMobileDialogComponent} from "../signup/signup.component";
import {AuthenticationService} from "../../services/authentication.service";
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";
import {Router} from '@angular/router';
import {CountryService} from "../../services/country.service";
import {CurrencyService} from "../../services/currency.service";
import {AvatarImageComponent} from "../../components/common/avatar/avatarImage.component";

@Component({
    selector: 'account',
    templateUrl: './templates/account.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss'],
    providers: [UserService, CurrencyService],
    encapsulation: ViewEncapsulation.None
})
export class AccountPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('contactFormElement') contactFormElement;

    readOnly = {
        contacts: true,
        info: true
    };

    avatarImageSrc: string;

    profile;
    wallet;
    contactForm: FormGroup;
    addressesForm: FormGroup[] = [];
    settingsForm: FormGroup;
    maxGoodValue;
    docsSubmitted

    constructor(private userService: UserService,
                private currencyService: CurrencyService,
                private localeService: LocaleService,
                private profilePublisher: ProfilePublisher,
                public dialog: MatDialog) {
    }

    ngOnInit() {
        this.initProfile();
    }

    openCautionDialog() {
        this.dialog
            .open(CautionDialogComponent,
                {
                    maxWidth: '350px',
                    maxHeight: '350px'
                })
            .afterClosed()
            .subscribe(response => {
                this.initProfile();
            });
    }

    addAddress() {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '500px';
            dialogHeight = '700px';
        }
        this.dialog
            .open(AddressDialogComponent,
                {
                    data: {
                        data: null
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight,
                    panelClass: 'feedback-dialog'
                })
            .componentInstance
            .onUpdate
            .subscribe(profile => {
                this.profile = profile;
                this.profilePublisher.Stream.emit(profile);
            });
    }

    editAddress(address) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '500px';
            dialogHeight = '700px';
        }
        this.dialog
            .open(AddressDialogComponent,
                {
                    data: {
                        address: address
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight,
                    panelClass: 'feedback-dialog'
                })
            .componentInstance
            .onUpdate
            .subscribe(profile => {
                this.profile = profile;
                this.profilePublisher.Stream.emit(profile);
            });
    }

    updateSetting(settingName, value) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 450) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '450px';
            dialogHeight = '350px';
        }
        this.dialog
            .open(ConfirmUpdateSettingDialogComponent,
                {
                    data: {
                        settingName: settingName
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight,
                })
            .componentInstance
            .confirm
            .subscribe(confirm => {
                if (!confirm) {
                    this.settingsForm.get(settingName).setValue(this.profile[settingName]);
                    return;
                }
                this.userService
                    .updateProfileSetting(settingName, value)
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.profile = response.profile;
                            this.profilePublisher.Stream.emit(response.profile);
                        }
                    }, error => {
                        console.log(error);
                    })
            });
    }

    private initProfile() {
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success && response.profile) {
                    this.currency = this.localeService.getCurrentCurrency();
                    this.defaultLocale = this.localeService.getCurrentLocale();
                    this.lang = this.localeService.getCurrentLanguage();
                    this.initAddressForm(response.profile);
                    this.initSettingsForm(response.profile);
                    this.avatarImageSrc = response.profile.avatarImage;
                    this.profile = response.profile;
                    this.wallet = response.wallet;
                    this.convertPrice(this.profile.forwarderData.maxGoodValue);
                    this.docsSubmitted = this.userService.isDocsSumbit(this.profile);
                }
            });
    }

    private initAddressForm(profile) {
        this.addressesForm.push(
            new FormGroup({
                    street: new FormControl(profile.defaultAddress ? profile.defaultAddress.street : '',
                        [Validators.required]),
                    city: new FormControl(profile.defaultAddress ? profile.defaultAddress.city : '',
                        [Validators.required]),
                    region: new FormControl(profile.defaultAddress ? profile.defaultAddress.region : '',
                        [Validators.required]),
                    country: new FormControl(profile.defaultAddress ? profile.defaultAddress.country : '',
                        [Validators.required]),
                    zipCode: new FormControl(profile.defaultAddress ? profile.defaultAddress.zipCode : '',
                        [Validators.required])
                },
                {updateOn: 'submit'}
            ));
    }

    private initSettingsForm(profile) {
        this.settingsForm = new FormGroup({
            languageSetting: new FormControl(profile.languageSetting, Validators.required),
            currencySetting: new FormControl(profile.currencySetting, Validators.required),
            measuresSetting: new FormControl(profile.measuresSetting, Validators.required)
        })
    }

    convertPrice(amount) {
        if (this.profile.currencySetting == 'EUR') {
            this.currencyService.lwfBundleToEuro(amount)
                .then((response: any) => {
                    if (response.success) {
                        return this.maxGoodValue = response.value;
                    }
                }, error => {
                    console.log(error);
                })
        } else {
            return this.maxGoodValue = amount;
        }
    }
}


@Component({
    selector: 'confirm-update-setting-dialog',
    styleUrls: ['../page.component.scss', './account.component.scss'],
    templateUrl: './templates/account.confirm-update-setting.dialog.component.html',
})
export class ConfirmUpdateSettingDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('spinner') spinner: ProgressSpinnerComponent;


    @Output()
    confirm = new EventEmitter();

    showError: boolean = false;
    settingName: boolean;

    constructor(public dialogRef: MatDialogRef<Confirm2FSDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.settingName = data.settingName;
    }

    closeDialog(confirm) {
        this.confirm.emit(confirm);
        this.dialogRef.close();
    }
}


@Component({
    selector: 'add-address-dialog',
    templateUrl: './templates/account.address.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss']
})
export class AddressDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Output() onUpdate = new EventEmitter();

    addAddressForm: FormGroup;
    address: any;

    constructor(private userService: UserService,
                public dialogRef: MatDialogRef<AddressDialogComponent>,
                private countryService: CountryService,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.address = data.address;
        this.addAddressForm = new FormGroup({
                street: new FormControl(this.address ? this.address.street : '',
                    [Validators.required]),
                city: new FormControl(this.address ? this.address.city : '',
                    [Validators.required]),
                region: new FormControl(this.address ? this.address.region : '',
                ),
                country: new FormControl(this.address ? this.address.country : '',
                    [Validators.required]),
                zipCode: new FormControl(this.address ? this.address.zipCode : '',
                    [Validators.required])
            },
            {updateOn: 'submit'}
        )
    }

    ngOnInit(): void {
    }

    closeDialog() {
        this.dialogRef.close();
    }

    addAddress({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            if (this.address) {
                value.id = this.address.id;
                this.userService
                    .editAddress(value)
                    .subscribe((response: any) => {
                            if (response.success) {
                                this.onUpdate.emit(response.profile);
                                this.dialogRef.close();
                            }
                        }
                        , error => {
                            console.log(error);
                        }
                    );
            } else {
                this.userService
                    .addAddress(value)
                    .subscribe((response: any) => {
                            if (response.success) {
                                this.onUpdate.emit(response.profile);
                                this.dialogRef.close();
                            }
                        }
                        , error => {
                            console.log(error);
                        }
                    );
            }
        }
    }

    setCity(location) {
        console.log(location);
        let country = this.countryService.getCountryByCode(location.countryCode).name;

        this.addAddressForm
            .controls['city'].setValue(location.city);
        this.addAddressForm
            .controls['region'].setValue(location.region);
        this.addAddressForm
            .controls['country']
            .setValue(country);
    }

    delete() {
        if (this.address.id) {
            this.userService
                .deleteAddress(this.address.id)
                .subscribe((response: any) => {
                    if (response.success) {
                        this.onUpdate.emit(response.profile);
                        this.dialogRef.close();
                    }
                }, error => {
                    console.log(error);
                });
        }
    }
}

@Component({
    selector: 'account-verification',
    templateUrl: './templates/account.verification.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss'],
    animations: [
        trigger('showVerification', [
            state('enter', style({opacity: 1, transform: 'translateX(0%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateX(-100%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
})
export class AccountVerificationPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    profile;

    submitStatus = {
        docs: false,
        proofOfResidence: false,
        selfidoc: false,
    };

    showForwarderVerification = false;
    subProfile: any;

    constructor(private userService: UserService,
                private localeService: LocaleService,
                private profilePublisher: ProfilePublisher) {
    }

    ngOnInit() {
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success && response.profile) {
                    this.currency = this.localeService.getCurrentCurrency();
                    this.defaultLocale = this.localeService.getCurrentLocale();
                    this.lang = this.localeService.getCurrentLanguage();
                    this.profile = response.profile;
                    this.submitStatus.docs = this.userService.isDocsSumbit(this.profile);
                    this.submitStatus.proofOfResidence = this.userService.isProofOfresidenceSumbit(this.profile);
                    this.submitStatus.selfidoc = this.userService.isSelfIDocImageSumbit(this.profile);
                    if (this.profile.forwarderData.verified || this.submitStatus.proofOfResidence || this.submitStatus.selfidoc) {
                        this.showForwarderVerification = true;
                    }
                }
            });
        this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
            this.profile = profile;
            this.submitStatus.docs = this.userService.isDocsSumbit(this.profile);
            this.submitStatus.proofOfResidence = this.userService.isProofOfresidenceSumbit(this.profile);
            this.submitStatus.selfidoc = this.userService.isSelfIDocImageSumbit(this.profile);
            if (this.profile.forwarderData.verified || this.submitStatus.proofOfResidence || this.submitStatus.selfidoc) {
                this.showForwarderVerification = true;
            }
        });
    }

    showVerification() {
        this.showForwarderVerification = true;
    }
}


@Component({
    selector: 'account-verification-step-one',
    templateUrl: './templates/account.verification.step.one.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss'],
    animations: [
        trigger('transitionMessage', [
            state('enter', style({opacity: 1, transform: 'translateY(0%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(100%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
    encapsulation: ViewEncapsulation.None,

})
export class AccountVerificationStepOneComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input()
    profile: any;

    @Input()
    user: any;

    @Input()
    submitStatus: any;

    uploadForm: FormGroup;
    showSpinner: boolean;
    IDDocFrontImageSrc: string;
    IDDocBackImageSrc: string;
    frontUploaded: boolean = false;
    backUploaded: boolean = false;
    showError1;
    showError2;
    disableBtn: boolean = false;

    constructor(private userService: UserService,
                public dialog: MatDialog) {
    }

    ngOnInit() {

        this.IDDocFrontImageSrc = this.profile.IDDocFrontImage ?
            this.profile.IDDocFrontImage : 'assets/images/account/id-doc-front.svg';
        this.IDDocBackImageSrc = this.profile.IDDocBackImage ?
            this.profile.IDDocBackImage : 'assets/images/account/id-doc-back.svg';

        this.frontUploaded = !!this.profile.IDDocFrontImage;
        this.backUploaded = !!this.profile.IDDocBackImage;

        this.uploadForm = new FormGroup({
                idType: new FormControl({
                    value: '',
                    disabled: this.verificationIdStatus()[1] === 'verified'
                }, [Validators.required]),
                nullFront: new FormControl('', [Validators.required]),
                nullBack: new FormControl('', [Validators.required]),
                invalidFront: new FormControl('', []),
                invalidBack: new FormControl('', []),

            },
            {updateOn: 'submit'}
        )
    }

    uploadId({value, valid}: { value: FormGroup, valid: boolean }) {
        if (this.IDDocFrontImageSrc === 'assets/images/account/id-doc-front.svg') {
            this.showError1 = true;
            this.uploadForm.controls['nullFront'].setErrors({
                backend: {nullFront: "Please select a Front Image"}
            });
            setTimeout(() => {
                this.clearError()
            }, 5000);
        } else {
            this.uploadForm.controls['nullFront'].setErrors(null);
            this.uploadForm.controls['invalidFront'].setErrors(null);
        }
        if (this.IDDocBackImageSrc === 'assets/images/account/id-doc-back.svg') {
            this.showError1 = true;
            this.uploadForm.controls['nullBack'].setErrors({
                backend: {nullBack: "Please select a Back Image"}
            });
            setTimeout(() => {
                this.clearError()
            }, 5000);
        } else {
            this.uploadForm.controls['nullBack'].setErrors(null);
            this.uploadForm.controls['invalidBack'].setErrors(null);
        }
        if (this.IDDocFrontImageSrc && this.IDDocBackImageSrc && valid) {
            this.showSpinner = true;
            this.showError1 = false;
            this.showError2 = false;
            this.userService
                .uploadIDDocFrontImage(this.IDDocFrontImageSrc)
                .then(response => {

                    this.userService
                        .uploadIDDocBackImage(this.IDDocBackImageSrc)
                        .then(response => {
                            let dialogWidth;
                            let dialogHeight;
                            if (window.innerWidth < 480 || window.innerHeight < 480) {
                                dialogWidth = '100vw';
                                dialogHeight = '100vh';
                            } else {
                                dialogWidth = '550px';
                                dialogHeight = '400px';
                            }
                            this.dialog
                                .open(ConfirmUploadDialogComponent, {
                                    data: {
                                        idDocs: true
                                    },
                                    width: dialogWidth,
                                    height: dialogHeight,
                                    maxWidth: dialogWidth,
                                    maxHeight: dialogHeight,
                                });
                            this.submitStatus.docs = true;
                            this.showSpinner = false;

                        })
                        .catch(error => {
                            this.showSpinner = false;
                            this.showError2 = true;
                            try {
                                if (error.error.error === 'file.toobig') {
                                    this.disableBtn = true;
                                    this.uploadForm.controls['invalidBack'].setErrors({
                                        backend: {invalidBack: "Back image file size is too big, please select a valid image for upload and retry"}
                                    });
                                    setTimeout(() => {
                                        this.clearError()
                                    }, 5000);
                                    return
                                }
                            } catch (e) {
                            }
                            if (this.IDDocBackImageSrc !== 'assets/images/account/id-doc-back.svg') {
                                this.disableBtn = true;
                                this.uploadForm.controls['invalidBack'].setErrors({
                                    backend: {invalidBack: "Error on uploading Back Image, please select a valid image for upload and retry"}
                                });
                            }
                            console.log(error);
                            setTimeout(() => {
                                this.clearError()
                            }, 5000);
                        })
                }).catch(error => {
                this.showSpinner = false;
                this.showError2 = true;
                try {
                    if (error.error.error === "file.toobig") {
                        this.uploadForm.controls['invalidFront'].setErrors({
                            backend: {invalidFront: "Front image file size is too big, please select a valid image for upload and retry"}
                        });
                        setTimeout(() => {
                            this.clearError()
                        }, 5000);
                        return
                    }
                } catch (e) {
                }
                if (this.IDDocFrontImageSrc !== 'assets/images/account/id-doc-front.svg') {
                    this.uploadForm.controls['invalidFront'].setErrors({
                        backend: {invalidFront: "Error on uploading Front Image, please select a valid image for upload and retry"}
                    });
                }
                console.log(error);
                setTimeout(() => {
                    this.clearError()
                }, 5000);
            })

        }
    }

    clearError() {
        this.showError1 = false;
        this.showError2 = false;
        this.uploadForm.controls['nullFront'].setErrors(null);
        this.uploadForm.controls['invalidFront'].setErrors(null);
        this.uploadForm.controls['nullBack'].setErrors(null);
        this.uploadForm.controls['invalidBack'].setErrors(null);
        this.disableBtn = false;

    }

    setFrontDoc() {
        document.getElementById('useriddocfront' + '_input').click();
    }

    setBackDoc() {
        document.getElementById('useriddocback' + '_input').click();
    }

    stopClickPropagation(event) {
        event.stopPropagation();
    }

    setIDDocFrontImage(IDDocFrontImage) {
        this.showError1 = false;
        this.showError2 = false;
        this.IDDocFrontImageSrc = IDDocFrontImage;
        this.frontUploaded = true;
        this.uploadForm.controls['nullFront'].setErrors(null);
    }

    setIDDocBackImage(IDDocBackImage) {
        this.showError1 = false;
        this.showError2 = false;
        this.IDDocBackImageSrc = IDDocBackImage;
        this.backUploaded = true;
        this.uploadForm.controls['nullBack'].setErrors(null);
    }


    verificationIdStatus() {
        if (!this.userService.isForwarder(this.profile) &&
            !this.userService.isRecipient(this.profile) &&
            this.submitStatus.docs) {
            return ['Pending', 'pending'];
        } else if (!this.userService.isForwarder(this.profile) &&
            !this.userService.isRecipient(this.profile) &&
            !this.submitStatus.docs) {
            return ['Not Verified', 'not-verified'];
        } else {
            return ['Verified', 'verified'];
        }
    }
}

@Component({
    selector: 'account-verification-step-two',
    templateUrl: './templates/account.verification.step.two.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss'],
    animations: [
        trigger('transitionMessage', [
            state('enter', style({opacity: 1, transform: 'translateY(0%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(100%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
})
export class AccountVerificationStepTwoComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input()
    profile: any;

    @Input()
    user: any;

    @Input()
    submitStatus: any;

    uploadForm: FormGroup;
    showSpinner: boolean;
    ProofOfresidenceImageSrc: string;
    PoRUploaded;
    showError1;
    showError2;
    disableBtn: boolean = false;

    constructor(private userService: UserService,
                public dialog: MatDialog) {
    }

    ngOnInit() {
        this.ProofOfresidenceImageSrc = this.profile.ProofOfresidenceImage
            ? this.profile.ProofOfresidenceImage : 'assets/images/account/address-doc.svg';

        this.PoRUploaded = !!this.profile.ProofOfresidenceImage;

        this.uploadForm = new FormGroup({
                idType: new FormControl({
                    value: '',
                    disabled: this.verificationResidenceStatus()[1] === 'verified'
                }, [Validators.required]),
                nullProofOfresidence: new FormControl('', [Validators.required]),
                invalidProofOfresidence: new FormControl('', []),
            },
            {updateOn: 'submit'}
        )
    }

    uploadPoF({value, valid}: { value: FormGroup, valid: boolean }) {
        this.showError1 = false;
        this.showError2 = false;
        console.log(valid);
        this.uploadForm.controls['nullProofOfresidence'].setErrors(null);
        this.uploadForm.controls['invalidProofOfresidence'].setErrors(null);

        if (this.ProofOfresidenceImageSrc === 'assets/images/account/address-doc.svg') {
            this.showError1 = true;
            this.showError2 = true;
            this.uploadForm.controls['nullProofOfresidence'].setErrors({
                backend: {nullProofOfresidence: "Please select a Proof Of Residence Image"}
            });
            setTimeout(() => {
                this.clearError()
            }, 5000);
        } else {
            this.uploadForm.controls['nullProofOfresidence'].setErrors(null);
            this.uploadForm.controls['invalidProofOfresidence'].setErrors(null);
        }
        if (this.ProofOfresidenceImageSrc && valid) {
            this.userService
                .uploadProofOfresidenceImage(this.ProofOfresidenceImageSrc)
                .then(response => {
                    let dialogWidth;
                    let dialogHeight;
                    if (window.innerWidth < 480 || window.innerHeight < 480) {
                        dialogWidth = '100vw';
                        dialogHeight = '100vh';
                    } else {
                        dialogWidth = '550px';
                        dialogHeight = '400px';
                    }
                    this.dialog
                        .open(ConfirmUploadDialogComponent, {
                            data: {
                                residenceDocs: true
                            },
                            width: dialogWidth,
                            height: dialogHeight,
                            maxWidth: dialogWidth,
                            maxHeight: dialogHeight,
                        });
                    this.submitStatus.proofOfResidence = true;
                    this.showSpinner = false;
                })
                .catch(error => {
                    this.showSpinner = false;
                    this.showError1 = true;
                    this.showError2 = true;
                    try {
                        if (error.error.error === 'file.toobig') {
                            this.disableBtn = true;
                            this.uploadForm.controls['invalidProofOfresidence'].setErrors({
                                backend: {invalidProofOfresidence: "Proof of residence image file size is too big, please select a valid image for upload and retry"}
                            });
                            setTimeout(() => {
                                this.clearError()
                            }, 5000);
                            return
                        }
                    } catch (e) {
                    }
                    if (this.ProofOfresidenceImageSrc !== 'assets/images/account/address-doc.svg') {
                        this.disableBtn = true;
                        this.uploadForm.controls['invalidProofOfresidence'].setErrors({
                            backend: {
                                invalidProofOfresidence: "Error on uploading Proof Of Residence Image, please select a valid image for upload and retry"
                            }
                        });
                    }
                    setTimeout(() => {
                        this.clearError()
                    }, 5000);
                })

        }
    }

    clearError() {
        this.showError1 = false;
        this.showError2 = false;
        this.uploadForm.controls['nullProofOfresidence'].setErrors(null);
        this.uploadForm.controls['invalidProofOfresidence'].setErrors(null);
        this.disableBtn = false
    }

    setProofDoc() {
        document.getElementById('userproofofresidence' + '_input').click();
    }

    stopClickPropagation(event) {
        event.stopPropagation();
    }

    setProofOfresidenceImage(ProofOfresidenceImage) {
        this.showError1 = false;
        this.showError2 = false;
        this.ProofOfresidenceImageSrc = ProofOfresidenceImage;
        this.PoRUploaded = true;
        this.uploadForm.controls['nullProofOfresidence'].setErrors(null);
    }

    verificationResidenceStatus() {
        if (!this.userService.isForwarder(this.profile) &&
            this.submitStatus.proofOfResidence) {
            return ['Pending', 'pending'];
        } else if (!this.userService.isForwarder(this.profile) &&
            !this.submitStatus.proofOfResidence) {
            return ['Not Verified', 'not-verified'];
        } else {
            return ['Verified', 'verified'];
        }
    }

}

@Component({
    selector: 'account-verification-step-three',
    templateUrl: './templates/account.verification.step.three.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss'],
    animations: [
        trigger('transitionMessage', [
            state('enter', style({opacity: 1, transform: 'translateY(0%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(100%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
})
export class AccountVerificationStepThreeComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input()
    profile: any;

    @Input()
    user: any;

    @Input()
    submitStatus: any;

    @Input()
    userStatus: any;

    uploadForm: FormGroup;
    showSpinner: boolean;
    SelfIDocImageSrc: string;
    selfieUploaded;
    textCode: number;
    showError1;
    showError2;
    disableBtn: boolean = false;

    constructor(private userService: UserService,
                public dialog: MatDialog) {
    }

    ngOnInit() {
        this.SelfIDocImageSrc = this.profile.SelfIDocImage ?
            this.profile.SelfIDocImage : 'assets/images/account/selfie.svg';

        this.selfieUploaded = !!this.profile.SelfIDocImage;

        this.uploadForm = new FormGroup({
                nullSelfIDoc: new FormControl('', [Validators.required]),
                invalidSelfIDoc: new FormControl('', []),
            },
            {updateOn: 'submit'}
        );
        this.textCode = this.getRandomIntInclusive(100, 999);
    }

    uploadSelfie({value, valid}: { value: FormGroup, valid: boolean }) {
        if (this.SelfIDocImageSrc === 'assets/images/account/selfie.svg') {
            this.showError1 = true;
            this.showError2 = true;
            this.uploadForm.controls['nullSelfIDoc'].setErrors({
                backend: {nullSelfIDoc: "Please select a Self IDoc Image"}
            });
            setTimeout(() => {
                this.clearError()
            }, 5000);
        } else {
            this.uploadForm.controls['nullSelfIDoc'].setErrors(null);
            this.uploadForm.controls['invalidSelfIDoc'].setErrors(null);
        }
        if (this.SelfIDocImageSrc && valid) {
            this.showSpinner = true;
            this.showError1 = false;
            this.showError2 = false;
            this.userService
                .uploadSelfIDocImage(this.SelfIDocImageSrc)
                .then(response => {
                    let dialogWidth;
                    let dialogHeight;
                    if (window.innerWidth < 480 || window.innerHeight < 480) {
                        dialogWidth = '100vw';
                        dialogHeight = '100vh';
                    } else {
                        dialogWidth = '550px';
                        dialogHeight = '400px';
                    }
                    this.dialog
                        .open(ConfirmUploadDialogComponent, {
                            data: {
                                selfieDocs: true
                            },
                            width: dialogWidth,
                            height: dialogHeight,
                            maxWidth: dialogWidth,
                            maxHeight: dialogHeight,
                        });
                    this.submitStatus.selfidoc = true;
                    this.showSpinner = false;
                })
                .catch(error => {
                    this.showSpinner = false;
                    this.showError1 = true;
                    this.showError2 = true;
                    try {
                        if (error.error.error === 'file.toobig') {
                            this.disableBtn = true;
                            this.uploadForm.controls['invalidSelfIDoc'].setErrors({
                                backend: {invalidSelfIDoc: "Self IDoc image file size is too big, please select a valid image for upload and retry"}
                            });
                            setTimeout(() => {
                                this.clearError();
                            }, 5000);
                            return
                        }
                    } catch (e) {
                    }
                    if (this.SelfIDocImageSrc !== 'assets/images/account/selfie.svg') {
                        this.disableBtn = true;
                        this.uploadForm.controls['invalidSelfIDoc'].setErrors({
                            backend: {invalidSelfIDoc: "Error on uploading Self IDoc Image, please select a valid image for upload and retry"}
                        });
                    }
                    setTimeout(() => {
                        this.clearError()
                    }, 5000);
                })
        }
    }

    clearError() {
        this.showError1 = false;
        this.showError2 = false;
        this.uploadForm.controls['nullSelfIDoc'].setErrors(null);
        this.uploadForm.controls['invalidSelfIDoc'].setErrors(null);
        this.disableBtn = false;
    }

    setSelfieDoc() {
        document.getElementById('userselfidoc' + '_input').click();
    }

    stopClickPropagation(event) {
        event.stopPropagation();
    }

    setSelfIDocImage(SelfIDocImage) {
        this.showError1 = false;
        this.showError2 = false;
        this.SelfIDocImageSrc = SelfIDocImage;
        this.selfieUploaded = true;
        this.uploadForm.controls['nullSelfIDoc'].setErrors(null);
    }


    private getRandomIntInclusive(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    verificationSelfieStatus() {
        if (!this.userService.isForwarder(this.profile) &&
            this.submitStatus.selfidoc) {
            return ['Pending', 'pending'];
        } else if (!this.userService.isForwarder(this.profile) &&
            !this.submitStatus.selfidoc) {
            return ['Not Verified', 'not-verified'];
        } else {
            return ['Verified', 'verified'];
        }
    }
}

@Component({
    selector: 'account-security',
    templateUrl: './templates/account.security.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss'],
    providers: [UserService]
})
export class AccountSecurityPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('contactFormElement') contactFormElement;

    readOnly = {
        contacts: true,
        info: true
    };

    profile;
    wallet;
    submitted = false;
    contactForm: FormGroup;
    subProfile: any;
    docsSubmitted;

    constructor(private userService: UserService,
                private authenticationService: AuthenticationService,
                private localeService: LocaleService,
                private router: Router,
                private profilePublisher: ProfilePublisher,
                public dialog: MatDialog) {
    }

    ngOnInit() {
        this.initProfile();
        this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
            this.profile = profile;
        });
    }

    submitContactInfo({value, valid}: { value: FormControl, valid: boolean }) {
        if (valid) {
            this.userService
                .changePassword(value)
                .then((response: any) => {
                    if (response.success) {
                        this.dialog
                            .open(PasswordChangeDialogComponent, {
                                width: '300px',
                                height: '320px'
                            });
                        this.contactFormElement.resetForm();
                        return;
                    }
                    if (response.error === 'password.wrong') {
                        this.contactForm.controls['oldPassword'].setErrors({
                            backend: {oldPassword: 'Wrong Password'}
                        });
                    }
                });
        }
    }

    setEnable2FASMS(event) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769) {
            dialogWidth = '600vw';
            dialogHeight = '800vh';
        } else {
            dialogWidth = '600px';
            dialogHeight = '800px';
        }
        this.authenticationService
            .sendVerifyMobileNumber(this.profile.user.email)
            .subscribe((response: any) => {
                if (response.success) {
                    let dialogInstance = this.dialog
                        .open(SignupMobileDialogComponent,
                            {
                                data: {
                                    email: this.profile.user.email,
                                    mobile: this.profile.mobile,
                                    page: this.router.url,
                                    profile: this.profile
                                },
                                width: dialogWidth,
                                height: dialogHeight,
                                maxWidth: dialogWidth,
                                maxHeight: dialogHeight,
                                panelClass: 'feedback-dialog'
                            });
                    dialogInstance
                        .afterClosed()
                        .subscribe((response: any) => {
                            event.target.checked = this.profile.enable2FASMS;
                        });
                    dialogInstance
                        .componentInstance
                        .onSuccess
                        .subscribe(confirm => {
                            if (!confirm) {
                                event.target.checked = this.profile.enable2FASMS;
                                return;
                            }
                            if (this.wallet.credit > 0) {
                                this.userService
                                    .enable2FASMS(!this.profile.enable2FASMS)
                                    .subscribe((response: any) => {
                                        if (response.success) {
                                            this.profile = response.profile;
                                        }
                                    }, error => {
                                        console.log(error);
                                        event.target.checked = false;
                                        this.profile.enable2FASMS = false;
                                    });
                            } else {
                                event.target.checked = false;
                                this.profile.enable2FASMS = false;
                            }
                        });
                }
            });
    }

    setEnable2FAGoogle(event) {
    }

    private initProfile() {
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success && response.profile) {
                    this.currency = this.localeService.getCurrentCurrency();
                    this.defaultLocale = this.localeService.getCurrentLocale();
                    this.lang = this.localeService.getCurrentLanguage();
                    this.initContactForm();
                    this.profile = response.profile;
                    this.wallet = response.wallet;
                    this.docsSubmitted = this.userService.isDocsSumbit(this.profile);
                }
            });
    }

    private initContactForm() {
        this.contactForm = new FormGroup({
                oldPassword: new FormControl('', Validators.required),
                newPassword: new FormControl('', [Validators.required, Validators.minLength(8)]),
                newPasswordConfirm: new FormControl('', [Validators.required, Validators.minLength(8)]),
            },
            {updateOn: 'submit', validators: FormValidators.changePasswordMatchValidator});
    }
}

@Component({
    selector: 'abort-p2p-order-dialog',
    styleUrls: ['../page.component.scss', './account.component.scss'],
    templateUrl: './templates/account.confirm-2fa.dialog.component.html',
})
export class Confirm2FSDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('spinner') spinner: ProgressSpinnerComponent;


    @Output()
    confirm = new EventEmitter();

    showError: boolean = false;
    enable: boolean;

    constructor(public dialogRef: MatDialogRef<Confirm2FSDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.enable = data.enable;
    }

    closeDialog(confirm) {
        this.confirm.emit(confirm);
        this.dialogRef.close();
    }
}

@Component({
    selector: 'caution-dialog',
    templateUrl: './templates/account.caution.dialog.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss'],
})
export class CautionDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Output() onClose = new EventEmitter<any>(true);

    cautionForm: FormGroup;

    constructor(public dialogRef: MatDialogRef<CautionDialogComponent>,
                private walletService: WalletService,
                @Inject(MAT_DIALOG_DATA) public data: any) {

        this.cautionForm = new FormGroup({
            amount: new FormControl(
                '',
                [Validators.required]
            ),
        }, {updateOn: 'submit'});
    }

    closeDialog() {
        this.onClose.emit(true);
        this.dialogRef.close();
    }

    submit({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            this.walletService
                .depositCaution({
                    currency: value.currency,
                    amount: value.amount
                })
                .subscribe((response: any) => {
                    if (response.success) {
                        this.closeDialog();
                        return;
                    }
                    if (response.error = 'credit.insufficient') {
                        this.cautionForm.controls['amount'].setErrors({
                            backend: {amount: "Insufficent amount!"}
                        });
                    }
                }, error => {
                    console.log(error);
                });
        }
    }
}

@Component({
    selector: 'express-dialog',
    templateUrl: './templates/confirm.upload.dialog.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss']
})
export class ConfirmUploadDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    idDocs = false;
    residenceDocs = false;
    selfieDocs = false;

    constructor(public dialogRef: MatDialogRef<ConfirmUploadDialogComponent>,
                private router: Router,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.idDocs = data.idDocs;
        this.residenceDocs = data.residenceDocs;
        this.selfieDocs = data.selfieDocs;
    }

    ngOnInit(): void {
    }

    goToHome() {
        this.router.navigate(['/buyer']);
        this.closeDialog();
    }

    closeDialog() {
        this.dialogRef.close();
    }
}

@Component({
    selector: 'password-change-dialog',
    templateUrl: './templates/account.password-change.dialog.component.html',
    styleUrls: ['../page.component.scss', './account.component.scss']
})
export class PasswordChangeDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    constructor(public dialogRef: MatDialogRef<PasswordChangeDialogComponent>) {
    }

    ngOnInit(): void {
    }

    closeDialog() {
        this.dialogRef.close();
    }
}