import {Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild, ViewEncapsulation} from "@angular/core";
import {GOOD_TYPES_VALUES, Service, ServiceService} from "../../services/service.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from "../../services/user.service";
import {OrderService, SHIPPING_MODE} from "../../services/order.service";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatHorizontalStepper, MatIconRegistry, NativeDateAdapter, DateAdapter} from "@angular/material";
import {DepositDialogComponent, DepositPaypalDialogComponent} from "../wallets/wallets.component";
import {WalletService} from "../../services/wallet.service";
import {ProgressSpinnerComponent} from "../../components/common/common.component";
import {DomSanitizer} from "@angular/platform-browser";
import {IconsUtility} from "../../utils/iconsUtility";
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";
import {CurrencyService} from "../../services/currency.service";

@Component({
    selector: 'app-order-new-cll',
    templateUrl: './templates/orders.new.cll.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NewOrderCLLPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild(MatHorizontalStepper) stepper: MatHorizontalStepper;

    service: Service;
    profile: any;
    wallet: any;
    orderCompletionForm: FormGroup;
    depositForm: FormGroup;

    orderCreated = false;
    orderId: number;

    parcelSize;
    parcelWeight;
    buyGoodsFrom;
    isCreditValid = false;
    priceAmount;

    constructor(private route: ActivatedRoute,
                private userService: UserService,
                private localeService: LocaleService,
                private orderService: OrderService,
                private serviceService: ServiceService,
                private currencyService: CurrencyService,
                public abortOrderDialog: MatDialog,
                private router: Router,
                iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
        IconsUtility.createSVGIcons(iconRegistry, sanitizer);
        this.orderCompletionForm = new FormGroup({
            parcelSize: new FormControl('', [Validators.required]),
            parcelWeight: new FormControl('', [Validators.required]),
            buyGoodsFrom: new FormControl(false, [Validators.required]),
            goodType: new FormControl('', [Validators.required]),
            collectorDeliveryDate: new FormControl('', [Validators.required]),
            estimatedDate: new FormControl(''),
            totalPrice: new FormControl(''),
            service: new FormControl(''),
        });
        this.depositForm = new FormGroup({
            currency: new FormControl(''),
        });
    }

    ngOnInit() {
        this.route.queryParamMap.subscribe((params: ParamMap) => {
            this.parcelSize = parseInt(params.get('parcelSize'));
            this.parcelWeight = parseInt(params.get('parcelWeight'));
            if (params.get("buyGoodsFrom") === 'true') {
                this.buyGoodsFrom = true;
            } else {
                this.buyGoodsFrom = false;
            }
        });

        this.route.paramMap.subscribe((params: ParamMap) => {
            if (params.get('orderId')) {
                this.orderService
                    .getOrder(params.get('orderId'))
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.service = response.order.service;
                            this.orderCompletionForm
                                .get("service")
                                .setValue(this.service);
                            this.orderCreated = true;
                            this.convertPrice(response.order.totalPrice);
                            this.orderId = response.order.id;
                            this.initOrderForm(response);
                        }
                    });
            } else {
                this.serviceService
                    .getService(params.get('serviceId'))
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.service = response.service;
                            this.orderCompletionForm
                                .get("parcelSize")
                                .setValue(this.parcelSize);
                            this.orderCompletionForm
                                .get("parcelWeight")
                                .setValue(this.parcelWeight);
                            this.orderCompletionForm
                                .get("buyGoodsFrom")
                                .setValue(this.buyGoodsFrom);
                            this.orderCompletionForm
                                .get("service")
                                .setValue(this.service.id);
                            this.orderCompletionForm
                                .get("totalPrice")
                                .setValue(this.service.price);
                            this.convertPrice(this.service.price);
                        }
                    });
            }
            this.updateProfile();
        });
    }


    updateProfile() {
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success) {
                    this.currency = this.localeService.getCurrentCurrency();
                    this.defaultLocale = this.localeService.getCurrentLocale();
                    this.lang = this.localeService.getCurrentLanguage();
                    this.profile = response.profile;
                    this.wallet = response.wallet;
                }
            })
            .catch(error => {
                console.log((error));
            });
    }

    convertPrice(amount) {
        if (this.profile.currencySetting == 'EUR') {
            this.currencyService.lwfBundleToEuro(amount)
                .then((response: any) => {
                    if (response.success) {
                        return this.priceAmount = response.value;
                    }
                }, error => {
                    console.log(error);
                })
        } else {
            return this.priceAmount = amount;
        }
    }

    onStepChange(step) {
        if (step.selectedIndex === 2
            && !this.orderCreated) {
            this.orderService
                .createOrder(this.orderCompletionForm.getRawValue())
                .subscribe((response: any) => {
                    if (response.success) {
                        this.orderCreated = true;
                        this.orderId = response.orderId;
                    }
                })
        }
        if (step.selectedIndex === 2
            && this.orderCreated) {
            let formData = this.orderCompletionForm.getRawValue();
            formData.orderId = this.orderId;
            this.orderService
                .editOrder(formData)
                .subscribe((response: any) => {
                    if (response.success) {
                        this.orderCreated = true;
                        this.orderId = response.orderId;
                    }
                });
        }
    }

    payOrder() {
        let formData = this.orderCompletionForm.getRawValue();
        formData.orderId = this.orderId;
        this.orderService
            .editOrder(formData)
            .subscribe((response: any) => {
                if (response.success) {
                    this.orderCreated = true;
                    this.orderId = response.orderId;
                    this.orderService
                        .payOrder(this.orderId)
                        .subscribe((response: any) => {
                            if (response.success) {
                                this.router.navigate(['orders/buyer', this.orderId])
                            }
                        });
                }
            })
    }

    abortOrder() {
        this.abortOrderDialog.open(AbortCllOrderDialogComponent, {
            data: {
                orderId: this.orderId
            }
        });
    }

    creditChangedHandler(valid){
        this.isCreditValid=valid;
    }

    private initOrderForm(response: any) {
        this.orderCompletionForm
            .get("parcelSize")
            .setValue(response.order.parcelSize);
        this.orderCompletionForm
            .get("parcelWeight")
            .setValue(response.order.parcelWeight);
        this.orderCompletionForm
            .get("buyGoodsFrom")
            .setValue(response.order.buyGoodsFrom);
        this.orderCompletionForm
            .get("goodType")
            .setValue(response.order.goodType);
        this.orderCompletionForm
            .get("collectorDeliveryDate")
            .setValue(response.order.collectorDeliveryDate);
        this.orderCompletionForm
            .get("estimatedDate")
            .setValue(response.order.estimatedDate);
        this.orderCompletionForm
            .get("totalPrice")
            .setValue(response.order.totalPrice);
        this.orderCompletionForm
            .get("service")
            .setValue(response.service);
    }

}


