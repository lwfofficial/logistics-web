import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {ProfilePublisher, UserService} from "../../services/user.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {FormValidators} from "../../utils/FormValidators"
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
    MatIconRegistry,
    MatPaginator,
    MatSort,
    MatTableDataSource
} from "@angular/material";
import {Transaction, WalletService} from "../../services/wallet.service";
import {CurrencyService} from "../../services/currency.service";
import {merge} from 'rxjs/observable/merge';
import {of as observableOf} from 'rxjs/observable/of';
import {catchError} from 'rxjs/operators/catchError';
import {map} from 'rxjs/operators/map';
import {startWith} from 'rxjs/operators/startWith';
import {switchMap} from 'rxjs/operators/switchMap';
import {ProgressSpinnerComponent} from "../../components/common/common.component";
import {DomSanitizer} from "@angular/platform-browser";
import {environment} from "../../../environments/environment";
import {IconsUtility} from "../../utils/iconsUtility";
import {animate, state, style, transition, trigger} from '@angular/animations';
import {Currency, DefaultLocale, Language, LocaleService, LocaleStorage} from 'angular-l10n';
import {ConfigurationService} from "../../services/configuration.service";

declare var paypal;

@Component({
    selector: 'app-wallets',
    templateUrl: './templates/wallets.component.html',
    styleUrls: ['../page.component.scss', './wallets.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WalletsPageComponent implements OnInit, AfterViewInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('spinner') spinner: ProgressSpinnerComponent;

    avatarImageSrc: string;
    profile;
    wallet;
    subProfile: any;
    docsSubmitted;

    constructor(private userService: UserService,
                private localeService: LocaleService,
                private profilePublisher: ProfilePublisher,
                iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
        IconsUtility.createSVGIcons(iconRegistry, sanitizer);
    }

    ngOnInit() {
        this.updateProfile();
        this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
            this.profile = profile;
        });
    }

    ngAfterViewInit(): void {
    }

    onLinkClick(event) {

    }

    updateProfile() {
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success && response.profile) {
                    this.currency = this.localeService.getCurrentCurrency();
                    this.defaultLocale = this.localeService.getCurrentLocale();
                    this.lang = this.localeService.getCurrentLanguage();
                    this.avatarImageSrc = response.profile.avatarImage;
                    this.profile = response.profile;
                    this.wallet = response.wallet;
                    this.docsSubmitted = this.userService.isDocsSumbit(this.profile);
                }
            });
    }
}

