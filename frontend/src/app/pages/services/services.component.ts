import {
    Component,
    EventEmitter,
    Inject,
    OnInit,
    Input,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
    OnDestroy,
    ViewEncapsulation
} from '@angular/core';
import {UserService} from "../../services/user.service";
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef, MatSelect} from "@angular/material";
import {GOOD_VALUES, Location, Service, ServiceService, SIZES, WEIGHTS} from "../../services/service.service";
import {ProgressSpinnerComponent} from "../../components/common/common.component";
import {GeocompleteComponent} from "../../components/common/geocomplete/geocomplete.component";
import {CountryService} from "../../services/country.service";
import {animate, state, style, transition, trigger} from '@angular/animations';
import {FormValidators} from "../../utils/FormValidators";
import {Subject, ReplaySubject} from 'rxjs';
import {L10nDecimalPipe, LocaleService, Language, DefaultLocale, Currency} from 'angular-l10n';
import {GeocodeService} from "../../services/geocodeService";

@Component({
    selector: 'app-services',
    templateUrl: './templates/services.component.html',
    styleUrls: ['../page.component.scss', './services.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class ServicesPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;


    @ViewChild('spinner') spinner: ProgressSpinnerComponent;

    avatarImageSrc: string;
    profile;
    wallet;

    canActivateAllServices = false;
    activateAllServicesModel = false;
    isForwarder = false;
    services: Service[];
    dhlPartnerCost: number;

    addServiceForm: FormGroup;
    serviceTypes = [
        {type: 'p2p-freight', name: 'P2P Forwarder'},
        {type: 'package-collecting', name: 'Package Collecting'},
    ];

    constructor(private userService: UserService,
                private localeService: LocaleService,
                private serviceService: ServiceService,
                public dialog: MatDialog,) {
    }

    ngOnInit() {
        this.addServiceForm = new FormGroup({
            type: new FormControl('', [Validators.required]),
        }, {updateOn: 'submit'});
        this.updateUserProfile();
        this.serviceService
            .getPartnerCost()
            .subscribe((response: any) => {
                if (response.success) {
                    this.dhlPartnerCost = response.curierFeeAmount;
                }
            });
    }

    toggleActivateService() {
        this.serviceService
            .toggleEnableAllServices(this.activateAllServicesModel)
            .subscribe((response: any) => {
                if (response.success) {
                    this.updateServices();
                }
            })
    }

    addService({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            let addServiceDialogRef;
            addServiceDialogRef = this.getServiceDialog(new Service(value.type));
            addServiceDialogRef.componentInstance
                .submitted
                .subscribe(serviceData => {
                    this.serviceService
                        .createService(serviceData)
                        .then((result: any) => {
                            if (result.success) {
                                this.updateServices();
                            } else {
                                console.log(result);
                            }
                        })
                        .catch(error => {
                            console.log(error);
                        })
                })
        }
    }

    deleteService(serviceId) {
        this.dialog
            .open(ConfirmDeleteDialogComponent, {data: {serviceId: serviceId}})
            .componentInstance
            .onConfirm
            .subscribe(serviceId => {
                this.serviceService
                    .deleteService(serviceId)
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.updateServices();
                        }
                    }, error => {
                        console.log(error);
                    })
            });

    }

    editService(service) {
        let addServiceDialogRef;
        addServiceDialogRef = this.getServiceDialog(service);
        addServiceDialogRef.componentInstance
            .submitted
            .subscribe(serviceData => {
                this.serviceService
                    .editService(serviceData)
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.updateServices();
                        }
                    }, error => {
                        console.log(error);
                    });
            });
    }

    checkAllServicesEnabled() {
        this.activateAllServicesModel = true;
        this.canActivateAllServices = false;
        this.services.forEach((service) => {
            if (!service.enabled) {
                this.activateAllServicesModel = false;
                this.canActivateAllServices = true;
            }
        });
    }

    singleServiceToggle($event) {
        //update single service toggled;
        this.services.forEach((service) =>{
            if (service.id === $event.id) {
                service.enabled = $event.enabled;
            }
        });
        this.checkAllServicesEnabled();
    }


    private updateUserProfile() {
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success && response.profile) {
                    this.isForwarder = this.userService.isForwarder(response.profile);
                    if (this.isForwarder) {
                        this.currency = this.localeService.getCurrentCurrency();
                        this.defaultLocale = this.localeService.getCurrentLocale();
                        this.lang = this.localeService.getCurrentLanguage();
                        this.avatarImageSrc = response.profile.avatarImage;
                        this.profile = response.profile;
                        this.wallet = response.wallet;
                        this.updateServices();
                    }
                }
            });
    }

    private updateServices() {
        this.spinner.show();
        this.serviceService
            .getServices()
            .subscribe((response: any) => {
                this.spinner.hide();
                if (response.success) {
                    this.services = response.services;
                    this.checkAllServicesEnabled();
                }
            }, error => {
                this.spinner.hide();
            })
    }

    private getServiceDialog(service: any) {
        let addServiceDialogRef;
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769 || window.innerHeight < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else if (service.type === 'p2p-freight') {
            dialogWidth = '700px';
            dialogHeight = '95%';
        } else if (service.type === 'package-collecting') {
            dialogWidth = '700px';
            dialogHeight = '760px';
        }
        if (service.type === 'p2p-freight') {
            addServiceDialogRef = this.dialog
                .open(P2PFreightDialogComponent,
                    {
                        data: {
                            service: service,
                            dhlPartnerCost: this.dhlPartnerCost,
                            profile: this.profile
                        },
                        width: dialogWidth,
                        height: dialogHeight,
                        maxWidth: dialogWidth,
                        maxHeight: dialogHeight,
                        panelClass: 'service-dialog'
                    });
        } else if (service.type === 'package-collecting') {
            addServiceDialogRef = this.dialog
                .open(PackageCollectingDialogComponent,
                    {
                        data: {
                            service: service,
                            profile: this.profile
                        },
                        width: dialogWidth,
                        height: dialogHeight,
                        maxWidth: dialogWidth,
                        maxHeight: dialogHeight,
                        panelClass: 'service-dialog'
                    });
        } else {
            addServiceDialogRef = this.dialog
                .open(ExpressDeliveryDialogComponent,
                    {
                        data: {service: service},
                        width: '320px',
                        height: '300px',
                        maxWidth: '100vw',
                        maxHeight: '100vh'
                    });
        }
        return addServiceDialogRef;
    }
}

