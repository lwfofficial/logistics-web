import {Component, ElementRef, Inject, Input, OnInit, OnDestroy, ViewChild, ViewEncapsulation} from "@angular/core";
import {FormControl, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {CountryService, MAP_MARKERS} from "../../services/country.service";
import {Router} from "@angular/router";
import {PageScrollInstance, PageScrollService} from "ngx-page-scroll";
import {DOCUMENT} from "@angular/common";
import {ProgressSpinnerComponent} from "../../components/common/common.component";
import {environment} from "../../../environments/environment";
import {ServiceService} from "../../services/service.service";
import {animate, state, style, transition, trigger} from '@angular/animations';
import {Subject, ReplaySubject} from 'rxjs';
import {MatSelect} from '@angular/material';
import {Currency, DefaultLocale, Language} from "angular-l10n";

@Component({
    selector: 'home',
    templateUrl: './templates/home.component.html',
    styleUrls: ['../page.component.scss', './home.component.scss'],
    animations: [
        trigger('quickSearch', [
            state('enter', style({opacity: 1, transform: 'translatex(0%)'})),
            transition('void => enter', [
                style({opacity: 0, transform: 'translateX(100%)'}),
                animate('500ms cubic-bezier(0.55, 0, 0.55, 0.2)')]),
        ]),
    ],
    encapsulation: ViewEncapsulation.None,

})
export class HomePageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('container') private container: ElementRef;
    @ViewChild('spinner') spinner: ProgressSpinnerComponent;
    @ViewChild('countryFromSelect') countryFromSelect: MatSelect;
    @ViewChild('countryToSelect') countryToSelect: MatSelect;

    version: string;
    quickSearchForm: FormGroup;

    forwarders = [];
    countries = [];
    localForwarders = MAP_MARKERS;
    localForwardersMock: boolean = true;
    searchDone;
    notFound;
    quickSearchResults = {
        offers: 0,
        startPrice: 0
    };

    filteredFromCountries: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);
    filteredToCountries: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    private _onDestroy: Subject<void> = new Subject<void>();

    public countryFromFilterCtrl: FormControl = new FormControl();
    public countryToFilterCtrl: FormControl = new FormControl();



    constructor(private router: Router,
                private countryService: CountryService,
                private serviceService: ServiceService,
                private pageScrollService: PageScrollService,
                private fb: FormBuilder,
                @Inject(DOCUMENT) private document: any) {
        this.version = environment.version;
    }

    ngOnInit(): void {
        this.countries = this.countryService.getCounties();
        this.quickSearchForm = new FormGroup({
            from: this.fb.group({
                countryName: new FormControl('', [Validators.required]),
                countryCode: new FormControl('', [Validators.required]),
            }),
            to: this.fb.group({
                countryName: new FormControl('', [Validators.required]),
                countryCode: new FormControl('', [Validators.required]),
            }),
            goods: new FormControl('', [Validators.required]),
        }, {updateOn: 'submit'});

        this.filteredFromCountries.next(this.countries.slice());
        this.filteredToCountries.next(this.countries.slice());

        this.countryFromFilterCtrl.valueChanges
            .subscribe(() => {
                this.filterFromCountries();
            });

        this.countryToFilterCtrl.valueChanges
            .subscribe(() => {
                this.filterToCountries();
            });
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    quickSearch({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            this.searchDone = true;
            this.serviceService
                .forwarderQuickSearch(value.from.countryCode, value.to.countryCode)
                .then((response: any) => {
                    if (response.success) {
                        if (response.services.length > 0) {
                            this.notFound = false;
                            this.localForwardersMock = false;
                            this.forwarders = response.services;
                            this.localForwarders = response.services
                                .filter(service => service.locationFrom)
                                .map(service => {
                                    return {
                                        lat: service.locationFrom.lat,
                                        lng: service.locationFrom.lng,
                                        title: service.locationFrom.name,
                                        username: service.profile.user.username,
                                        feedback: service.profile.feedback,
                                        price: service.priceCheap ? service.priceCheap : (service.priceStandard ? service.priceStandard : service.priceExpress)
                                    }
                                });
                            this.quickSearchResults.offers = this.localForwarders.length;
                            this.quickSearchResults.startPrice = response.startPrice;
                        } else {
                            this.notFound = true;
                            this.localForwarders = [];
                        }
                    }
                })
                .catch(error => {
                    console.log(error);
                })
        }
    }

    scrollToTop() {
        let pageScrollInstance = PageScrollInstance.simpleInstance(this.document, '#home-container');
        this.pageScrollService.start(pageScrollInstance);
    }

    goToLanding(): void{
        window.location.href = 'https://become-a-forwarder.lwf.global';
    }

    private filterFromCountries() {
        if (!this.countries) {
            return;
        }
        // get the search keyword
        let searchFrom = this.countryFromFilterCtrl.value;
        if (!searchFrom) {
            this.filteredFromCountries.next(this.countries.slice());
            return;
        } else {
            searchFrom = searchFrom.toLowerCase();
        }
        // filter the banks
        this.filteredFromCountries.next(
            this.countries.filter(country => country.name.toLowerCase().indexOf(searchFrom) > -1)
        );
    }

    private filterToCountries() {
        if (!this.countries) {
            return;
        }
        // get the search keyword
        let searchTo = this.countryToFilterCtrl.value;
        if (!searchTo) {
            this.filteredToCountries.next(this.countries.slice());
            return;
        } else {
            searchTo = searchTo.toLowerCase();
        }
        // filter the banks
        this.filteredToCountries.next(
            this.countries.filter(country => country.name.toLowerCase().indexOf(searchTo) > -1)
        );
    }

    setCountry(formControlName, location) {
        this.quickSearchForm
            .controls[formControlName]
            .setValue({
                countryName: this.countryService.getCountryByName(location.value).name,
                countryCode: this.countryService.getCountryByName(location.value).code,
            });
    }
}

@Component({
    selector: 'home-partners',
    styleUrls: ['../page.component.scss', './home.component.scss'],
    templateUrl: './templates/home.partners.component.html',
})
export class HomePartnersComponent {

    swiperConfig = {
        loop: true,
        autoplay: 5000,
        pagination: '.swiper-pagination',
    };

    constructor() {

    }

}
