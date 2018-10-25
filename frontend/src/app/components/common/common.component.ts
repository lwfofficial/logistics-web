import {
    Component,
    Directive,
    ElementRef,
    HostListener,
    Input,
    OnInit,
    ViewChild,
    ChangeDetectorRef
} from "@angular/core";
import {AuthenticationService} from "../../services/authentication.service";
import {Router} from "@angular/router";
import {MatProgressSpinner} from "@angular/material";
import {MatDialog} from "@angular/material";
import {environment} from "../../../environments/environment";
import {VerificationWarningComponent} from "./verification-warning-dialog/verification-warning-dialog.component";
import {UserService} from "../../services/user.service";

@Component({
    selector: 'site-footer',
    styleUrls: ['./common.component.scss'],
    templateUrl: './footer/footer.component.html',
})
export class FooterComponent {

    version: string;

    constructor() {
        this.version = environment.version;
    }

}


@Directive({
    selector: '[logout]',
    providers: [AuthenticationService]
})
export class LogoutDirective {

    constructor(private el: ElementRef,
                private router: Router,
                private authenticationService: AuthenticationService) {
    }

    @HostListener('click', ['$event'])
    onClick() {
        this.authenticationService.logout();
    }

}


@Component({
    selector: 'progress-spinner',
    template: `
        <div *ngIf="showSpinner"
             class="loading-shade">
            <mat-spinner></mat-spinner>
        </div>
    `,
    styleUrls: ['./common.component.scss']
})
export class ProgressSpinnerComponent implements OnInit {

    @ViewChild(MatProgressSpinner) spinner: MatProgressSpinner;

    showSpinner = false;

    constructor() {

    }

    ngOnInit(): void {
    }

    show() {
        setTimeout(() => {
            this.showSpinner = true;
        }, 100)
    }

    hide() {
        setTimeout(() => {
            this.showSpinner = false;
        }, 100)
    }
}

@Component({
    selector: 'verification-warning-launcher',
    template: `
        <span></span>
    `,
})
export class VerificationWarningLauncher implements OnInit {

    @Input()
    profile;

    userVerified: boolean = false;

    constructor(private dialog: MatDialog,
                private userService: UserService) {
    }

    ngOnInit() {
        setTimeout(() => {
            if (this.profile && !this.userService.isRecipient(this.profile)) {
                let dialogWidth;
                let dialogHeight;
                if (window.innerWidth < 769 || window.innerHeight < 769) {
                    dialogWidth = '100vw';
                    dialogHeight = '100vh';
                } else {
                    dialogWidth = '600px';
                    dialogHeight = '500px';
                }

                this.dialog
                    .open(VerificationWarningComponent,
                        {
                            data: {profile: this.profile},
                            width: dialogWidth,
                            height: dialogHeight,
                            maxWidth: dialogWidth,
                            maxHeight: dialogHeight,
                            panelClass: 'verification-warning-dialog'
                        })
                    .componentInstance;
            } else {
                this.userVerified = true;
            }
        }, 200);
    }

}