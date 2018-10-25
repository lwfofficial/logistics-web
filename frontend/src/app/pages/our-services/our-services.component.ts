import { Component, OnInit } from '@angular/core';
import {environment} from "../../../environments/environment";

@Component({
    selector: 'app-our-services',
    templateUrl: './our-services.component.html',
    styleUrls: ['../page.component.scss', './our-services.component.scss']
})
export class OurServicesPageComponent implements OnInit {

    version: string;

    constructor() {
        this.version = environment.version;
    }

    ngOnInit() {

    }

}
