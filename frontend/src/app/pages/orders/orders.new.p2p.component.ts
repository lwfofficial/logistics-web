import {Component, EventEmitter, Inject, Input, OnInit, Output, ViewChild, ViewEncapsulation} from "@angular/core";
import {GOOD_TYPES_VALUES, Service, ServiceService} from "../../services/service.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ProfilePublisher, UserService} from "../../services/user.service";
import {OrderService, SHIPPING_MODE} from "../../services/order.service";
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
    MatHorizontalStepper,
    MatIconRegistry,
    DateAdapter,
    NativeDateAdapter
} from "@angular/material";
import {DepositDialogComponent, DepositPaypalDialogComponent} from "../wallets/wallets.component";
import {WalletService} from "../../services/wallet.service";
import {ProgressSpinnerComponent} from "../../components/common/common.component";
import {DomSanitizer} from "@angular/platform-browser";
import {IconsUtility} from "../../utils/iconsUtility";
import {CountryService} from "../../services/country.service";
import {CurrencyService} from "../../services/currency.service";
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";
import {PageScrollInstance, PageScrollService, PageScrollConfig} from "ngx-page-scroll";
import {DOCUMENT} from "@angular/common";
import {FormValidators} from "../../utils/FormValidators";

@Component({
    selector: 'app-order-new-p2p',
    templateUrl: './templates/orders.new.p2p.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NewOrderP2PPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild(MatHorizontalStepper) stepper: MatHorizontalStepper;

    service: Service;
    profile: any;
    wallet: any;
    order: any;
    orderCompletionForm: FormGroup;
    depositForm: FormGroup;

    orderCreated = false;
    orderId: number;
    isCreditValid = false;

    goodValue;
    parcelSize;
    parcelWeight;
    buyGoodsFrom;
    deliveryAddress;
    deliveryAddressId;
    priceAmount;
    subProfile: any;

    constructor(private route: ActivatedRoute,
                private userService: UserService,
                private localeService: LocaleService,
                private profilePublisher: ProfilePublisher,
                private orderService: OrderService,
                private serviceService: ServiceService,
                private currencyService: CurrencyService,
                public abortOrderDialog: MatDialog,
                private router: Router,
                private pageScrollService: PageScrollService,
                iconRegistry: MatIconRegistry, sanitizer: DomSanitizer,
                @Inject(DOCUMENT) private document: any) {
        IconsUtility.createSVGIcons(iconRegistry, sanitizer);

        PageScrollConfig.defaultDuration = 200;
        this.orderCompletionForm = new FormGroup({
                goodValue: new FormControl('', [Validators.required]),
                parcelSize: new FormControl('', [Validators.required]),
                parcelWeight: new FormControl('', [Validators.required]),
                buyGoodsFrom: new FormControl(false, [Validators.required]),
                goodType: new FormControl('', [Validators.required]),
                forwarderDeliveryDate: new FormControl('', [Validators.required]),
                totalInsurance: new FormControl(false, [Validators.required]),
                shippingModePrice: new FormControl('', [Validators.required]),
                estimatedDate: new FormControl(new Date()),
                totalPrice: new FormControl(''),
                shippingMode: new FormControl(''),
                shippingWeight: new FormControl('', Validators.required),
                service: new FormControl(''),
                deliveryAddress: new FormControl(''),
                currency: new FormControl(''),
            },
            {
                validators: FormValidators.validateWeight
            });

        this.depositForm = new FormGroup({
            currency: new FormControl(''),
        });
    }

    ngOnInit() {
        this.route.queryParamMap.subscribe((params: ParamMap) => {
            this.goodValue = params.get('goodValue');
            this.parcelSize = parseInt(params.get('parcelSize'));
            this.parcelWeight = parseInt(params.get('parcelWeight'));
            if (params.get("buyGoodsFrom") === 'true') {
                this.buyGoodsFrom = true;
            } else {
                this.buyGoodsFrom = false;
            }
            this.deliveryAddressId = parseInt(params.get('deliveryAddressId'));

        });

        this.route.paramMap.subscribe((params: ParamMap) => {
            if (params.get('orderId')) {
                this.orderService
                    .getOrder(params.get('orderId'))
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.order = response.order;
                            this.service = response.order.service;
                            this.orderCompletionForm
                                .get("service")
                                .setValue(this.service.id);
                            this.orderCreated = true;
                            this.orderId = response.order.id;
                            this.convertPrice(this.order.totalPrice);
                            this.initOrderForm(response);
                            this.deliveryAddressId = parseInt(response.order.deliveryAddress);
                        }
                    });
            } else {
                this.serviceService
                    .getService(params.get('serviceId'))
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.service = response.service;
                            this.orderCompletionForm
                                .get("service")
                                .setValue(this.service.id);
                            this.orderCompletionForm
                                .get("goodValue")
                                .setValue(this.goodValue);
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
                                .get("deliveryAddress")
                                .setValue(this.deliveryAddressId);
                        }
                    });
            }
            this.updateProfile();
            this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
                this.profile = profile;
            });
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
                    this.orderCompletionForm
                        .get("currency")
                        .setValue(this.profile.currencySetting);
                    this.setDeliveryAddress();
                }
            })
            .catch(error => {
                console.log((error));
            })
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

    convertGoodValue(amount) {
        if (this.order.currency === 'USD') {
            this.currencyService.lwfBundleToEuro(amount)
                .then((response: any) => {
                    if (response.success) {
                        this.goodValue = response.value;
                        this.orderCompletionForm
                            .get("goodValue")
                            .setValue(this.goodValue);
                    }
                }, error => {
                    console.log(error);
                })
        } else {
            this.currencyService.EuroToDollars(amount)
                .then((response: any) => {
                    if (response.success) {
                       this.goodValue = response.value;
                        this.orderCompletionForm
                            .get("goodValue")
                            .setValue(this.goodValue);
                    }
                }, error => {
                    console.log(error);
                })
        }

    }

    scrollToTop() {
        let pageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#new-order-container');
        this.pageScrollService.start(pageScrollInstance);
    }

    onStepChange(step) {
        this.scrollToTop();
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
        this.abortOrderDialog.open(AbortP2pOrderDialogComponent, {
            data: {
                orderId: this.orderId
            }
        });
    }

    creditChangedHandler(valid) {
        this.isCreditValid = valid;
    }

    setDeliveryAddress() {
        this.deliveryAddress = this.profile.defaultAddress;
        for (let address of this.profile.addresses) {
            if (address.id === this.deliveryAddressId) {
                this.deliveryAddress = address;
            }
        }
    }

    private initOrderForm(response: any) {
        if (this.order.currency === this.profile.currencySetting) {
            this.orderCompletionForm
                .get("goodValue")
                .setValue(response.order.goodValue);
        } else {
            this.convertGoodValue(response.order.goodValue);
        }
        this.orderCompletionForm
            .get("currency")
            .setValue(response.order.currency);
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
            .get("forwarderDeliveryDate")
            .setValue(response.order.forwarderDeliveryDate);
        this.orderCompletionForm
            .get("totalInsurance")
            .setValue(response.order.totalInsurance);
        this.orderCompletionForm
            .get("totalPrice")
            .setValue(response.order.totalPrice);
        this.orderCompletionForm
            .get("shippingModePrice")
            .setValue(response.order.shippingModePrice);
        this.orderCompletionForm
            .get("estimatedDate")
            .setValue(response.order.estimatedDate);
        this.orderCompletionForm
            .get("shippingMode")
            .setValue(response.order.shippingMode);
        this.orderCompletionForm
            .get("shippingWeight")
            .setValue(response.order.shippingWeight);
        this.orderCompletionForm
            .get("service")
            .setValue(response.service);
        this.orderCompletionForm
            .get("deliveryAddress")
            .setValue(response.order.deliveryAddress);
    }

}


