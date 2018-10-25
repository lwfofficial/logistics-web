import {
    Component,
    EventEmitter,
    Inject,
    LOCALE_ID,
    OnInit,
    Output,
    ViewChild,
    OnDestroy,
    ViewEncapsulation,
    ViewChildren, QueryList
} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {environment} from "../../../environments/environment";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {AuthenticationService} from "../../services/authentication.service";
import {FormValidators} from "../../utils/FormValidators";
import {DatePipe} from "@angular/common";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, DateAdapter, NativeDateAdapter} from "@angular/material";
import {CountryService} from "../../services/country.service";
import {RecaptchaComponent} from "ng-recaptcha";
import {ProgressSpinnerComponent} from "../../components/common/common.component";
import {Subject, ReplaySubject} from 'rxjs';
import {Language, DefaultLocale, Currency, LocaleService} from 'angular-l10n';
import {GeocompleteComponent} from "../../components/common/geocomplete/geocomplete.component";

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['../page.component.scss', './signup.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SignupPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('cityInputForm') cityInputForm: GeocompleteComponent;
    @ViewChild(RecaptchaComponent) recaptcha: RecaptchaComponent;
    @ViewChild('signupSpinner') signupSpinner: ProgressSpinnerComponent;
    @ViewChildren(GeocompleteComponent) geocompletes: QueryList<GeocompleteComponent>;

    signupForm: FormGroup;
    captchaSiteKey: string;
    activationKey: string;
    showSignup = false;
    loading = true;
    showLinkExpired = false;
    datePipe: DatePipe;
    countries = [];
    dialcodes = [];
    countryCode;
    isSelected = false;

    year = new Date().getFullYear();
    month = new Date().getMonth();
    day = new Date().getDate();

    minDate = new Date(this.year - 120, this.month, this.day);
    maxDate = new Date(this.year - 18, this.month, this.day);

    filteredCountries: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    private _onDestroy: Subject<void> = new Subject<void>();

    public countryFilterCtrl: FormControl = new FormControl();

    constructor(private route: ActivatedRoute,
                private router: Router,
                private authService: AuthenticationService,
                private countryService: CountryService,
                public mobileVerifyDialog: MatDialog,
                public locale: LocaleService,
                private fb: FormBuilder,
                private dateAdapter: DateAdapter<NativeDateAdapter>) {

        this.captchaSiteKey = environment.google.captchaSiteKey;
    }

    ngOnInit() {
        this.datePipe = new DatePipe('en-US');

        this.dateAdapter.setLocale('en-US');

        this.route.paramMap.subscribe((params: ParamMap) => {
            this.activationKey = params.get('activationKey');
            this.authService
                .verifySignup(this.activationKey)
                .then(response => {
                    if (response.success) {
                        this.loading = false;
                        this.showSignup = true;
                        this.showLinkExpired = true;
                        let profile = response.profile;
                        this.initSignupForm(profile);
                        this.countries = this.countryService.getCounties();
                        this.dialcodes = this.countries.filter(country => country.dial_code)
                            .map(country => {
                                return country
                            });
                        this.filteredCountries.next(this.countries.slice());

                        this.countryFilterCtrl.valueChanges
                            .subscribe(() => {
                                this.filterCountries();
                            });
                    }
                }).catch(error => {
                this.loading = false;
                console.log(error);
            });
        });
    }


    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    signup({value, valid}: { value: any, valid: boolean }) {
        console.log(value.mobile);
        if (valid) {
            value.dob = this.datePipe.transform(value.dob, 'yyyy-MM-dd');
            value.mobile = value.mobilePrefix.dial_code + value.mobile;
            value.verifyMobileNumber = environment.verifyMobileNumber;
            this.signupSpinner.show();
            this.authService
                .signupLevel1(value)
                .then(response => {
                    if (response.success) {
                        if (environment.verifyMobileNumber) {
                            let matDialogRef = this.mobileVerifyDialog
                                .open(
                                    SignupMobileDialogComponent,
                                    {
                                        data: {
                                            email: value.email,
                                            mobile: value.mobile
                                        },
                                        maxWidth: '600px',
                                    });
                            matDialogRef
                                .afterClosed()
                                .subscribe(() => {
                                    this.signupForm.markAsTouched();
                                    this.recaptcha.reset();
                                    this.signupSpinner.hide();
                                });
                            matDialogRef
                                .componentInstance
                                .onSuccess
                                .subscribe(success => {
                                    this.signupSpinner.hide();
                                    if (success) {
                                        this.authService
                                            .login({username: value.username, password: value.password})
                                            .then(response => {
                                                this.signupSpinner.hide();
                                                this.router.navigate(['account/verification']);
                                            });
                                    }
                                });
                        } else {
                            this.authService
                                .login({username: value.username, password: value.password})
                                .then(response => {
                                    this.signupSpinner.hide();
                                    this.router.navigate(['account/verification']);
                                });
                        }
                    }
                })
                .catch(error => {
                    this.signupSpinner.hide();
                    console.log(error);
                });
        } else {
            if (!this.signupForm.controls['city'].valid) {
                this.cityInputForm.setError();
            }
        }
    }

    private initSignupForm(profile) {
        let mobile = this.getMobileWithoutDialCode(profile.mobile, profile.country);
        this.signupForm = new FormGroup({
                name: new FormControl(profile.user.first_name, [Validators.required]),
                surname: new FormControl(profile.user.last_name, [Validators.required]),
                dob: new FormControl(profile.dob, [Validators.required]),
                country: new FormControl(profile.country, [Validators.required]),
                region: new FormControl(profile.region, ),
                city: new FormControl('', [Validators.required]),
                zipcode: new FormControl(profile.zipcode, [Validators.required]),
                ssn: new FormControl(profile.ssn, []),
                address: new FormControl(profile.address, [Validators.required]),
                mobilePrefix: new FormControl('', [Validators.required]),
                mobile: new FormControl(mobile, [
                    Validators.required,
                    Validators.minLength(8),
                    Validators.maxLength(15)
                ]),
                email: new FormControl(profile.user.email, [Validators.required, Validators.email]),
                username: new FormControl(profile.user.username, [Validators.required]),
                password: new FormControl('', [
                    Validators.required,
                    Validators.minLength(8)
                ]),
                confirmPassword: new FormControl('', [
                    Validators.required,
                    Validators.minLength(8)
                ]),
                agreement: new FormControl('', [Validators.required, Validators.requiredTrue]),
                captcha: new FormControl('', [Validators.required]),
                activationKey: new FormControl(this.activationKey, [Validators.required]),
            },
            {
                updateOn: 'submit',
                validators: FormValidators.passwordMatchValidator
            }
        );
        if (profile.country) {
            this.setMobilePrefix({value: profile.country});
        }
    }

    setCity(location) {
        console.log(location);
        this.countryCode = location.countryCode.toLowerCase();
        this.isSelected = true;
        let country = this.countryService.getCountryByCode(location.countryCode).name;
        let mobilePrefix = this.countryService
            .getCountryByCode(location.countryCode);
        this.signupForm
            .controls['city'].setValue(location.city);
        this.signupForm
            .controls['region'].setValue(location.region);


        this.signupForm
            .controls['country']
            .setValue(country);

        this.signupForm.get('mobilePrefix')
            .setValue(mobilePrefix);
    }

    setCountry(formControlName, location) {
        console.log(location.value);
        this.signupForm
            .controls[formControlName]
            .setValue(this.countryService.getCountryByName(location.value).name);
        this.setMobilePrefix(location);
    }

    private filterCountries() {
        if (!this.countries) {
            return;
        }
        // get the search keyword
        let search = this.countryFilterCtrl.value;
        if (!search) {
            this.filteredCountries.next(this.countries.slice());
            return;
        } else {
            search = search.toLowerCase();
        }
        // filter the banks
        this.filteredCountries.next(
            this.countries.filter(country => country.name.toLowerCase().indexOf(search) > -1)
        );
    }

    setMobilePrefix(event) {
        console.log(event);
        this.countryCode = this.countryService
            .getCountryByName(event.value).code.toLowerCase();
        let mobilePrefix = this.countryService
            .getCountryByName(event.value);
        console.log(mobilePrefix);
        this.signupForm.get('mobilePrefix')
            .setValue(mobilePrefix);
    }

    selectMobilePrefix(location) {
        this.countryCode = location.code.toLowerCase();
        this.signupForm.get('mobilePrefix')
            .setValue(location);
    }

    resetSelected(event) {
        this.isSelected = !event
    }


    private getMobileWithoutDialCode(mobile: string, country) {
        if (!mobile || !country) {
            return '';
        }
        let mobilePrefix = this.countryService
            .getCountryByName(country).dial_code;
        return mobile.replace(mobilePrefix, '');
    }
}

