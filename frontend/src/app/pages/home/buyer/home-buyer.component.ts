import {AfterViewInit, Component, Inject, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {MatDialog, MatPaginator, MatSelect, MatSort, MatTableDataSource} from "@angular/material";
import {ProfilePublisher, UserService} from "../../../services/user.service";
import {Order, ORDER_STATUS, OrderService} from "../../../services/order.service";
import {startWith} from "rxjs/operators/startWith";
import {catchError} from "rxjs/operators/catchError";
import {merge} from "rxjs/observable/merge";
import {map} from "rxjs/operators/map";
import {of as observableOf} from "rxjs/observable/of";
import {switchMap} from "rxjs/operators/switchMap";
import {ProgressSpinnerComponent} from "../../../components/common/common.component";
import {FormBuilder, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";
import {GOOD_VALUES, SERVICE_TYPE, ServiceService, SIZES, WEIGHTS} from "../../../services/service.service";
import {GeocompleteComponent} from "../../../components/common/geocomplete/geocomplete.component";
import {Router} from "@angular/router";
import {EventService} from "../../../services/event.service";
import {CountryService, MAP_MARKERS} from "../../../services/country.service";
import {ForwarderCardComponent} from "../../../components/common/forwarder-card-dialog/forwarder-card-dialog.component";
import {animate, state, style, transition, trigger} from '@angular/animations';
import {FormValidators} from "../../../utils/FormValidators";
import {PageScrollInstance, PageScrollService} from "ngx-page-scroll";
import {DOCUMENT} from "@angular/common";
import {ReplaySubject, Subject} from 'rxjs';
import {WalletService} from "../../../services/wallet.service";
import {Language, DefaultLocale, Currency, LocaleService} from 'angular-l10n';

@Component({
    selector: 'app-orders',
    templateUrl: './home-buyer.component.html',
    styleUrls: ['../../page.component.scss',
        '../home.component.scss',
        './home-buyer.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
            state('expanded', style({height: '*', visibility: 'visible', backgroundColor: '#f0f1f3'})),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
        trigger('transitionMessages', [
            state('enter', style({opacity: 1, transform: 'translateY(0%)', padding: '50px 0'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(-100%)', padding: '0'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
        trigger('forwarderSearch', [
            state('enter', style({opacity: 1, transform: 'translateY(0%)', padding: '50px 0'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(-100%)', padding: '0'}),
                animate('700ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
    encapsulation: ViewEncapsulation.None,
})
export class HomeBuyerPageComponent implements OnInit, AfterViewInit {
    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('fromSearchCll') fromSearchCll: GeocompleteComponent;
    @ViewChild(MatPaginator) ordersPaginator: MatPaginator;
    @ViewChild(MatSort) ordersSort: MatSort;
    @ViewChild('orderSpinner') ordersSpinner: ProgressSpinnerComponent;
    @ViewChild('eventsTable', {read: MatSort}) eventsSort: MatSort;
    @ViewChild('eventsPaginator') eventsPaginator: MatPaginator;
    @ViewChild('eventSpinner') eventsSpinner: ProgressSpinnerComponent;
    @ViewChild(MatPaginator) feedbackPaginator: MatPaginator;
    @ViewChild('countrySelect') countrySelect: MatSelect;
    @ViewChild('addressSelect') addressSelect: MatSelect;

    ordersDisplayedColumns = ['id', 'type', 'dateCreated', 'state', 'price', 'view-details'];
    eventsDisplayedColumns = ['name', 'description', 'type', 'dateCreated'];
    profile;
    wallet;
    countries = [];
    forwarders = [];
    addresses = [];
    orders = new MatTableDataSource();
    events = new MatTableDataSource();
    ordersCount = 0;
    eventsCount = 0;
    maxPerPage = 5;
    newOrderP2PForm: FormGroup;
    newOrderCLLForm: FormGroup;
    localForwarders = MAP_MARKERS;
    localForwardersMock: boolean = true;
    sizes = SIZES;
    weights = WEIGHTS;
    goodValues = GOOD_VALUES;

    feedbacks;
    length;
    pageSize = 3;
    readOnly;
    isForwarder;
    defaultForwarderImageSrc = 'assets/images/search-inner.svg';
    showDaysError;
    showTimeError;
    searchError = {
        error: false,
        value: ''
    };
    searchDone: boolean;

    zoom = 3;
    subProfile: any;
    docsSubmitted;

    isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');


    filteredCountries: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
    private _onDestroy: Subject<void> = new Subject<void>();
    public countryFilterCtrl: FormControl = new FormControl();

    constructor(private router: Router,
                private userService: UserService,
                private profilePublisher: ProfilePublisher,
                private localeService: LocaleService,
                private orderService: OrderService,
                private eventService: EventService,
                private serviceService: ServiceService,
                private countryService: CountryService,
                private fb: FormBuilder,
                private pageScrollService: PageScrollService,
                private walletService: WalletService,
                public dialog: MatDialog,
                @Inject(DOCUMENT) private document: any) {
    }

    ngOnInit() {
        this.orders = new MatTableDataSource<Order>([]);
        this.events = new MatTableDataSource<Event>([]);
        this.countries = this.countryService.getCounties();
        this.updateUserProfile();
        this.initNewOrderP2PForm();
        this.initNewOrderCLLForm();

        this.filteredCountries.next(this.countries.slice());

        this.countryFilterCtrl.valueChanges
            .subscribe(() => {
                this.filterCountries();
            });

        this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
            this.profile = profile;
        });
    }

    ngAfterViewInit(): void {
        this.ordersSort.sortChange.subscribe(() => this.ordersPaginator.pageIndex = 0);
        this.eventsSort.sortChange.subscribe(() => this.eventsPaginator.pageIndex = 0);
        this.updateOrderTable();
        this.updateEventTable();
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    updateOrderTable() {
        merge(this.ordersSort.sortChange, this.ordersPaginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.ordersSpinner.show();
                    return this.orderService
                        .getOrders(
                            this.ordersSort.active,
                            this.ordersSort.direction,
                            this.ordersPaginator.pageIndex + 1,
                            this.maxPerPage
                        );
                }),
                map((data: any) => {
                    this.ordersSpinner.hide();
                    this.ordersCount = data.ordersCount;
                    return data.orders;
                }),
                catchError(() => {
                    this.ordersSpinner.hide();
                    return observableOf([]);
                })
            ).subscribe(data => {
            const rows = [];
            data.forEach(order => rows.push(order, {
                detailRow: true,
                order: order,
            }));
            this.orders.data = rows;
        });
    }

    updateEventTable() {
        merge(this.eventsSort.sortChange, this.eventsPaginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.eventsSpinner.show();
                    return this.eventService
                        .getEvents(
                            this.eventsSort.active,
                            this.eventsSort.direction,
                            this.eventsPaginator.pageIndex + 1,
                            this.maxPerPage
                        );
                }),
                map((data: any) => {
                    this.eventsSpinner.hide();
                    this.eventsCount = data.eventsCount;
                    return data.events;
                }),
                catchError(() => {
                    this.eventsSpinner.hide();
                    return observableOf([]);
                })
            ).subscribe(data => this.events.data = data);
    }

    searchForwarder({value, valid}: { value: any, valid: boolean }) {
        this.resetSearchResults();
        if (valid) {
            this.searchDone = true;
            this.serviceService
                .forwarderSearch(value)
                .then((response: any) => {
                    if (response.success) {
                        if (response.services.length > 0) {
                            this.localForwardersMock = false;
                            this.scrollToResults();
                            this.forwarders = response.services;
                            this.localForwarders = response.services
                                .filter(service => service.locationFrom)
                                .map(service => {
                                    return {
                                        lat: service.locationFrom.lat,
                                        lng: service.locationFrom.lng,
                                        title: service.locationFrom.name,
                                        username: service.profile.user.username
                                    }
                                });
                            this.zoom = 4;
                        } else {
                            this.forwarders = [];
                            this.localForwarders = [];
                            this.searchError = {
                                error: true,
                                value: 'Forwarder'
                            };
                        }
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        } else {
            if (!this.newOrderP2PForm.controls['locationFrom'].valid) {
                this.newOrderP2PForm.controls['locationFrom'].setErrors({'required': true});
            }
        }
    }

    searchPackageCollectorSearch({value, valid}: { value: any, valid: boolean }) {
        FormValidators.validateAllFormFields(this.newOrderCLLForm);
        this.resetSearchResults();
        if (valid) {
            this.searchDone = true;
            this.serviceService
                .packageCollectorSearch(value)
                .then((response: any) => {
                    if (response.success) {
                        if (response.services.length > 0) {
                            this.localForwardersMock = false;
                            this.scrollToResults();
                            this.forwarders = response.services;
                            this.localForwarders = response.services
                                .filter(service => service.locationFrom)
                                .map(service => {
                                    return {
                                        lat: service.locationFrom.lat,
                                        lng: service.locationFrom.lng,
                                        title: service.locationFrom.name,
                                        username: service.profile.user.username
                                    }
                                });
                        } else {
                            this.forwarders = [];
                            this.localForwarders = [];
                            this.searchError = {
                                error: true,
                                value: 'Package Collector'
                            };
                        }
                    }
                })
                .catch(error => {
                    console.log(error);
                });
        } else {
            if (!this.newOrderCLLForm.controls['locationFrom'].valid) {
                this.fromSearchCll.setError();
            }
            if (this.newOrderCLLForm.hasError('weekdaysError')) {
                this.showDaysError = true;
            }
            if (this.newOrderCLLForm.hasError('timeslotsError')) {
                this.showTimeError = true;
            }
        }
    }

    setLocationFromP2P(formControlName, location) {
        this.newOrderP2PForm
            .controls[formControlName]
            .setValue({
                countryName: this.countryService.getCountryByName(location.value).name,
                countryCode: this.countryService.getCountryByName(location.value).code,
            });
    }

    setLocationToP2P(formControlName, location) {
        if (this.addressSelect.value !== 'add-address') {
            this.newOrderP2PForm
                .controls[formControlName]
                .setValue({
                    deliveryAddress: location.value,
                    countryName: this.countryService.getCountryByName(location.value.country).name,
                    countryCode: this.countryService.getCountryByName(location.value.country).code,
                });
        }
    }

    setLocationCLL(formControlName, location) {
        this.newOrderCLLForm
            .controls[formControlName]
            .setValue({
                name: location.city,
                countryCode: location.countryCode,
                lat: location.lat,
                lng: location.lng
            });
    }


    goToOrderDetail(order) {
        if (order.state === ORDER_STATUS.new) {
            this.router.navigate([`orders/new/${order.service.type}/`, order.service.id, order.id]);
        } else {
            this.router.navigate(['orders/buyer', order.id]);
        }
    }

    openForwarderCard(service, readOnly) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769 || window.innerHeight < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '90%';
            dialogHeight = '740px';
        }
        this.dialog
            .open(ForwarderCardComponent,
                {
                    data: {
                        profile: this.profile,
                        forwarder: service,
                        readOnly,
                        searchData: service.type === SERVICE_TYPE.p2p ? this.newOrderP2PForm.value : this.newOrderCLLForm.value
                    },
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight,
                    panelClass: 'forwarder-dialog'
                });
    }

    resetSearchResults() {
        this.forwarders = [];
        this.searchError = {
            error: false,
            value: ''
        };
    }

    resetSearchResultsOnTabChange(formDirective: FormGroupDirective, formDirective1:FormGroupDirective) {
        this.resetSearchResults();
        formDirective.resetForm();
        formDirective1.resetForm();
        this.newOrderP2PForm.reset();
        this.newOrderCLLForm.reset();
    }

    changePage(event) {
        this.userService
            .getBuyerFeedbacks(event.pageIndex + 1, event.pageSize, this.profile.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.length = response.feedbacksCount;
                    this.feedbacks = response.feedbacks;
                }
            })
    }

    scrollToResults() {
        let pageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#local-forwarders-container');
        this.pageScrollService.start(pageScrollInstance);
    }


    openOrderPaymentReportPdf(orderId) {
        let newWindow = window.open("", "_blank");
        this.walletService
            .getBuyerOrderPaymentReport(orderId)
            .subscribe((response: Blob) => {
                    let fileURL = URL.createObjectURL(response);
                    newWindow.location.href = fileURL;
                },
                error => {
                    console.log(error);
                });
    }

    private filterCountries() {
        if (!this.countries) {
            return;
        }
        // get the search keyword
        let search = this.countryFilterCtrl.value;
        if (!search) {
            this.filteredCountries.next(this.countries.slice());
            return;
        } else {
            search = search.toLowerCase();
        }
        // filter the banks
        this.filteredCountries.next(
            this.countries.filter(country => country.name.toLowerCase().indexOf(search) > -1)
        );
    }

    private updateUserProfile() {
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success && response.profile) {
                    this.currency = this.localeService.getCurrentCurrency();
                    this.defaultLocale = this.localeService.getCurrentLocale();
                    this.lang = this.localeService.getCurrentLanguage();
                    this.profile = response.profile;
                    this.addresses = response.profile.addresses;
                    this.wallet = response.wallet;
                    this.isForwarder = response.profile.forwarderData.verified;
                    this.getFeedbackList();
                    this.docsSubmitted = this.userService.isDocsSumbit(this.profile);
                }
            })
    }

    private initNewOrderP2PForm() {
        this.newOrderP2PForm = new FormGroup({
            locationFrom: this.fb.group({
                countryName: new FormControl('', [Validators.required]),
                countryCode: new FormControl('', [Validators.required]),
            }),
            locationTo: this.fb.group({
                deliveryAddress: new FormControl('', [Validators.required]),
                countryName: new FormControl('', [Validators.required]),
                countryCode: new FormControl('', [Validators.required]),
            }),
            maxWeight: new FormControl('', [Validators.required]),
            maxSize: new FormControl('', [Validators.required]),
            maxGoodValue: new FormControl('', [Validators.required]),
            currency: new FormControl('',),
            acceptedPacksFromPrivateOrCompany: new FormControl(false),
        }, {updateOn: 'submit'});

    }

    private initNewOrderCLLForm() {
        this.newOrderCLLForm = new FormGroup({
            locationFrom: this.fb.group({
                name: new FormControl('', [Validators.required]),
                countryCode: new FormControl('', [Validators.required]),
                lat: new FormControl(0.0, [Validators.required]),
                lng: new FormControl(0.0, [Validators.required]),
            }),
            maxWeight: new FormControl('', [Validators.required]),
            maxSize: new FormControl('', [Validators.required]),
            acceptedPacksFromPrivateOrCompany: new FormControl(false),
            sunday: new FormControl(false, []),
            monday: new FormControl(false, []),
            tuesday: new FormControl(false, []),
            wednesday: new FormControl(false, []),
            thursday: new FormControl(false, []),
            friday: new FormControl(false, []),
            saturday: new FormControl(false, []),
            currency: new FormControl(''),
            deliveryOnDawn: new FormControl(false, []),
            deliveryOnMorning: new FormControl(false, []),
            deliveryOnAfternoon: new FormControl(false, []),
            deliveryOnEvening: new FormControl(false, []),
            deliveryOnLunchTime: new FormControl(false, []),
            deliveryOnNight: new FormControl(false, []),
        }, {
            updateOn: 'submit',
            validators: [FormValidators.weekdaysCllValidator,
                FormValidators.timeslotsCllValidator]
        });
    }

    private getFeedbackList() {
        this.userService
            .getBuyerFeedbacks(1, this.pageSize, this.profile.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.length = response.feedbacksCount;
                    this.feedbacks = response.feedbacks;
                }
            });
    }
}