@Component({
    selector: 'new-order-cll-step-one',
    templateUrl: './templates/orders.new.cll.step.one.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
})
export class NewOrderCLLStepOneComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() service: Service;
    @Input() profile: any;
    @Input() orderCompletionForm: FormGroup;
    @Input() parcelSize;
    @Input() parcelWeight;
    @Input() buyGoodsFrom;
    @Input() priceAmount;

    @Output() onAbort = new EventEmitter();

    @Output() onPriceConversion = new EventEmitter;

    shippingModes = SHIPPING_MODE;

    goodTypes = GOOD_TYPES_VALUES;

    totalPrice: number = 0;

    minDate = new Date();
    estimatedDate = new Date();

    constructor(public locale: LocaleService,
                private dateAdapter: DateAdapter<NativeDateAdapter>) {

    }

    ngOnInit(): void {
        this.totalPrice = this.service.price;
        this.dateAdapter.setLocale(this.locale.getDefaultLocale());
    }


    setEstimatedDate(deliveryDate) {
        let estimatedDate = new Date();

        estimatedDate.setDate(deliveryDate.value.getDate());
        this.orderCompletionForm.get("estimatedDate").setValue(estimatedDate);

    }

    abortOrder() {
        this.onAbort.emit();
    }

}

@Component({
    selector: 'new-order-cll-step-two',
    templateUrl: './templates/orders.new.cll.step.two.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
})
export class NewOrderCLLStepTwoComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() service: Service;
    @Input() profile: any;
    @Input() orderCompletionForm: FormGroup;
    @Input() priceAmount: number;

    constructor() {

    }

    ngOnInit(): void {
    }

}