@Component({
    selector: 'new-order-p2p-step-one',
    templateUrl: './templates/orders.new.p2p.step.one.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
})
export class NewOrderP2PStepOneComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() service: Service;
    @Input() profile: any;
    @Input() orderId;
    @Input() orderCompletionForm: FormGroup;
    @Input() deliveryAddress: any;
    @Input() wallet: any;
    @Input() isCreditValid;
    @Input() priceAmount;

    @Output() onAbort = new EventEmitter();

    @Output() onCreditChanged = new EventEmitter();

    @Output() onPriceConversion = new EventEmitter;


    shippingModes = SHIPPING_MODE;
    weights = [];
    goodTypes = GOOD_TYPES_VALUES;

    totalPrice: number = 0;

    minDate = new Date();
    forwarderDeliveryDate = new Date();
    lbsWeights = [];


    constructor(private orderService: OrderService,
                private countryService: CountryService,
                private currencyService: CurrencyService,
                private route: ActivatedRoute,
                public locale: LocaleService,
                private dateAdapter: DateAdapter<NativeDateAdapter>) {

    }

    ngOnInit(): void {

        this.dateAdapter.setLocale(this.locale.getDefaultLocale());

        if (this.orderCompletionForm.get("totalPrice").value) {
            this.totalPrice = this.orderCompletionForm.get("totalPrice").value;
        }
        if (!this.orderId) {
            if (this.service.priceCheapEnabled) {
                this.orderCompletionForm.get("shippingModePrice").setValue(this.service.priceCheap);
                this.setPrice(this.service.priceCheap, this.shippingModes.CHEAP);
            } else if (this.service.priceStandardEnabled) {
                this.orderCompletionForm.get("shippingModePrice").setValue(this.service.priceStandard);
                this.setPrice(this.service.priceStandard, this.shippingModes.STANDARD);
            } else if (this.service.priceCheapEnabled) {
                this.orderCompletionForm.get("shippingModePrice").setValue(this.service.priceExpress);
                this.setPrice(this.service.priceExpress, this.shippingModes.EXPRESS);
            }
            if (this.service.addPartnerForwarder) {
                this.totalPrice = 0;
                this.orderCompletionForm.get("shippingModePrice").setValue(this.shippingModes.EXPRESS);
                this.orderCompletionForm.get("shippingMode").setValue(this.shippingModes.EXPRESS);
                this.setForwarderPartnerPrice();
            }
            this.orderCompletionForm.get("shippingWeight").setValue(this.weights[0]);
        }

        this.orderService
            .getPartnerCourierWeightList("express")
            .subscribe((response: any) => {
                if (response.success) {
                    this.weights = response.weights;
                    this.orderCompletionForm.get('shippingWeight').setValue(this.weights[0].weight);
                }
            }, error => {
                console.log(error);
            });

        this.orderCompletionForm
            .get('shippingMode')
            .valueChanges
            .subscribe(value => this.shippingModeChanged(value));
    }

    priceConversion(amount) {
        this.onPriceConversion.emit(amount)
    }

    setPrice(price, shippingMode) {
        this.totalPrice = price;
        this.orderCompletionForm.get("totalPrice").setValue(this.totalPrice);
        this.orderCompletionForm.get("shippingModePrice").setValue(price);
        this.orderCompletionForm.get("shippingMode").setValue(shippingMode);
        if (this.orderCompletionForm.get("forwarderDeliveryDate").value !== '') {
            this.setEstimatedDate(this.forwarderDeliveryDate);
        }
        this.priceConversion(this.totalPrice);
    }


    setForwarderPartnerPrice() {
        if (this.service.addPartnerForwarder) {
            let requestBody = this.getPartnerForwarderPriceBody();

            this.orderService.getPartnerForwarderPrice(requestBody)
                .subscribe((response: any) => {
                    if (response.success) {
                        this.totalPrice = response.price;
                        this.orderCompletionForm.get('totalPrice').setValue(response.price);
                        this.checkCredit();
                        this.priceConversion(this.totalPrice);
                    }
                }, error => {
                    console.log(error);
                });
        }
    }

    shippingModeChanged(value) {
        if (this.service.addPartnerForwarder) {
            let type = value === this.shippingModes.EXPRESS ?
                'express' : 'standard';
            let weight = this.getShippingWeight();
            this.orderService
                .getPartnerCourierWeightList(type)
                .subscribe((response: any) => {
                    if (response.success) {
                        this.weights = response.weights;
                        let requestBody = this.getPartnerForwarderPriceBody();
                        requestBody.shippingWeight = weight;
                        this.orderCompletionForm.get('shippingWeight').setValue(weight);
                        this.orderService.getPartnerForwarderPrice(requestBody)
                            .subscribe((response: any) => {
                                if (response.success) {
                                    this.totalPrice = response.price;
                                    this.orderCompletionForm.get('totalPrice').setValue(response.price);
                                    this.checkCredit();
                                    if (this.orderCompletionForm.get("forwarderDeliveryDate").value !== '') {
                                        this.setEstimatedDate(this.forwarderDeliveryDate);
                                    }
                                }
                            }, error => {
                                console.log(error);
                            });
                    }
                }, error => {
                    console.log(error);
                });
        }
    }

    checkCredit() {
        if (this.wallet.credit >= this.orderCompletionForm.get('totalPrice').value) {
            this.isCreditValid = true;
            this.onCreditChanged.emit(this.isCreditValid);
        } else {
            this.isCreditValid = false;
            this.onCreditChanged.emit(this.isCreditValid);
        }
    }

    setEstimatedDate(deliveryDate) {
        let estimatedDate = new Date();
        let shippingDays = this.getShippingDays();

        estimatedDate.setDate(deliveryDate.value.getDate() + shippingDays);

        this.orderCompletionForm.get("estimatedDate").setValue(estimatedDate);
        this.forwarderDeliveryDate = deliveryDate;
    }

    abortOrder() {
        this.onAbort.emit();
    }

    private getPartnerForwarderPriceBody() {
        let countryName = this.countryService.getCountryByCode(this.service.locationFrom.countryCode).name;
        return {
            originCountry: countryName,
            destinationCountry: this.deliveryAddress.country,
            shippingMode: this.orderCompletionForm.get('shippingMode').value,
            shippingWeight: this.getShippingWeight(),
            service: this.service.id
        };
    }

    private getShippingWeight() {
        let shippingWeight = this.orderCompletionForm.get('shippingWeight').value;
        return shippingWeight ? shippingWeight : '0.50';
    }

    private getShippingDays() {
        let shippingMode = this.orderCompletionForm.get('shippingMode').value;
        switch (shippingMode) {
            case 1:
                return 15;
            case 2:
                return 6;
        }
        return 30;
    }

}

