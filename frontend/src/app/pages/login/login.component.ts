/**
 * Created by berserk on 04/11/16.
 */
import {Component, EventEmitter, Host, Inject, OnInit, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService} from "../../services/authentication.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ProfilePublisher, UserService} from "../../services/user.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material";
import {AppComponent} from "../../app.component";
import {ProgressSpinnerComponent} from "../../components/common/common.component";

@Component({
    selector: 'login-form',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    providers: [AuthenticationService],
    encapsulation: ViewEncapsulation.None
})
export class LoginPageComponent {

    loginForm: FormGroup;
    signupForm: FormGroup;
    errorMsg = '';
    @ViewChild('spinner') spinner: ProgressSpinnerComponent;
    @ViewChild('signupFormElement') signupFormElement;


    constructor(private router: Router,
                private authenticationService: AuthenticationService,
                public dialog: MatDialog,
                private userService: UserService,
                private profilePublisher: ProfilePublisher,
                public mobileVerifyDialog: MatDialog,
                @Host() private appComponent: AppComponent) {
    }

    ngOnInit(): void {
        this.loginForm = new FormGroup({
            username: new FormControl('', [Validators.required]),
            password: new FormControl('', [Validators.required])
        });
        this.signupForm = new FormGroup({
            name: new FormControl('', [Validators.required]),
            surname: new FormControl('', [Validators.required]),
            email: new FormControl('', [Validators.required, Validators.email]),
            username: new FormControl('', [Validators.required]),
        }, {updateOn: 'submit'});
    }

    login({value, valid}: { value: FormControl, valid: boolean }) {
        if (valid) {
            this.spinner.show();
            this.authenticationService
                .login(value, true)
                .then(response => {
                    if (response.success) {
                        if (response.profile.enable2FASMS) {
                            //logout user and got to 2FASMS for real login
                            this.authenticationService.deleteAuthToken();
                            this.authenticationService.delAuthCookie();
                            this.verify2FASMS(response.profile, value);
                            return;
                        }
                        //log login and reauth
                        this.authenticationService
                            .login(value)
                            .then(loginResponse => {
                                this.profilePublisher.Stream.emit(response.profile);
                                if (this.userService.isForwarder(response.profile)) {
                                    this.router.navigate(['forwarder']);
                                    return;
                                } else {
                                    this.router.navigate(['buyer']);
                                    return;
                                }
                            });
                    }
                    if (response.error == 'mobile.notverified') {
                        this.router.navigate(['signup', response.activationKey]);
                        return;
                    }
                    if (response.error == 'login.failed') {
                        this.spinner.hide();
                        this.loginForm.get('password').setErrors({notfound: true});
                        this.loginForm.get('username').setErrors({notfound: true});
                        this.loginForm.setErrors({notfound: true});
                        setTimeout(()=>{
                            //refresh login form errors
                            this.loginForm.setErrors(null);
                            this.loginForm.get('username').setErrors(null);
                            this.loginForm.get('password').setErrors(null);
                        }, 5000);
                    }
                })
                .catch( (error) => {
                    this.spinner.hide();
                    this.loginForm.get('password').setErrors({notfound: true});
                    this.loginForm.get('username').setErrors({notfound: true});
                    this.loginForm.setErrors({notfound: true});
                    setTimeout(()=>{
                        //refresh login form errors
                        this.loginForm.setErrors(null);
                        this.loginForm.get('username').setErrors(null);
                        this.loginForm.get('password').setErrors(null);
                    }, 5000);
                });
        }
    }

    signup({value, valid}: { value: FormControl, valid: boolean }) {
        if (valid) {
            this.spinner.show();
            this.authenticationService
                .signup(value)
                .then(response => {
                    this.spinner.hide();
                    if (response.success
                        || response.error.code == 'signup.expired') {
                        this.signupFormElement.resetForm();
                        this.dialog
                            .open(SignupDialogComponent,
                                {
                                    maxHeight: '600px'
                                });
                    } else {
                        if (response.error.code == 'email.alreadyregistered') {
                            this.signupForm.controls['email'].setErrors({
                                backend: {email: "Email already registered!"}
                            });
                        }
                        if (response.error.code == 'username.alreadyregistered') {
                            this.signupForm.controls['username'].setErrors({
                                backend: {username: "Username already taken!"}
                            });
                        }
                        if (response.error.code == 'signup.closed.beta') {
                            this.signupForm.controls['email'].setErrors({
                                backend: {closed: "Sign up enabled only for closed beta users!"}
                            });
                            this.dialog
                                .open(ClosedBetaDialogComponent,
                                    {
                                        maxWidth: '450px',
                                        maxHeight: '600px'
                                    });
                        }
                    }
                })
                .catch(error => {
                    this.spinner.hide();
                    alert("An error occured while processing the request.");
                });
        }
    }

