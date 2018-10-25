import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AuthenticationService} from "../../services/authentication.service";
import {MatDialog, MatDialogRef} from "@angular/material";
import {FormValidators} from "../../utils/FormValidators";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";

@Component({
    selector: 'app-password-reset',
    templateUrl: './password-reset.component.html',
    styleUrls: ['../page.component.scss', './password-recovery.component.scss']
})
export class PasswordResetComponent implements OnInit {

    resetPasswordForm: FormGroup;
    errorMsg = '';
    activationKey: string;
    showLinkExpired = true;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private authenticationService: AuthenticationService,
                public sigupDialog: MatDialog) {
        this.resetPasswordForm = new FormGroup({
                password: new FormControl('', [
                    Validators.required,
                    Validators.minLength(8)
                ]),
                confirmPassword: new FormControl('', [
                    Validators.required,
                    Validators.minLength(8)
                ])
            },
            {
                updateOn: 'submit',
                validators: FormValidators.passwordMatchValidator
            });
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.activationKey = params.get('activationKey');
            this.authenticationService
                .verifyResetPassword(this.activationKey)
                .then(response => {
                    if (response.success) {
                        this.showLinkExpired = false;
                    } else {
                        this.showLinkExpired = true;
                    }
                }).catch(error => {
                console.log(error);
                this.showLinkExpired = true;
            });
        });
    }

    reset({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            this.authenticationService
                .passwordReset(this.activationKey, value.password)
                .then(response => {
                    if (response.success) {
                        this.sigupDialog
                            .open(PasswordResetDialogComponent);
                    } else if (response.error) {
                        this.resetPasswordForm.setErrors({notfound: true});
                    }
                });
        }
    }

}

@Component({
    selector: 'password-reset-dialog',
    templateUrl: './password-reset.dialog.component.html',
    styleUrls: ['../page.component.scss', './password-recovery.component.scss'],
})
export class PasswordResetDialogComponent {

    constructor(private router: Router,
                public dialogRef: MatDialogRef<PasswordResetDialogComponent>) {

    }

    closeDialog() {
        this.dialogRef.close();
        this.router.navigate(['/login']);
    }
}