@Component({
    selector: 'deposit-form',
    templateUrl: './templates/deposit.form.component.html',
    styleUrls: ['../page.component.scss', './wallets.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
            state('expanded', style({height: '*', visibility: 'visible', backgroundColor: '#f0f1f3'})),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ]
})
export class DepositFormComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('depositForm') depositFormElement;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('spinner') spinner: ProgressSpinnerComponent;
    @ViewChild('paypalTable', {read: MatSort}) paypalTransactionSort: MatSort;
    @ViewChild('paypalPaginator') paypalTransactionPaginator: MatPaginator;
    @ViewChild('paypalSpinner') paypalTransactionSpinner: ProgressSpinnerComponent;

    @Input()
    profile;

    @Output()
    onPaymentReceived = new EventEmitter();

    transactions = new MatTableDataSource();
    transactionsCount = 0;
    transactionsPaypal = new MatTableDataSource();
    transactionsPaypalCount = 0;
    maxPerPage = 5;

    displayedColumns = ['date', 'currency', 'amount', 'view-details'];
    displayedColumnsPaypal = ['date', 'currency', 'amount', 'view-details'];

    buttons = [
        {name: 'Lwf', currency: 'LWF', fee: 4.5, disabled: false},
        {name: 'Bitcoin', currency: 'BTC', fee: 6.5,  disabled: false},
    ];

    isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');

    constructor(public dialog: MatDialog,
                private userService: UserService,
                private walletService: WalletService) {
    }

    ngOnInit() {
        this.transactions = new MatTableDataSource<Transaction>([]);
    }

    ngAfterViewInit(): void {
        this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
        this.updateDepositTransactionTable();
    }

    updateDepositTransactionTable() {
        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.spinner.show();
                    return this.walletService
                        .getDepositTransactions(
                            this.sort.active,
                            this.sort.direction,
                            this.paginator.pageIndex + 1,
                            this.maxPerPage
                        );
                }),
                map((data: any) => {
                    this.spinner.hide();
                    this.transactionsCount = data.transactionsCount;
                    return data.transactions;
                }),
                catchError(() => {
                    this.spinner.hide();
                    return observableOf([]);
                })
            ).subscribe(data => {
            const rows = [];
            data.forEach(transaction => rows.push(transaction, {
                detailRow: true,
                transaction: transaction
            }));
            this.transactions.data = rows;
        });
        merge(this.paypalTransactionSort.sortChange, this.paypalTransactionPaginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.paypalTransactionSpinner.show();
                    return this.walletService
                        .getDepositPaypalTransactions(
                            this.paypalTransactionSort.active,
                            this.paypalTransactionSort.direction,
                            this.paypalTransactionPaginator.pageIndex + 1,
                            this.maxPerPage
                        );
                }),
                map((data: any) => {
                    this.paypalTransactionSpinner.hide();
                    this.transactionsPaypalCount = data.transactionsCount;
                    return data.transactions;
                }),
                catchError(() => {
                    this.paypalTransactionSpinner.hide();
                    return observableOf([]);
                })
            ).subscribe(data => {
            const rows = [];
            data.forEach(transaction => rows.push(transaction, {
                detailRow: true,
                transaction: transaction
            }));
            this.transactionsPaypal.data = rows;
        });
    }

    log(val) {
        console.log(val);
    }

    openPaypalDepositDialog() {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769 || window.innerHeight < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '500px';
            dialogHeight = '550px';
        }
        this.dialog
            .open(DepositPaypalDialogComponent,
                {
                    data: {
                        profile: this.profile,
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight
                })
            .componentInstance
            .onClose
            .subscribe(() => {
                this.updateDepositTransactionTable();
                this.onPaymentReceived.emit();
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
                }
            }, error => {
                console.log(error);
            });
    }

    openDepositReceiptPdf(transactionId) {
        let newWindow = window.open("", "_blank");
        this.walletService
            .getDepositReceipt(transactionId)
            .subscribe((response: Blob) => {
                    let fileURL = URL.createObjectURL(response);
                    newWindow.location.href = fileURL;
                },
                error => {
                    console.log(error);
                });
    }

    openDepositPaypalReceiptPdf(transactionId) {
        let newWindow = window.open("", "_blank");
        this.walletService
            .getDepositPaypalReceipt(transactionId)
            .subscribe((response: Blob) => {
                    let fileURL = URL.createObjectURL(response);
                    newWindow.location.href = fileURL;
                },
                error => {
                    console.log(error);
                });
    }

}

