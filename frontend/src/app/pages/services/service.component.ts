import {Component, EventEmitter, Input, OnInit, Output, Pipe, PipeTransform} from "@angular/core";
import {
    GOOD_TYPES, MAX_GOOD_VALUES, MAX_SIZE, MAX_WEIGHT, Service, SERVICE_TYPE,
    ServiceService
} from "../../services/service.service";
import {CountryService} from "../../services/country.service";
import {Currency, Language, DefaultLocale} from "angular-l10n";


@Component({
    selector: 'service-box',
    templateUrl: './templates/service.component.html',
    styleUrls: ['../../pages/page.component.scss', '../services/services.component.scss']
})
export class ServiceComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input()
    service: Service;

    @Input()
    profile: any;

    @Output()
    onEdit = new EventEmitter();

    @Output()
    onDelete = new EventEmitter();

    @Output()
    onToggle = new EventEmitter();

    serviceTypes = SERVICE_TYPE;


    constructor(private serviceService: ServiceService) {
    }

    ngOnInit(): void {
    }

    edit() {
        this.onEdit.emit(this.service);
    }

    delete() {
        this.onDelete.emit(this.service.id);
    }

    refreshService() {
        this.serviceService
            .getService(this.service.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.service = response.service;
                }
            });
    }

    toggleEnableService(event) {
        this.service.enabled = event.checked;
        this.serviceService
            .singleToggleEnable(this.service.enabled, this.service.id)
            .then((response: any) => {
                this.refreshService();
                this.onToggle.emit(this.service);
            }).catch((error) => {
            this.refreshService();
            this.onToggle.emit(this.service);
        });
    }

    saveService(event) {
        this.service.enabled = event.checked;
        this.serviceService
            .editService(this.service)
            .subscribe(response => {
                console.log(response);
            });
    }

    emptyOptions() {
        return !this.service.addPartnerForwarder
            && !this.service.acceptedPacksFromCompany
            && !this.service.acceptedPacksFromPrivate
            && !this.service.totalAssurance;
    }


}