import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {MaterialDesignModule} from "../../material.module";
import {OurServicesPageComponent} from "./our-services.component";
import {NgxPageScrollModule} from 'ngx-page-scroll';

let COMPONENTS = [
    OurServicesPageComponent,
];

const routes: Routes = [
    {
        path: '',
        component: OurServicesPageComponent,
    },
];

@NgModule({
    declarations: COMPONENTS,
    imports: [
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        FormsModule,
        CommonModule,
        MaterialDesignModule,
        LWFCommonModule,
        NgxPageScrollModule
    ],
    exports: COMPONENTS,
})
export class OurServicesModule {
}