    private logOutUserAndRefresh() {
        this.spinner.hide();
        this.authenticationService.deleteAuthToken();
        this.authenticationService.delAuthCookie();
        window.location.reload(true);
    }

    private verify2FASMS(profile, value) {
        this.authenticationService
            .sendMobileVerification(profile.user.email)
            .subscribe((response: any) => {
                if (response.success) {
                    let dialogWidth;
                    let dialogHeight;
                    if (window.innerWidth < 769) {
                        dialogWidth = '100vw';
                        dialogHeight = '100vh';
                    } else {
                        dialogWidth = '600px';
                        dialogHeight = '700px';
                    }
                    let matDialogRef = this.mobileVerifyDialog
                        .open(
                            LoginMobileDialogComponent,
                            {
                                data: {email: profile.user.email, mobile: profile.mobile},
                                width: dialogWidth,
                                height: dialogHeight,
                                maxWidth: dialogWidth,
                                maxHeight: dialogHeight
                            }
                        );
                    matDialogRef
                        .afterClosed()
                        .subscribe((success) => {
                            if (!success) {
                                this.logOutUserAndRefresh();
                            }

                        });
                    matDialogRef
                        .componentInstance
                        .onSuccess
                        .subscribe(success => {
                            //real login.
                            this.authenticationService
                                .login(value)
                                .then(loginResponse => {
                                    if (loginResponse.success && success) {
                                        this.profilePublisher.Stream.emit(profile);
                                        if (this.userService.isForwarder(profile)) {
                                            this.router.navigate(['forwarder']);
                                            return;
                                        } else {
                                            this.router.navigate(['buyer']);
                                            return;
                                        }
                                    } else {
                                        this.logOutUserAndRefresh();
                                    }
                                })
                                .catch(error => {
                                    this.logOutUserAndRefresh();
                                });
                        });
                } else {
                    this.logOutUserAndRefresh();
                }
            }, error => {
                console.log(error);
            });
    }
}

@Component({
    selector: 'login-number-verification-dialog',
    templateUrl: './login.number.verification.component.html',
    styleUrls: ['../page.component.scss', './login.component.scss'],
})
export class LoginMobileDialogComponent implements OnInit {

    @Output()
    onSuccess = new EventEmitter<boolean>();


    mobileVerificatonFrom: FormGroup;

    mobile;

    constructor(private router: Router,
                private authService: AuthenticationService,
                @Inject(MAT_DIALOG_DATA) public data: any,
                public dialogRef: MatDialogRef<LoginMobileDialogComponent>) {
        this.mobile = data.mobile;
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

    closeDialog() {
        this.dialogRef.close();
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
                                backend: {code: "Code is not valid!"}
                            });
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }
}

@Component({
    selector: 'signup-dialog',
    styleUrls: ['../page.component.scss', '../home/home.component.scss'],
    templateUrl: './dialog/signup.dialog.component.html',
})
export class SignupDialogComponent{

    constructor(public dialogRef: MatDialogRef<SignupDialogComponent>) {

    }

    closeDialog() {
        this.dialogRef.close();
    }
}

@Component({
    selector: 'closedbeta-dialog',
    styleUrls: ['../page.component.scss', './login.component.scss'],
    templateUrl: './dialog/closedbeta.dialog.component.html',
})
export class ClosedBetaDialogComponent{
    newsletterForm: FormGroup;
    submitted : boolean = false;

    constructor(public dialogRef: MatDialogRef<ClosedBetaDialogComponent>,
                private authenticationService: AuthenticationService) {
        this.newsletterForm = new FormGroup({
            email: new FormControl('', [Validators.required]),
        }, {updateOn: 'submit'});
    }

    addNewsletterEmail({value, valid}: { value: any, valid: boolean }) {
        this.authenticationService
            .addNewsLetterEmail(value.email)
            .then(response => {
                if (response.success){
                    this.submitted = true;
                }
            })
            .catch(error => {
                console.log(error);
            })
    }

    closeDialog() {
        this.dialogRef.close();
    }
}
