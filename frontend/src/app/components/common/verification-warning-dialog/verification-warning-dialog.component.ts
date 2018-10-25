import {Component, Inject, OnInit, Input, ViewEncapsulation} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {UserService} from "../../../services/user.service";

@Component({
    selector: 'verification-warning-dialog',
    templateUrl: './verification-warning-dialog.component.html',
    styleUrls: ['./verification-warning-dialog.component.scss',
                '../../../pages/page.component.scss',
                '../../../pages/home/home.component.scss',
                '../../../pages/home/buyer/home-buyer.component.scss'
    ],
    encapsulation: ViewEncapsulation.None,
})
export class VerificationWarningComponent implements OnInit {

    profile;

    constructor(private userService: UserService,
                public dialogRef: MatDialogRef<VerificationWarningComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.profile = data.profile;
    }

    ngOnInit(): void {
    }



    closeDialog() {
        this.dialogRef.close();
    }

}