@Component({
    selector: 'withdrawal-form',
    templateUrl: './templates/withdrawal.form.component.html',
    styleUrls: ['../page.component.scss', './wallets.component.scss'],
    providers: [CurrencyService],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
            state('expanded', style({height: '*', visibility: 'visible', backgroundColor: '#f0f1f3'})),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ]
})
export class WithdrawalFormComponent implements OnInit, AfterViewInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;


    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('spinner') spinner: ProgressSpinnerComponent;

    @Input()
    profile: any;

    @Input()
    wallet: any;

    transactions = new MatTableDataSource();
    transactionsCount = 0;
    maxPerPage = 5;

    withdrawDisplayedColumns = ['dateCreated', 'amount', 'status', 'view-details'];


    currencies = ['BTC', 'LWF'];
    ajaxCurrencyRequest = false;
    currentWithdrawData = {
        currency: null,
        amount: null,
        lwfbtocc: null
    };

    operationForm: FormGroup;

    isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');

    constructor(public dialog: MatDialog,
                public userService: UserService,
                private walletService: WalletService,
                private currencyService: CurrencyService) {

    }

    ngOnInit() {
        this.transactions = new MatTableDataSource<Transaction>([]);
        this.operationForm = new FormGroup({
            currency: new FormControl(
                '',
                [Validators.required]
            ),
            amount: new FormControl(
                '',
                [Validators.required]
            ),
            credit: new FormControl(
               this.wallet.credit,
                [Validators.required]
            ),
            address: new FormControl(
                '',
                [Validators.required, FormValidators.noWhitespaceValidator]
            ),
        }, {updateOn: 'submit',
            validators: FormValidators.validateWithdrawAmount});
    }

    onChangeCurrency(event): void {
        this.currentWithdrawData.currency = event.value;
        this.updateInfoCryptoCurrency();
    }

    onChangeAmount(event): void {
        this.currentWithdrawData.amount = event.target.value;
        this.updateInfoCryptoCurrency();
    }

    ngAfterViewInit(): void {
        this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
        this.updateWithdrawTransactionTable();
    }

    updateWithdrawTransactionTable() {
        merge(this.sort.sortChange, this.paginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.spinner.show();
                    return this.walletService
                        .getWithdrawTransactions(
                            this.sort.active,
                            this.sort.direction,
                            this.paginator.pageIndex + 1,
                            this.maxPerPage
                        );
                }),
                map((data: any) => {
                    this.spinner.hide();
                    this.transactionsCount = data.transactionsCount;
                    return data.transactions;
                }),
                catchError(() => {
                    this.spinner.hide();
                    return observableOf([]);
                })
            ).subscribe(data => {
            const rows = [];
            data.forEach(transaction => {
                rows.push(transaction, {
                    detailRow: true,
                    transaction: transaction
                })
            });
            this.transactions.data = rows;
        });
    }

    log(val) {
        console.log(val);
    }

    updateInfoCryptoCurrency() {
        /*
        Instant update current lwfb amount into cryptocurrency
         */
        if (!this.ajaxCurrencyRequest) {
            this.ajaxCurrencyRequest = true;
            setTimeout(() => {
                if (this.currentWithdrawData.currency && this.currentWithdrawData.amount) {
                    this.currencyService
                        .lwfBundleToCryptoCurrency(this.currentWithdrawData.currency, this.currentWithdrawData.amount)
                        .then((response: any) => {
                            if (response.success) {
                                this.currentWithdrawData.lwfbtocc = response.value;
                            } else {
                                this.currentWithdrawData.lwfbtocc = null;
                            }
                            this.ajaxCurrencyRequest = false;
                        }).catch(reason => {
                        this.currentWithdrawData.lwfbtocc = null;
                        this.ajaxCurrencyRequest = false;
                    });
                } else {
                    this.ajaxCurrencyRequest = false;
                }
            }, 500);
        }
    }

    doOperation({value, valid}: { value: any, valid: boolean }) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '650px';
            dialogHeight = '550px';
        }
        if (valid) {
            this.dialog.open(WithdrawalDialogComponent,
                {
                    data: {
                        currency: value.currency,
                        amount: value.amount,
                        address: value.address
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight
                });
        }
    }

    openWithdrawReceiptPdf(transactionId) {
        let newWindow = window.open("", "_blank");
        this.walletService
            .getWithdrawReceipt(transactionId)
            .subscribe((response: Blob) => {
                    let fileURL = URL.createObjectURL(response);
                    newWindow.location.href = fileURL;
                },
                error => {
                    console.log(error);
                });
    }

}

@Component({
    selector: 'deposit-dialog',
    templateUrl: './templates/deposit.dialog.component.html',
    styleUrls: ['../page.component.scss', './wallets.component.scss'],
})
export class DepositDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;

    @ViewChild('addressInput') addressInput: ElementRef;

    @Output() onClose = new EventEmitter<any>(true);

    address: string;
    amount: number;
    currency: string;

    constructor(public dialogRef: MatDialogRef<DepositDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.address = data.address;
        this.currency = data.currency;
    }

    copyToClipBoard() {
        this.addressInput.nativeElement.select();
        document.execCommand('copy');
    }

    closeDialog() {
        this.onClose.emit(true);
        this.dialogRef.close();
    }

    submit() {
        this.closeDialog();
    }
}