@Component({
    selector: 'signup-number-verification-dialog',
    templateUrl: './signup.number.verification.component.html',
    styleUrls: ['../page.component.scss', './signup.component.scss'],
})
export class SignupMobileDialogComponent implements OnInit {

    @Output()
    onSuccess = new EventEmitter<boolean>();


    mobileVerificatonFrom: FormGroup;

    mobile;
    page;
    profile;

    constructor(private router: Router,
                private authService: AuthenticationService,
                @Inject(MAT_DIALOG_DATA) public data: any,
                public dialogRef: MatDialogRef<SignupMobileDialogComponent>) {
        this.mobile = data.mobile;
        this.page = data.page;
        this.profile = data.profile
    }

    ngOnInit(): void {
        this.mobileVerificatonFrom = new FormGroup({
            code: new FormControl('', [
                Validators.required,
                Validators.minLength(4),
                Validators.maxLength(4)
            ]),
            email: new FormControl(this.data.email, [Validators.required])
        });
    }

    confirmNumber({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            this.authService
                .verifyMobileNumber(value)
                .then(response => {
                    if (response.success) {
                        this.dialogRef.close(true);
                        this.onSuccess.emit(true);
                    } else {
                        this.mobileVerificatonFrom
                            .controls['code']
                            .setErrors({
                                backend: {code: "Email already registered!"}
                            });
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }

}
