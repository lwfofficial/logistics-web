import {AfterViewInit, Component, Inject, OnInit, ViewChild, Input, ViewEncapsulation} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef, MatPaginator} from "@angular/material";
import {UserService} from "../../../services/user.service";
import {SERVICE_TYPE} from "../../../services/service.service";
import {Router} from "@angular/router";
import {Language, DefaultLocale, Currency} from "angular-l10n";

@Component({
    selector: 'buyer-card-dialog',
    templateUrl: './buyer-card-dialog.component.html',
    styleUrls: ['./buyer-card-dialog.component.scss',
                '../../../pages/page.component.scss',
                '../../../pages/home/home.component.scss',
                '../../../pages/home/buyer/home-buyer.component.scss'
    ],
    encapsulation: ViewEncapsulation.None,
})
export class BuyerCardComponent implements OnInit, AfterViewInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild(MatPaginator) feedbackPaginator: MatPaginator;
    // @ViewChild('feedbackSpinner') feedbackSpinner: ProgressSpinnerComponent;
    buyer;
    feedbacks;
    length;
    pageSize = 3;

    constructor(private router: Router,
                private userService: UserService,
                public dialogRef: MatDialogRef<BuyerCardComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {

        this.buyer = this.data.buyer;
        this.userService
            .getBuyerFeedbacks(1, this.pageSize, this.buyer.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.length = response.feedbacksCount;
                    this.feedbacks = response.feedbacks;
                }
            });
    }

    ngOnInit(): void {
    }

    ngAfterViewInit() {
    }

    closeDialog() {
        this.dialogRef.close();
    }

    changePage(event) {
        this.userService
            .getBuyerFeedbacks(event.pageIndex + 1, event.pageSize, this.buyer.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.length = response.feedbacksCount;
                    this.feedbacks = response.feedbacks;
                }
            })
    }
}