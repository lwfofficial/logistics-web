import {AfterViewInit, Component, Inject, OnInit, ViewChild, ViewEncapsulation} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef, MatPaginator} from "@angular/material";
import {UserService} from "../../../services/user.service";
import {SERVICE_TYPE, ServiceService} from "../../../services/service.service";
import {Router} from "@angular/router";
import {Language, DefaultLocale, Currency} from "angular-l10n";

@Component({
    selector: 'forwarder-card-dialog',
    templateUrl: './forwarder-card-dialog.component.html',
    styleUrls: ['./forwarder-card-dialog.component.scss',
        '../../../pages/page.component.scss',
        '../../../pages/home/home.component.scss',
        '../../../pages/home/buyer/home-buyer.component.scss'
    ],
    encapsulation: ViewEncapsulation.None,
})
export class ForwarderCardComponent implements OnInit, AfterViewInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild(MatPaginator) feedbackPaginator: MatPaginator;
    // @ViewChild('feedbackSpinner') feedbackSpinner: ProgressSpinnerComponent;
    forwarder;
    feedbacks;
    searchData;
    length;
    pageSize = 3;
    forwarderImage = '';
    profile;

    constructor(private router: Router,
                private userService: UserService,
                public dialogRef: MatDialogRef<ForwarderCardComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {

        this.forwarder = this.data.forwarder;
        this.profile = this.data.profile;
        this.forwarderImage = this.forwarder.profile.avatarImage ? this.forwarder.profile.avatarImage : '../../../../assets/images/account/default_avatar.png';
        this.searchData = this.data.searchData;
        this.userService
            .getForwarderFeedbacks(1, this.pageSize, this.forwarder.profile.id)
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

    createNewOrder(service) {
        if (service.type === SERVICE_TYPE.p2p) {
            this.router.navigate(
                ['orders/new/p2p-freight', service.id],
                {
                    queryParams: {
                        goodValue: this.searchData.maxGoodValue,
                        parcelSize: this.searchData.maxSize,
                        parcelWeight: this.searchData.maxWeight,
                        buyGoodsFrom: this.searchData.acceptedPacksFromPrivateOrCompany,
                        deliveryAddressId: this.searchData.locationTo.deliveryAddress.id
                    }
                }
            );

            this.closeDialog();
        }
        if (service.type === SERVICE_TYPE.cll) {
            this.router.navigate(
                ['orders/new/package-collecting', service.id],
                {
                    queryParams: {
                        parcelSize: this.searchData.maxSize,
                        parcelWeight: this.searchData.maxWeight,
                        buyGoodsFrom: this.searchData.acceptedPacksFromPrivateOrCompany,
                    }
                }
            );
            this.closeDialog();
        }
    }


    changePage(event) {
        this.userService
            .getForwarderFeedbacks(event.pageIndex + 1, event.pageSize, this.forwarder.profile.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.length = response.feedbacksCount;
                    this.feedbacks = response.feedbacks;
                }
            })
    }
}