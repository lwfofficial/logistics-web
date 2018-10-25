import {Component, EventEmitter, Inject, Input, OnInit, Output} from '@angular/core';
import {Order, ORDER_STATUS, OrderService, SHIPPING_MODE} from "../../services/order.service";
import {SERVICE_TYPE} from "../../services/service.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material";
import {Router} from "@angular/router";
import {FeedbackComponent} from '../../components/common/feedback/feedback.component';
import {WalletService} from "../../services/wallet.service";
import {Currency, DefaultLocale, Language} from "angular-l10n";

@Component({
    selector: 'order-status',
    templateUrl: './templates/order.status.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss']
})
export class OrderStatusComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() order;
    @Input() profile;

    courierTypes: any[];
    isForwarder: boolean;
    isBuyer: boolean;
    isCLLOrder: boolean;
    isP2POrder: boolean;

    orderStatus = ORDER_STATUS;
    shippingModes = SHIPPING_MODE;
    orderStatusInfo;
    noTracking;

    constructor(private orderService: OrderService,
                private router: Router,
                private walletService: WalletService,
                public dialog: MatDialog) {

    }

    ngOnInit() {
        this.isBuyer = this.profile.user.username === this.order.profile.user.username;
        this.isForwarder = this.profile.user.username === this.order.service.profile.user.username;
        this.isCLLOrder = this.order.service.type == SERVICE_TYPE.cll;
        this.isP2POrder = this.order.service.type == SERVICE_TYPE.p2p;
        this.orderService.getCouriers()
            .subscribe((response: any) => {
                if (response.success) {
                    this.courierTypes = response.couriers;
                }
            });
        this.updateOrderStatusInfo();
    }


    updateOrderStatusInfo() {
        switch (this.order.state) {
            case 'PAID':
                if (this.isBuyer) {
                    this.orderStatusInfo = 'Waiting for forwarder confirmation.';
                } else {
                    this.orderStatusInfo = 'Accept or Refuse the order.';
                }
                break;
            case 'ACCEPTED':
                if (this.isBuyer) {
                    this.orderStatusInfo = 'Enter the tracking info provided by your seller (Amazon, Ebay etc...).';
                    if (this.order.trackings.length > 0) {
                        this.orderStatusInfo = 'Update the tracking info if you notice any error.';
                    }
                } else {
                    this.orderStatusInfo = 'Waiting for buyer to enter tracking info.';
                    if (this.order.trackings.length > 0) {
                        this.orderStatusInfo = 'If you received the parcel click on Delivered'
                        if (this.isCLLOrder) {
                            this.orderStatusInfo = 'If you received the parcel click on Collected'
                        }
                    }
                }
                break;
            case 'COLLECTING':
                if (this.isBuyer) {
                    this.orderStatusInfo = 'Waiting for forwarder to send your parcel.';
                    if (this.isCLLOrder) {
                        document.getElementById('info-message').innerHTML = 'Your parcel arrived at the Collector location. <br/> You can retrieve it on the designated days.';
                    }
                } else {
                    this.orderStatusInfo = 'Set the order to forwarded if the parcel has been sent.';
                    if (this.isCLLOrder) {
                        this.orderStatusInfo = 'Please be available for the buyer to retrieve the parcel on the designated days.'
                    }
                }
                break;
            case 'FORWARDED':
                if (this.isBuyer) {
                    this.orderStatusInfo = 'Waiting for forwarder to enter tracking info.';
                    if (this.order.trackings.length > 0) {
                        if (this.order.trackings[0].fromForwarder) {
                            this.orderStatusInfo = 'If you received the parcel you can Finalize the order.'
                        }
                    }
                } else {
                    this.orderStatusInfo = 'Enter the tracking info provided by your courier';
                    if (this.order.trackings.length > 0) {
                        if (this.order.trackings[0].fromForwarder) {
                            this.orderStatusInfo = 'Update the tracking info if you notice any error.';
                        }
                    }
                }
                break;
            case 'RECEIVED':
                if (this.isBuyer) {
                    this.orderStatusInfo = 'Please leave a Feedback to the forwarder';
                } else {
                    this.orderStatusInfo = 'Please leave a Feedback to the buyer';
                }
                break;
            case 'REFUSED':
                if (this.isBuyer) {
                    this.orderStatusInfo = 'Your order has been refused';

                } else {
                    this.orderStatusInfo = 'Please enter a reason for declining the order';
                }
        }
        if (this.order.issue) {
            this.orderStatusInfo = 'Click on Opened Issue to go the Issue Page'
        }
        if ((this.order.feedback.buyer && this.isBuyer) ||
            (this.order.feedback.forwarder && this.isForwarder)) {
            this.orderStatusInfo = 'Thanks for the feedback'
        }
        return this.orderStatusInfo;
    }

    refuse() {
        this.orderService
            .acceptOrRefuse(this.order.id, false)
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            });
    }

    chooseAction(action){
        switch (action){
            case 'refuse':
                this.refuse();
                break;
            case 'accept':
                this.accept();
                break;
            case 'delivered':
                this.collecting();
                break;
            case 'forwarded':
                this.deliveredForwarded();
                break;
            case 'finalize':
                this.received();
                break;
        }
    }

    openActionDialog(action) {
        this.dialog
            .open(OrderActionDialogComponent,
                {
                    data: {
                        order: this.order,
                        action: action
                    },
                })
            .componentInstance
            .submitted
            .subscribe(() => {
                this.chooseAction(action);
            })
    }

    accept() {
        this.orderService
            .acceptOrRefuse(this.order.id, true)
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            });
    }


    collecting() {
        this.orderService
            .collecting(this.order.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            });
    }

    deliveredForwarded() {
        this.orderService
            .forwardedDelivered(this.order.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            });
    }

    received() {
        this.orderService
            .received(this.order.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            });
    }

    cancel() {
        this.orderService
            .cancel(this.order.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            });
    }

    updateTrackingInfo() {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '500px';
            dialogHeight = '550px';
        }
        this.dialog
            .open(UpdateTrackingInfoDialogComponent,
                {
                    data: {
                        order: this.order,
                        courierTypes: this.courierTypes,
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight
                })
            .componentInstance
            .submitted
            .subscribe((trackingInfoForm: any) => {
                if (this.isBuyer && this.order.state === this.orderStatus.accepted) {
                    this.updateBuyerTrackingInfo(trackingInfoForm);
                }
                if (this.isForwarder
                    && (this.order.state === this.orderStatus.delivered
                        || this.order.state === this.orderStatus.forwarded)) {
                    this.updateForwarderTrackingInfo(trackingInfoForm);
                }
            })
    }

    updateThirdTrackingInfo() {
        this.dialog
            .open(UpdateTrackingInfoDialogComponent,
                {
                    data: {
                        order: this.order,
                        courierTypes: this.courierTypes
                    },
                    width: '60vw',
                    height: '80vh',
                    maxWidth: '60vw',
                    maxHeight: '80vh'
                })
            .componentInstance
            .submitted
            .subscribe((trackingInfoForm: any) => {
                if (this.isForwarder
                    && this.order.service.addPartnerForwarder
                    && (this.order.state === this.orderStatus.delivered
                        || this.order.state === this.orderStatus.forwarded)) {
                    this.updateForwarderPartnerTrackingInfo(trackingInfoForm);
                }
            })
    }

    insertRefuseReason() {
        this.dialog
            .open(UpdateRefuseReasonDialogComponent,
                {
                    data: {
                        order: this.order,
                        courierTypes: this.courierTypes
                    },
                    width: '60vw',
                    height: '80vh',
                    maxWidth: '60vw',
                    maxHeight: '80vh'
                })
            .componentInstance
            .submitted
            .subscribe((refuseReasonForm: any) => {
                this.updateRefuseReason(refuseReasonForm);
            })
    }

    openIssue() {
        if (this.order.issue) {
            this.router.navigate(['issue', this.order.issue]);
        } else {

            let isBuyer = this.isBuyer ? 'buyer' : 'forwarder';
            this.router.navigate(['issue/new', this.order.id, isBuyer]);
        }
    }

    leaveFeedback() {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '700px';
            dialogHeight = '700px';
        }
        this.dialog
            .open(FeedbackComponent,
                {
                    data: {
                        profile: this.isForwarder ? this.order.profile : this.order.service.profile
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight,
                    panelClass: 'feedback-dialog'
                })
            .componentInstance
            .onVote
            .subscribe(value => {
                value.orderId = this.order.id;
                let sendFeedback = this.isBuyer ?
                    this.orderService.sendBuyerFeedbackToForwarder(value) :
                    this.orderService.sendForwarderFeedbackToBuyer(value);
                sendFeedback
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.order = response.order;
                            this.updateOrderStatusInfo();
                        }
                    }, error => {
                        console.log(error);
                    })
            });
    }

    private updateBuyerTrackingInfo(trackingInfoForm: any) {
        this.orderService
            .updateBuyerTrackingInfo({
                orderId: this.order.id,
                courier: trackingInfoForm.courier,
                courierOther: trackingInfoForm.courierOther,
                trn: trackingInfoForm.trn,
                link: trackingInfoForm.link,
            })
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            })
    }

    private updateForwarderTrackingInfo(trackingInfoForm: any) {
        this.orderService
            .updateForwarderTrackingInfo({
                orderId: this.order.id,
                courier: trackingInfoForm.courier,
                courierOther: trackingInfoForm.courierOther,
                trn: trackingInfoForm.trn,
                link: trackingInfoForm.link,
            })
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            })
    }

    private updateForwarderPartnerTrackingInfo(trackingInfoForm: any) {
        this.orderService
            .updateForwarderPartnerTrackingInfo({
                orderId: this.order.id,
                courier: trackingInfoForm.courier,
                courierOther: trackingInfoForm.courierOther,
                trn: trackingInfoForm.trn,
                link: trackingInfoForm.link,
            })
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                    this.updateOrderStatusInfo();
                }
            })
    }

    private updateRefuseReason(refuseReasonForm: any) {
        this.orderService
            .updateRefuseReason(this.order.id, refuseReasonForm.refuseText)
            .subscribe((response: any) => {
                if (response.success) {
                    this.order = response.order;
                }
            })
    }
}