@Component({
    selector: 'withdrawal-dialog',
    templateUrl: './templates/withdrawal.dialog.component.html',
    styleUrls: ['../page.component.scss', './wallets.component.scss'],
})
export class WithdrawalDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;

    @ViewChild('spinner') spinner: ProgressSpinnerComponent;

    address: string;
    amount: number;
    currency: string;
    error: boolean;
    success: boolean;

    constructor(public dialogRef: MatDialogRef<DepositDialogComponent>,
                private walletService: WalletService,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.currency = data.currency;
        this.amount = data.amount;
        this.address = data.address;
    }

    closeDialog() {
        this.dialogRef.close();
    }

    submit() {
        this.error = false;
        this.spinner.show();
        this.walletService
            .withDraw(this.data).then((response: any) => {
            this.spinner.hide();
            if (response.success) {
                this.success = true;
            } else {
                this.error = true;
            }
        }).catch(reason => {
            this.spinner.hide();
            this.error = true;
        });
    }
}

@Component({
    selector: 'deposit-paypal-dialog',
    templateUrl: './templates/deposit.paypal.dialog.component.html',
    styleUrls: ['../page.component.scss', './wallets.component.scss'],
})
export class DepositPaypalDialogComponent {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;


    @ViewChild(ProgressSpinnerComponent) spinner: ProgressSpinnerComponent;

    @Output() onClose = new EventEmitter<any>(true);

    address: string;
    profile: any;

    transaction = {
        amount: 0,
        currency: '',
        fee: 0
    };

    paypalDepositForm: FormGroup;

    constructor(private walletService: WalletService,
                public dialogRef: MatDialogRef<DepositDialogComponent>,
                private userService: UserService,
                private configurationService: ConfigurationService,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.profile = data.profile;
        this.initDepositForm();
        this.getFee('paypal_deposit_percentage');
    }



    ngAfterViewInit() {
        this.initDepositForm();
        this.paypalInit();
    }

    closeDialog() {
        this.onClose.emit(true);
        this.dialogRef.close();
    }

    submit() {
        this.closeDialog();
    }


    // onChangeAmount(event): void {
    // }
    getFee(key){
        let fee = this.configurationService.getConfByKey(key);
        this.transaction.fee = parseFloat(fee.value);
    }

    private initDepositForm() {
        this.paypalDepositForm = new FormGroup({
            amount: new FormControl(0.00, [Validators.required, Validators.min(1)]),

        },
            {
                validators: FormValidators.validatePaypalAmount
            });

        this.paypalDepositForm
            .valueChanges
            .subscribe(value => {
                this.transaction.amount = (value.amount*100/(100-this.transaction.fee));
            })
    }

    toggleButton(actions) {
        this.paypalDepositForm.valid ? actions.enable() : actions.disable();
    }

    private paypalInit() {
        let self = this;
        paypal.Button.render({
            env: 'sandbox',

            style: {
                label: 'paypal',
                size: 'large',
                shape: 'rect',
                color: 'blue',
                tagline: false,
                // layout: 'horizontal',
                // fundingicons: 'true'
            },

            client: {
                sandbox: environment.paypal.accessKey,
                production: '',
            },

            validate: (actions) => {
                self.toggleButton(actions);

                self.paypalDepositForm
                    .valueChanges
                    .subscribe(value => {
                        if (self.paypalDepositForm.valid) {
                            self.toggleButton(actions);
                        }
                    })
            },

            payment: (data, actions) => {
                return actions.payment.create({
                    payment: {
                        transactions: [
                            {
                                amount: {
                                    total: self.transaction.amount.toFixed(2),
                                    currency: this.profile.currencySetting
                                }
                            }
                        ]
                    }
                });
            },
            onAuthorize: (data, actions) => {
                this.spinner.show();
                return actions.payment.execute().then(() => {
                    this.walletService
                        .executePaypalPayment(data.paymentID, data.payerID)
                        .subscribe((response: any) => {
                            this.spinner.hide();
                            if (response.success) {
                                this.closeDialog();
                            } else {
                                console.log(response.error);
                            }
                        }, error => {
                            console.log(error);
                        });
                });
            },

            onCancel: (data, actions) => {
                console.log('OnCancel');
                console.log(data, actions);
                this.closeDialog();
            },
            onError: (err) => {
                console.log('OnError');
                console.log(err);
                this.closeDialog();
            },
        }, '#paypal-button');
    }
}