@Component({
    selector: 'new-order-p2p-step-two',
    templateUrl: './templates/orders.new.p2p.step.two.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
})
export class NewOrderP2PStepTwoComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() service: Service;
    @Input() profile: any;
    @Input() orderCompletionForm: FormGroup;
    @Input() deliveryAddress: any;
    @Input() totalPrice: number;
    @Input() priceAmount: number;


    constructor() {

    }

    ngOnInit(): void {
    }

}

@Component({
    selector: 'new-order-p2p-step-three',
    templateUrl: './templates/orders.new.p2p.step.three.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss', '../wallets/wallets.component.scss'],
})
export class NewOrderP2PStepThreeComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() service: Service;
    @Input() profile: any;
    @Input() orderId: number;
    @Input() orderCompletionForm: FormGroup;
    @Input() deliveryAddress: any;
    @Input() wallet: any;
    @Input() isCreditValid;
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

    ngAfterViewInit() {
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
        } else {
            this.isCreditValid = false;
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
    selector: 'new-order-p2p-step-four',
    templateUrl: './templates/orders.new.p2p.step.four.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
})
export class NewOrderP2PStepFourComponent implements OnInit {

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
    selector: 'abort-p2p-order-dialog',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
    templateUrl: './templates/home.abort-p2p-order.dialog.component.html',
})
export class AbortP2pOrderDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('spinner') spinner: ProgressSpinnerComponent;

    showError;

    constructor(public dialogRef: MatDialogRef<AbortP2pOrderDialogComponent>,
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