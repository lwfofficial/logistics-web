import {Component, EventEmitter, Inject, OnInit, Output, ViewEncapsulation} from "@angular/core";
import {AuthenticationService} from "../../../services/authentication.service";
import {UserService} from "../../../services/user.service";
import {ClickEvent, RatingChangeEvent, HoverRatingChangeEvent} from "angular-star-rating";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {FormControl, FormGroup} from "@angular/forms";
import {Language, DefaultLocale, Currency} from "angular-l10n";

@Component({
    selector: 'feedback',
    templateUrl: './feedback.component.html',
    styleUrls: ['./feedback.component.scss', '../common.component.scss',
        '../../../pages/page.component.scss'],
    providers: [
        AuthenticationService,
        UserService,
    ],
    encapsulation: ViewEncapsulation.None
})
export class FeedbackComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Output() onVote = new EventEmitter();


    onClickResult: ClickEvent;
    onHoverRatingChangeResult: HoverRatingChangeEvent;
    onRatingChangeResult: RatingChangeEvent;
    profile: any;
    feedbackForm: FormGroup;
    avatarImageSrc: string;

    constructor(public dialogRef: MatDialogRef<FeedbackComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.profile = data.profile;
        this.feedbackForm = new FormGroup({
                score: new FormControl(''),
                text: new FormControl(''),
            },
            {updateOn: 'submit'}
        )
    }

    ngOnInit() {
        this.avatarImageSrc = this.profile.avatarImage ?
            this.profile.avatarImage : 'assets/images/account/default_avatar.png';
    }


    onClick = ($event: ClickEvent) => {
        this.onClickResult = $event;
        this.feedbackForm.get('score').setValue(this.onClickResult.rating);
    };

    onRatingChange = ($event: RatingChangeEvent) => {
        this.onRatingChangeResult = $event;
    };

    onHoverRatingChange = ($event: HoverRatingChangeEvent) => {
        this.onHoverRatingChangeResult = $event;
    };

    sendFeedback({value, valid}: { value: FormGroup, valid: boolean }) {
        this.onVote.emit(value);
        this.dialogRef.close();
    }

}