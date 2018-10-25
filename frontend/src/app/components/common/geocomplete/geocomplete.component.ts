import {AfterViewInit, Component, EventEmitter, Input, Output, ViewChild} from "@angular/core";
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs/Rx";
import {GeocodeService} from "../../../services/geocodeService";
import {MatAutocomplete} from "@angular/material";

@Component({
    selector: 'geocomplete',
    templateUrl: './geocomplete.component.html'
})
export class GeocompleteComponent implements AfterViewInit {

    @ViewChild(MatAutocomplete) autocomplete: MatAutocomplete;

    @Input() placeHolder = 'Location';
    @Input() id = '';
    @Input() value;
    @Input() class = '';
    @Input() signup = false;

    @Output() optionSelected = new EventEmitter();

    formControl: FormControl;
    filteredPlaces: Observable<any[]>;

    city: string;
    region: string;
    countryCode: string;
    lat: number;
    lng: number;


    constructor(private geocodeService: GeocodeService) {
        this.formControl = new FormControl();
    }

    ngAfterViewInit(): void {
        this.formControl.setValue(this.value);
        this.formControl
            .valueChanges
            .subscribe(place => {
                this.filterPlaces(place)
            });
    }

    filterPlaces(name: string) {
        if (name && name.length > 2) {
            this.geocodeService
                .autocomplete(name)
                .subscribe((response: any) => {
                    if (response.places.status != 'OK') {
                        this.filteredPlaces = Observable.of([]);
                        return;
                    }
                    this.filteredPlaces = Observable.of(response.places.predictions);
                });
        }
    }

    fromSelected(place) {
        this.geocodeService
            .details(place.place_id)
            .subscribe((response: any) => {
                let place = response.places.result;
                let country = place.address_components
                    .find(address => address.types.find(type => type === "country") != null);
                let city = place.address_components
                    .find(address => address.types
                        .find(type => type === "locality" || type === "postal_town") != null);
                let region = place.address_components
                    .find(address => address.types
                        .find(type => type === "administrative_area_level_1") != null);
                this.countryCode = country.short_name;
                this.city = city.short_name;
                this.region = region != null ? region.long_name : '';
                this.lat = place.geometry.location.lat;
                this.lng = place.geometry.location.lng;
                this.optionSelected.emit({
                    city: this.city,
                    region: this.region,
                    countryCode: this.countryCode,
                    lat: this.lat,
                    lng: this.lng
                });
            })
    }

    setError() {
        this.formControl.setErrors({'required': true});
    }
}