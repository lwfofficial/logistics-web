import {Component, EventEmitter, Inject, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {ISSUE_STATUS, IssueService} from "../../services/issue.service";
import {ProfilePublisher, UserService} from "../../services/user.service";
import {SERVICE_TYPE} from "../../services/service.service";
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";
import {Order} from "../../services/order.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material";
import {OrderActionDialogComponent, UpdateRefuseReasonDialogComponent} from "../orders/order.status.component";
import {CurrencyService} from '../../services/currency.service';

@Component({
    selector: 'app-issue',
    templateUrl: './templates/issue.component.html',
    styleUrls: ['./issue.component.scss',
        '../page.component.scss',
        '../orders/orders.component.scss'],
    encapsulation: ViewEncapsulation.None,
    providers: [CurrencyService]
})
export class IssuePageComponent implements OnInit {
    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    issue: any;
    profile: any;
    isCLLOrder: boolean;
    isP2POrder: boolean;

    issueStatus = ISSUE_STATUS;
    goodValue;
    subProfile: any;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private userService: UserService,
                private localeService: LocaleService,
                private profilePublisher: ProfilePublisher,
                private issueService: IssueService,
                private currencyService: CurrencyService,
                private dialog: MatDialog) {
    }

    ngOnInit() {
        this.route
            .paramMap
            .subscribe((params: ParamMap) => {
                this.issueService
                    .getIssue(params.get('issueId'))
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.issue = response.issue;
                            this.isCLLOrder = this.issue.order.service.type == SERVICE_TYPE.cll;
                            this.isP2POrder = this.issue.order.service.type == SERVICE_TYPE.p2p;
                            this.convertGoodValue(this.issue.order.goodValue);
                        }
                    });
            });
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success) {
                    this.currency = this.localeService.getCurrentCurrency();
                    this.defaultLocale = this.localeService.getCurrentLocale();
                    this.lang = this.localeService.getCurrentLanguage();
                    this.profile = response.profile;
                }
            })
            .catch(error => {
                console.log((error));
            });
        this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
            this.profile = profile;
        });
    }

    openDialog() {
        this.dialog
            .open(CloseIssueDialogComponent)
            .componentInstance
            .submitted
            .subscribe(() => {
                this.closeIssue();
            })
    }

    convertGoodValue(amount){
        if (this.issue.order.currency === this.profile.currencySetting){
            this.goodValue = amount;
        } else {
            if (this.issue.order.currency === 'USD'){
                this.currencyService.lwfBundleToEuro(amount)
                    .then((response: any) => {
                        if (response.success) {
                            return this.goodValue = response.value;
                        }
                    }, error => {
                        console.log(error);
                    })
            } else {
                this.currencyService.EuroToDollars(amount)
                    .then((response: any) => {
                        if (response.success) {
                            return this.goodValue = response.value;
                        }
                    }, error => {
                        console.log(error);
                    })
            }
        }
    }

    closeIssue() {
        this.issueService
            .closeIssue(this.issue.id)
            .then((response: any) => {
                if (response.success) {
                    this.issue.state = 'CLOSED';
                    if(this.profile.forwarderData.verified) {
                        this.router.navigate(['/forwarder']);
                    } else {
                        this.router.navigate(['/buyer']);
                    }
                } else {
                    console.log("failed to close issue: ", response)
                }
            }).catch((error) => {
                console.log(error);
        });
    }

}

@Component({
    selector: 'close-issue-dialog',
    templateUrl: './templates/close-issue.dialog.html',
    styleUrls: ['../page.component.scss', './issue.component.scss']
})
export class CloseIssueDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Output()
    submitted = new EventEmitter();

    constructor(public dialogRef: MatDialogRef<CloseIssueDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    ngOnInit(): void {
    }


    closeDialog() {
        this.dialogRef.close();
    }

    confirm() {
        this.submitted.emit();
        this.closeDialog();
    }
}