@Component({
    selector: 'new-order-cll-step-three',
    templateUrl: './templates/orders.new.cll.step.three.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss', '../wallets/wallets.component.scss'],
})
export class NewOrderCLLStepThreeComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() service: Service;
    @Input() profile: any;
    @Input() orderId: number;
    @Input() orderCompletionForm: FormGroup;
    @Input() deliveryAddress: any;
    @Input() wallet: any;
    @Input() isCreditValid: any;
    @Input() priceAmount: number;


    @Output()
    onPaymentReceived = new EventEmitter();

    @Output()
    onCreditChanged = new EventEmitter();

    @ViewChild('spinner') spinner: ProgressSpinnerComponent;

    buttons = [
        {name: 'Lwf', currency: 'LWF', disabled: false},
        {name: 'Bitcoin', currency: 'BTC', disabled: false},
    ];


    constructor(private userService: UserService,
                private walletService: WalletService,
                public dialog: MatDialog,) {
    }

    ngOnInit(): void {
        setTimeout(() => {
            this.checkCredit();
        }, 500);
    }

    refreshWallet() {
        return this.userService.getUserProfile()
            .then((response: any) => {
                this.profile = response.profile;
                this.wallet = response.wallet;
            });
    }

    checkCredit() {
        if (this.wallet.credit >= this.orderCompletionForm.get('totalPrice').value) {
            this.isCreditValid = true;
            this.onCreditChanged.emit(this.isCreditValid);
        }
    }

    openPaypalDepositDialog() {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769 || window.innerHeight < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '500px';
            dialogHeight = '420px';
        }
        this.dialog
            .open(DepositPaypalDialogComponent,
                {
                    data: {
                        profile: this.profile,
                        currency: this.currency
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight
                })
            .componentInstance
            .onClose
            .subscribe(() => {
                // this.updateDepositTransactionTable();
                this.onPaymentReceived.emit();
                this.refreshWallet().then(() => {
                    this.checkCredit();
                });
            });
    }

    openCryptoDepositDialog(button) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769 || window.innerHeight < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '700px';
            dialogHeight = '700px';
        }
        this.walletService
            .getDepositAddress(button.currency)
            .subscribe((response: any) => {
                if (response.success) {
                    this.dialog
                        .open(DepositDialogComponent,
                            {
                                data: {
                                    currency: button.currency,
                                    address: response.address
                                },
                                width: dialogWidth,
                                height: dialogHeight,
                                maxWidth: dialogWidth,
                                maxHeight: dialogHeight
                            });
                } else {
                    console.log(response)
                }
            }, error => {
                console.log(error);
            });
    }

}

@Component({
    selector: 'new-order-cll-step-four',
    templateUrl: './templates/orders.new.cll.step.four.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
})
export class NewOrderCLLStepFourComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() service: Service;
    @Input() orderId: number;
    @Input() profile: any;
    @Input() wallet: any;
    @Input() orderCompletionForm: FormGroup;
    @Input() depositForm: FormGroup;
    @Input() priceAmount: number;

    @Output() onAbort = new EventEmitter();
    @Output() onPay = new EventEmitter();

    constructor(public dialog: MatDialog) {
    }

    ngOnInit(): void {
    }

    payOrder() {
        this.onPay.emit();
    }

    abortOrder() {
        this.onAbort.emit();
    }


}

@Component({
    selector: 'abort-cll-order-dialog',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
    templateUrl: './templates/home.abort-cll-order.dialog.component.html',
})
export class AbortCllOrderDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('spinner') spinner: ProgressSpinnerComponent;

    showError;

    constructor(public dialogRef: MatDialogRef<AbortCllOrderDialogComponent>,
                private orderService: OrderService,
                private router: Router,
                @Inject(MAT_DIALOG_DATA) public data: any) {

    }

    closeDialog(confirm) {
        this.showError = false;
        if (confirm) {
            if (this.data.orderId) {
                this.spinner.show();
                this.orderService
                    .deleteOrder(this.data.orderId).then((response: any) => {
                    if (response.success) {
                        this.spinner.hide();
                        this.dialogRef.close();
                        this.router.navigate(['buyer']);
                    } else {
                        this.spinner.hide();
                        this.showError = true;
                    }
                }).catch(() => {
                    this.spinner.hide();
                    this.showError = true;
                });
            } else {
                this.dialogRef.close();
                this.router.navigate(['buyer']);
            }
        } else {
            this.dialogRef.close();
        }
    }
}