@Component({
    selector: 'p2p-freight-dialog',
    templateUrl: './templates/p2p.dialog.component.html',
    styleUrls: ['../page.component.scss', './services.component.scss'],
    animations: [
        trigger('transitionMessages', [
            state('enter', style({opacity: 1, transform: 'translateY(0%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(-100%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ])
    ],
})
export class P2PFreightDialogComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChildren(GeocompleteComponent) geocompletes: QueryList<GeocompleteComponent>;
    @ViewChildren("countryTos") countryTos: QueryList<MatSelect>;

    @Output()
    submitted = new EventEmitter();

    profile:any;

    addServiceForm: FormGroup;
    addOtherPartner: boolean = false;
    addForwarderPartner: boolean = false;
    static dhlPartnerCost: number;
    currentChlPartnerCost: number;
    countries = [];
    sizes = SIZES;
    weights = WEIGHTS;
    goodValues = GOOD_VALUES;
    service: Service;
    showPackError: boolean;
    showPartnerError: boolean;
    forwarderCities = [];

    filteredCountries: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
    private _onDestroy: Subject<void> = new Subject<void>();
    public countryFilterCtrl: FormControl = new FormControl();

    constructor(public dialogRef: MatDialogRef<P2PFreightDialogComponent>,
                private countryService: CountryService,
                private geocodeService: GeocodeService,
                private fb: FormBuilder,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.service = data.service;
        this.profile = data.profile;
        this.initForwarderCities();
        P2PFreightDialogComponent.dhlPartnerCost = this.service.addPartnerForwarder ? data.dhlPartnerCost : 0;
        this.currentChlPartnerCost = data.dhlPartnerCost;
        this.countries = this.countryService
            .getCounties()
            .map(country => new Location(country.name, country.code));
        this.addOtherPartner = !!this.service.otherCourierPartnerName;
        this.addForwarderPartner = this.service.addPartnerForwarder;
        this.addServiceForm = new FormGroup({
                id: new FormControl(this.service.id),
                type: new FormControl(this.service.type, [Validators.required]),
                title: new FormControl(this.service.title ? this.service.title : '', [Validators.required]),
                enabled: new FormControl(this.service.enabled, [Validators.required]),
                locationFrom: this.fb.group({
                    name: new FormControl(this.service.locationFrom ? this.service.locationFrom.name : '',
                        [Validators.required]),
                    countryCode: new FormControl(this.service.locationFrom ? this.service.locationFrom.countryCode : '',
                        [Validators.required]),
                    lat: new FormControl(this.service.locationFrom ? this.service.locationFrom.lat : 0.0,
                        [Validators.required]),
                    lng: new FormControl(this.service.locationFrom ? this.service.locationFrom.lng : 0.0,
                        [Validators.required]),
                }),
                profileForwarderAddress: new FormControl(this.service.profileForwarderAddress, [Validators.required]),
                locationFromSelect: new FormControl(null, [Validators.required]),
                locationTos: this.fb.array([]),
                maxSize: new FormControl(this.service.maxSize, [Validators.required]),
                maxWeight: new FormControl(this.service.maxWeight, [Validators.required]),
                priceCheap: new FormControl(this.service.priceCheap),
                priceStandard: new FormControl(this.service.priceStandard),
                priceExpress: new FormControl(this.service.priceExpress),
                priceCheapEnabled: new FormControl(this.service.priceCheapEnabled),
                priceStandardEnabled: new FormControl(this.service.priceStandardEnabled),
                priceExpressEnabled: new FormControl(this.service.priceExpressEnabled),
                acceptedPacksFromPrivate: new FormControl(this.service.acceptedPacksFromPrivate),
                acceptedPacksFromCompany: new FormControl(this.service.acceptedPacksFromCompany,),
                addPartnerForwarder: new FormControl(this.service.addPartnerForwarder),
                partnerForwarderMargin: new FormControl(this.service.partnerForwarderMargin ? this.service.partnerForwarderMargin : 0),
                addOtherPartner: new FormControl(this.service.addOtherPartner),
                otherCourierPartnerName: new FormControl(this.service.otherCourierPartnerName),
                totalAssurance: new FormControl(this.service.totalAssurance),
                sunday: new FormControl(this.service.sunday),
                monday: new FormControl(this.service.monday),
                tuesday: new FormControl(this.service.tuesday),
                wednesday: new FormControl(this.service.wednesday),
                thursday: new FormControl(this.service.thursday),
                friday: new FormControl(this.service.friday),
                saturday: new FormControl(this.service.saturday),
            }, {
                updateOn: 'submit',
                validators: [
                    P2PFreightDialogComponent.priceValidator,
                    P2PFreightDialogComponent.otherCourierNameValidator,
                    P2PFreightDialogComponent.packAcceptedFromValidator,
                    P2PFreightDialogComponent.forwarderPartnerValidator,
                ],
            }
        );
        let locationTos = this.addServiceForm.get('locationTos') as FormArray;
        if (this.service.locationTos) {
            this.service.locationTos
                .forEach(location => {
                    locationTos
                        .push(new FormControl(new Location(location.name, location.countryCode),
                            [Validators.required]));
                });
        } else {
            locationTos
                .push(new FormControl('', [Validators.required]));
        }
    }

    ngOnInit(): void {
        this.filteredCountries.next(this.countries.slice());

        this.countryFilterCtrl.valueChanges
            .subscribe(() => {
                this.filterCountries();
            });
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    initForwarderCities() {
        /*
        *
        * Geocode all forwarder addresses for create/edit p2p service.
        * after geocode add city on select input.
        *
         */
        let defaultProfileCityAddress = this.profile.defaultAddress.city + ' ' + this.profile.defaultAddress.zipCode + ' ' + this.countryService.getCountryByName(this.profile.defaultAddress.country).code;
        this.geocodeService.geocodeSearch(defaultProfileCityAddress)
            .toPromise()
            .then((geoData: any) => {
                if (geoData['success']) {
                    let city = {
                        name: this.profile.defaultAddress.city,
                        country: this.profile.defaultAddress.country,
                        countryCode: this.countryService.getCountryByName(this.profile.defaultAddress.country).code,
                        region: this.profile.defaultAddress.region,
                        street: this.profile.defaultAddress.street,
                        zipCode: this.profile.defaultAddress.zipCode,
                        lat: geoData['places']['results'][0]['geometry']['location']['lat'],
                        lng: geoData['places']['results'][0]['geometry']['location']['lng']
                    };
                    this.forwarderCities.push(city);
                    this.checkInitialSelectedCity(city);
                }
            }).catch((error) => {
                console.log("failed to get geocode data for " + defaultProfileCityAddress);
                console.log(error);
        });

        this.profile.addresses.forEach((address) => {
            let addressCheck = address.city + ' ' + this.countryService.getCountryByName(address.country).code;
            this.geocodeService.geocodeSearch(addressCheck)
                .toPromise()
                .then((geoData: any) => {
                    if (geoData['success']) {
                        let city = {
                            name: address.city,
                            country: address.country,
                            countryCode: this.countryService.getCountryByName(address.country).code,
                            region: address.region,
                            street: address.street,
                            zipCode: address.zipCode,
                            lat: geoData['places']['results'][0]['geometry']['location']['lat'],
                            lng: geoData['places']['results'][0]['geometry']['location']['lng']
                        };
                        this.forwarderCities.push(city);
                        this.checkInitialSelectedCity(city);
                    }
                }).catch((error) => {
                console.log("failed to get geocode data for " + addressCheck);
                console.log(error);
            });
        });
    }

    checkInitialSelectedCity(city) {
        if (this.data.service.locationFrom) {
            if (city.name === this.data.service.locationFrom.name && city.countryCode === this.data.service.locationFrom.countryCode) {
                this.addServiceForm.controls['locationFromSelect'].setValue(city);
            }
        }
    }

    closeDialog() {
        this.dialogRef.close();
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

    addService({value, valid}: { value: any, valid: boolean }) {
        FormValidators.validateAllFormFields(this.addServiceForm);
        if (valid) {
            this.submitted.emit(value);
            this.closeDialog();
        } else {
            if (this.addServiceForm.hasError('packError')) {
                this.showPackError = true;
            }
            if (this.addServiceForm.hasError('partnerError')) {
                this.showPartnerError = true;
            }
        }

    }

    addDestination() {
        let locationTos = this.addServiceForm.get('locationTos') as FormArray;
        locationTos.push(new FormControl('', [Validators.required]));
    }

    removeLocationTo(index) {
        let locationTos = this.addServiceForm.get('locationTos') as FormArray;
        if (locationTos.length > 1) {
            locationTos.removeAt(index);
        }
    }

    setLocationFrom(location) {
        this.addServiceForm
            .controls['locationFrom'].setValue({
            name: location.value.name,
            countryCode: location.value.countryCode,
            lat: location.value.lat,
            lng: location.value.lng
        });
        let profileForwarderAddress = location.value.street + ', ' + location.value.name + ' ' + location.value.zipCode + ' ' + location.value.country;
        this.addServiceForm
            .controls['profileForwarderAddress'].setValue(profileForwarderAddress);
    }

    showOtherPartnerInput(addOtherPartner) {
        this.addOtherPartner = !addOtherPartner;
        this.addForwarderPartner = false;
        this.addServiceForm.controls['addOtherPartner'].setValue(this.addOtherPartner);
        this.addServiceForm.controls['addPartnerForwarder'].setValue(this.addForwarderPartner);
        P2PFreightDialogComponent.dhlPartnerCost = 0;
    }

    setOtherPartnerInput() {
        P2PFreightDialogComponent.dhlPartnerCost = this.currentChlPartnerCost;
        this.addOtherPartner = false;
        this.addForwarderPartner = !this.addForwarderPartner;
        this.addServiceForm.controls['addPartnerForwarder'].setValue(this.addForwarderPartner);
        this.addServiceForm.controls['addOtherPartner'].setValue(this.addOtherPartner);
        this.addServiceForm.controls['otherCourierPartnerName'].setValue('');
        this.addServiceForm.controls['priceCheapEnabled'].setValue(false);
        this.addServiceForm.controls['priceStandardEnabled'].setValue(false);
        this.addServiceForm.controls['priceExpressEnabled'].setValue(false);
    }

    compareFn(c1: Location, c2: Location): boolean {
        return c1 && c2 ? c1.name === c2.name && c1.countryCode === c2.countryCode : c1 === c2;
    }

    logValue(){
        console.log(this.addServiceForm.controls['acceptedPacksFromCompany'].value);
    }

    static packAcceptedFromValidator(g: FormGroup){
        let packInvalid = false;
        let acceptedPacksFromPrivate = g.get('acceptedPacksFromPrivate');
        let acceptedPacksFromCompany = g.get('acceptedPacksFromCompany');
        if (!acceptedPacksFromPrivate.value && !acceptedPacksFromCompany.value){
            packInvalid = true;
        }
        return packInvalid ? {'packError': true} : null
    }
    static forwarderPartnerValidator(g: FormGroup){
        let partnerInvalid = false;
        let addPartnerForwarder = g.get('addPartnerForwarder');
        let addOtherPartner = g.get('addOtherPartner');
        if (!addPartnerForwarder.value && !addOtherPartner.value){
            partnerInvalid = true;
        }
        return partnerInvalid ? {'partnerError': true} : null
    }
    static priceValidator(g: FormGroup) {
        let invalid = false;
        let priceCheap = g.get('priceCheap');
        let priceStandard = g.get('priceStandard');
        let priceExpress = g.get('priceExpress');
        let priceCheapEnabled = g.get('priceCheapEnabled');
        let priceStandardEnabled = g.get('priceStandardEnabled');
        let priceExpressEnabled = g.get('priceExpressEnabled');
        let addPartnerForwarder = g.get('addPartnerForwarder');
        let addOtherPartner = g.get('addOtherPartner');
        priceCheap.setErrors(null);
        priceStandard.setErrors(null);
        priceExpress.setErrors(null);
        priceCheapEnabled.setErrors(null);
        priceStandardEnabled.setErrors(null);
        priceExpressEnabled.setErrors(null);
        if (priceCheapEnabled.value && priceCheap.value <= P2PFreightDialogComponent.dhlPartnerCost) {
            priceCheap.setErrors({'valueError': true});
            invalid = true;
        }
        if (priceStandardEnabled.value && priceStandard.value <= P2PFreightDialogComponent.dhlPartnerCost) {
            priceStandard.setErrors({'valueError': true});
            invalid = true;
        }
        if (priceExpressEnabled.value && priceExpress.value <= P2PFreightDialogComponent.dhlPartnerCost) {
            priceExpress.setErrors({'valueError': true});
            invalid = true;
        }
        if (!priceCheapEnabled.value
            && !priceStandardEnabled.value
            && !priceExpressEnabled.value
            && !addPartnerForwarder.value) {
            priceCheap.setErrors({'required': true});
            priceStandard.setErrors({'required': true});
            priceExpress.setErrors({'required': true});
            invalid = true;
        }
        return invalid ? {'priceError': true} : null;
    }

    static otherCourierNameValidator(g: FormGroup) {
        let invalid = false;
        let addOtherPartner = g.get('addOtherPartner');
        let otherCourierPartnerName = g.get('otherCourierPartnerName');
        if (addOtherPartner.value
            && !otherCourierPartnerName.value) {
            otherCourierPartnerName.setErrors({'required': true});
            invalid = true;
        }
        return invalid ? {'courierError': true} : null;
    }

}

@Component({
    selector: 'collecting-dialog',
    templateUrl: './templates/collecting.dialog.component.html',
    styleUrls: ['../page.component.scss', './services.component.scss'],
    animations: [
        trigger('transitionMessages', [
            state('enter', style({opacity: 1, transform: 'translateY(0%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateY(-100%)'}),
                animate('300ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ])
    ],
})
export class PackageCollectingDialogComponent {
    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('fromSearch') fromSearch: GeocompleteComponent;

    // pipe: L10nDecimalPipe = new L10nDecimalPipe();

    // price: any;

    @Output()
    submitted = new EventEmitter();

    addServiceForm: any;

    sizes = SIZES;

    weights = WEIGHTS;

    timeSlots = [{start: '09:00', end: '13:00'}, {start: '14:00', end: '18:00'}];

    service: Service;

    profile:any;
    forwarderCities = [];

    showDaysError: boolean;
    showTimeError: boolean;
    showPackError: boolean;

    constructor(public dialogRef: MatDialogRef<P2PFreightDialogComponent>,
                private fb: FormBuilder,
                private geocodeService: GeocodeService,
                private countryService: CountryService,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.service = data.service;
        this.profile = data.profile;
        this.initForwarderCities();
        // this.price = this.pipe.transform(this.service.price, this.locale.getDefaultLocale(), '1.2-2');
        //
        // this.locale.defaultLocaleChanged.subscribe(
        //     (defaultLocale: string) => {
        //         this.price = this.pipe.transform(this.service.price, defaultLocale, '1.2-2');
        //     }
        // );
    }

    ngOnInit(): void {
        this.addServiceForm = new FormGroup({
            id: new FormControl(this.service.id),
            type: new FormControl(this.service.type, [Validators.required]),
            title: new FormControl(this.service.title, [Validators.required]),
            enabled: new FormControl(this.service.enabled, [Validators.required]),
            locationFrom: this.fb.group({
                name: new FormControl(this.service.locationFrom ? this.service.locationFrom.name : '',
                    [Validators.required]),
                countryCode: new FormControl(this.service.locationFrom ? this.service.locationFrom.countryCode : '',
                    [Validators.required]),
                lat: new FormControl(this.service.locationFrom ? this.service.locationFrom.lat : 0.0,
                    [Validators.required]),
                lng: new FormControl(this.service.locationFrom ? this.service.locationFrom.lng : 0.0,
                    [Validators.required])
            }),
            profileForwarderAddress: new FormControl(this.service.profileForwarderAddress, [Validators.required]),
            locationFromSelect: new FormControl(null, [Validators.required]),
            maxSize: new FormControl(this.service.maxSize, [Validators.required]),
            maxWeight: new FormControl(this.service.maxWeight, [Validators.required]),
            price: new FormControl(this.service.price, [Validators.required]),
            acceptedPacksFromPrivate: new FormControl(this.service.acceptedPacksFromPrivate),
            acceptedPacksFromCompany: new FormControl(this.service.acceptedPacksFromCompany),
            sunday: new FormControl(this.service.sunday),
            monday: new FormControl(this.service.monday),
            tuesday: new FormControl(this.service.tuesday),
            wednesday: new FormControl(this.service.wednesday),
            thursday: new FormControl(this.service.thursday),
            friday: new FormControl(this.service.friday),
            saturday: new FormControl(this.service.saturday),
            deliveryOnDawn: new FormControl(this.service.deliveryOnDawn),
            deliveryOnMorning: new FormControl(this.service.deliveryOnMorning),
            deliveryOnAfternoon: new FormControl(this.service.deliveryOnAfternoon),
            deliveryOnEvening: new FormControl(this.service.deliveryOnEvening),
            deliveryOnLunchTime: new FormControl(this.service.deliveryOnLunchTime),
            deliveryOnNight: new FormControl(this.service.deliveryOnNight),
        }, {updateOn: 'submit',
            validators: [
                FormValidators.weekdaysCllValidator,
                FormValidators.timeslotsCllValidator,
                P2PFreightDialogComponent.packAcceptedFromValidator,
            ]
        });
    }

    initForwarderCities() {
        /*
        *
        * Geocode all forwarder addresses for create/edit pkg service.
        * after geocode add city on select input.
         */
        let defaultProfileCityAddress = this.profile.defaultAddress.city + ' ' + this.profile.defaultAddress.zipCode + ' ' + this.countryService.getCountryByName(this.profile.defaultAddress.country).code;
        this.geocodeService.geocodeSearch(defaultProfileCityAddress)
            .toPromise()
            .then((geoData: any) => {
                if (geoData['success']) {
                    let city = {
                        name: this.profile.defaultAddress.city,
                        country: this.profile.defaultAddress.country,
                        countryCode: this.countryService.getCountryByName(this.profile.defaultAddress.country).code,
                        region: this.profile.defaultAddress.region,
                        street: this.profile.defaultAddress.street,
                        zipCode: this.profile.defaultAddress.zipCode,
                        lat: geoData['places']['results'][0]['geometry']['location']['lat'],
                        lng: geoData['places']['results'][0]['geometry']['location']['lng']
                    };
                    this.forwarderCities.push(city);
                    this.checkInitialSelectedCity(city);
                }
            }).catch((error) => {
            console.log("failed to get geocode data for " + defaultProfileCityAddress);
            console.log(error);
        });

        this.profile.addresses.forEach((address) => {
            let addressCheck = address.city + ' ' + this.countryService.getCountryByName(address.country).code;
            this.geocodeService.geocodeSearch(addressCheck)
                .toPromise()
                .then((geoData: any) => {
                    if (geoData['success']) {
                        let city = {
                            name: address.city,
                            country: address.country,
                            countryCode: this.countryService.getCountryByName(address.country).code,
                            region: address.region,
                            street: address.street,
                            zipCode: address.zipCode,
                            lat: geoData['places']['results'][0]['geometry']['location']['lat'],
                            lng: geoData['places']['results'][0]['geometry']['location']['lng']
                        };
                        this.forwarderCities.push(city);
                        this.checkInitialSelectedCity(city);
                    }
                }).catch((error) => {
                console.log("failed to get geocode data for " + addressCheck);
                console.log(error);
            });
        });
    }

    checkInitialSelectedCity(city) {
        if (this.data.service.locationFrom) {
            if (city.name === this.data.service.locationFrom.name && city.countryCode === this.data.service.locationFrom.countryCode) {
                this.addServiceForm.controls['locationFromSelect'].setValue(city);
            }
        }
    }

    closeDialog() {
        this.dialogRef.close();
    }

    addService({value, valid}: { value: any, valid: boolean }) {
        FormValidators.validateAllFormFields(this.addServiceForm);
        if (valid) {
            this.submitted.emit(value);
            this.closeDialog();
        } else {
            if (this.addServiceForm.hasError('weekdaysError')) {
                this.showDaysError = true;
            }
            if (this.addServiceForm.hasError('timeslotsError')) {
                this.showTimeError = true;
            }
            if (this.addServiceForm.hasError('packError')) {
                this.showPackError = true;
            }
        }
    }

    setLocationFrom(location) {
        this.addServiceForm
            .controls['locationFrom'].setValue({
            name: location.value.name,
            countryCode: location.value.countryCode,
            lat: location.value.lat,
            lng: location.value.lng
        });
        let profileForwarderAddress = location.value.street + ', ' + location.value.name + ' ' + location.value.zipCode + ' ' + location.value.country;
        this.addServiceForm
            .controls['profileForwarderAddress'].setValue(profileForwarderAddress);
    }

}

@Component({
    selector: 'express-dialog',
    templateUrl: './templates/express.dialog.component.html',
    styleUrls: ['../page.component.scss', './services.component.scss']
})
export class ExpressDeliveryDialogComponent {


    @Output()
    submitted = new EventEmitter();

    addServiceForm: FormGroup;

    sizes = ['Small', 'Medium', 'Large'];

    service: Service;

    constructor(public dialogRef: MatDialogRef<P2PFreightDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.service = data.service;
    }

    ngOnInit(): void {
        this.addServiceForm = new FormGroup({}, {updateOn: 'submit'})
    }

    closeDialog() {
        this.dialogRef.close();
    }

    addService({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            this.submitted.emit(value);
            this.closeDialog();
        }
    }
}


@Component({
    selector: 'express-dialog',
    templateUrl: './templates/confirm.delete.dialog.component.html',
    styleUrls: ['../page.component.scss', './services.component.scss']
})
export class ConfirmDeleteDialogComponent {


    @Output()
    onConfirm = new EventEmitter();

    serviceId: any;

    constructor(public dialogRef: MatDialogRef<ConfirmDeleteDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.serviceId = data.serviceId;
    }

    ngOnInit(): void {
    }

    closeDialog() {
        this.dialogRef.close();
    }

    delete() {
        this.onConfirm.emit(this.serviceId);
        this.closeDialog();
    }
}