import {Component, Inject, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {ProfilePublisher, UserService} from "../../../services/user.service";
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";
import {AuthenticationService} from "../../../services/authentication.service";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material";

@Component({
    selector: 'profile-info',
    templateUrl: './profile-info.component.html',
    styleUrls: ['./profile-info.component.scss'],
    animations: [
        trigger('transitionMessage', [
            state('enter', style({opacity: 1, transform: 'translateY(100%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(0%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
    encapsulation: ViewEncapsulation.None
})
export class ProfileInfoComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input()
    profile;
    @Input()
    wallet;
    @Input()
    editAvatar = false;

    avatarImageSrc: string;
    today = new Date();

    subProfile: any;
    fileTooBig: boolean = false;
    otherError: boolean = false;
    errorMessage;
    constructor(private userService: UserService,
                private authenticationService: AuthenticationService,
                private localeService: LocaleService,
                private profilePublisher: ProfilePublisher,
                private dialog: MatDialog) {
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
                    this.avatarImageSrc = this.profile.avatarImage ?
                        this.profile.avatarImage : 'assets/images/account/default_avatar.png';
                }
            });
        this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
            this.profile = profile;
        });
    }

    openErrorDialog(error) {
        this.dialog
            .open(AvatarErrorDialogComponent, {
                data: error,
                width: '320px',
                height: '320px',
                panelClass: 'error-dialog'
            });
    }

    setAvatarImage(avatarImage) {
        if (typeof avatarImage != 'string') {
            return;
        }
        this.avatarImageSrc = avatarImage;
        this.fileTooBig = false;
        this.userService
            .uploadAvatarImage(this.avatarImageSrc)
            .then((response: any) => {
                if (response.success) {
                    this.profile = response.profile;
                    this.avatarImageSrc = response.profile.avatarImage;
                }
            })
            .catch(error => {
                console.log(error);
                try {
                    if (error.error.error === 'file.toobig'){
                       this.fileTooBig = true;
                       this.errorMessage = "Image size is too big (max 6MB), please upload a new one";
                       this.openErrorDialog(this.errorMessage);
                       return
                    }
                } catch(e){}
                this.otherError= true;
                this.errorMessage = "Error uploading the avatar, please try again.";
                this.openErrorDialog(this.errorMessage);
            })
    }

}

@Component({
    selector: 'avatar-error-dialog',
    templateUrl: 'avatar-error-dialog.component.html',
    styleUrls: ['../../../pages/page.component.scss', './profile-info.component.scss']
})
export class AvatarErrorDialogComponent {

    errorMessage;

    constructor(
        public dialogRef: MatDialogRef<AvatarErrorDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.errorMessage = this.data;
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
}