@Component({
    selector: 'order-update-tracking-info',
    templateUrl: './templates/order.status.tracking.info.dialog.html',
    styleUrls: ['../page.component.scss', './orders.component.scss']
})
export class UpdateTrackingInfoDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Output()
    submitted = new EventEmitter();

    addTrackingInfo: FormGroup;

    order: Order;

    courierTypes: any[];
    showCustomCourier;

    constructor(public dialogRef: MatDialogRef<UpdateTrackingInfoDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.order = data.order;
        this.courierTypes = data.courierTypes;
    }

    ngOnInit(): void {
        this.addTrackingInfo = new FormGroup({
            courier: new FormControl('', [Validators.required]),
            courierOther: new FormControl('', [Validators.required]),
            trn: new FormControl('', [Validators.required]),
            link: new FormControl('', []),
        }, {updateOn: 'submit'})
    }

    changedCourier(matData) {
        if (matData.value === 'COURIERCUSTOM') {
            this.showCustomCourier = true;
            this.addTrackingInfo.controls['courierOther'].setValue('');
        } else {
            this.showCustomCourier = false;
            this.addTrackingInfo.controls['courierOther'].setValue(matData.value);
        }
    }

    closeDialog() {
        this.dialogRef.close();
    }

    clearLink(url) {
        if (url.split(" ").join("").length > 0) {
            if (url.toLowerCase().indexOf("http://") === -1) {
                if (url.toLowerCase().indexOf("https://") === -1) {
                    url = 'http://' + url;
                    return url;
                }
            }
        }
        return url;

    }

    updateTrackingInfo({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            value.link = this.clearLink(value.link);
            this.submitted.emit(value);
            this.closeDialog();
        }
    }
}


@Component({
    selector: 'order-update-reason-refuse',
    templateUrl: './templates/order.status.reason.refuse.dialog.html',
    styleUrls: ['../page.component.scss', './orders.component.scss']
})
export class UpdateRefuseReasonDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Output()
    submitted = new EventEmitter();

    addRefuseReason: FormGroup;

    order: Order;

    constructor(public dialogRef: MatDialogRef<UpdateRefuseReasonDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.order = data.order;
    }

    ngOnInit(): void {
        this.addRefuseReason = new FormGroup({
            refuseText: new FormControl('', [Validators.required]),
        }, {updateOn: 'submit'})
    }

    closeDialog() {
        this.dialogRef.close();
    }

    updateRefuseReason({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            this.submitted.emit(value);
            this.closeDialog();
        }
    }
}


@Component({
    selector: 'order-action-dialog',
    templateUrl: './templates/order-action.dialog.html',
    styleUrls: ['../page.component.scss', './orders.component.scss']
})
export class OrderActionDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Output()
    submitted = new EventEmitter();


    order: Order;
    action;

    constructor(public dialogRef: MatDialogRef<OrderActionDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.order = data.order;
        this.action = data.action;
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