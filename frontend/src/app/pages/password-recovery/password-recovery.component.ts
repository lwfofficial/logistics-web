import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AuthenticationService} from "../../services/authentication.service";
import {MatDialog, MatDialogRef} from "@angular/material";
import {Router} from "@angular/router";

@Component({
    selector: 'app-password-recovery',
    templateUrl: './password-recovery.component.html',
    styleUrls: ['../page.component.scss', './password-recovery.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PasswordRecoveryComponent implements OnInit {

    recoveryPasswordForm: FormGroup;
    errorMsg = '';

    constructor(private authenticationService: AuthenticationService,
                public sigupDialog: MatDialog) {
        this.recoveryPasswordForm = new FormGroup({
            email: new FormControl('', [Validators.required, Validators.email]),
        });
    }

    ngOnInit() {
    }

    send({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            this.authenticationService
                .sendPasswordResetEmail(value.email).then(response => {
                if (response.success) {
                    this.sigupDialog
                        .open(PasswordRecoveryDialogComponent);
                }else  if (response.error && response.error.code == 'no.user.found') {
                    this.recoveryPasswordForm.get('email').setErrors({notfound: true});
                    this.recoveryPasswordForm.setErrors({notfound: true});
                }
            });
        }
    }

}

@Component({
    selector: 'password-recovery-dialog',
    templateUrl: './password-recovery.dialog.component.html',
    styleUrls: ['../page.component.scss', './password-recovery.component.scss'],
})
export class PasswordRecoveryDialogComponent {

    constructor(private router: Router,
                public dialogRef: MatDialogRef<PasswordRecoveryDialogComponent>) {

    }

    closeDialog() {
        this.dialogRef.close();
        this.router.navigate(['/login']);
    }
}
