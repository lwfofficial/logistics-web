import {AgmCoreModule} from "@agm/core";
import {LWFCommonModule} from "../../components/common/common.module";
import {NgModule} from "@angular/core";
import {CountryService} from "../../services/country.service";
import {SwiperModule} from "angular2-useful-swiper";
import {HomePageComponent, HomePartnersComponent} from "./home.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialDesignModule} from "../../material.module";
import {environment} from "../../../environments/environment";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";
import {NgxPageScrollModule} from 'ngx-page-scroll';

@NgModule({
    declarations: [
        HomePageComponent,
        HomePartnersComponent,
    ],
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: HomePageComponent,
            }
        ]),
        ReactiveFormsModule,
        FormsModule,
        CommonModule,
        MaterialDesignModule,
        LWFCommonModule,
        SwiperModule,
        PipeModule,
        AgmCoreModule.forRoot({
            apiKey: environment.google.mapsApiKey,
            libraries: ["places"]
        }),
        NgxPageScrollModule
    ],
    exports: [
        HomePageComponent,
        HomePartnersComponent,

    ],
    providers: [
        CountryService,
    ],
})
export class HomeModule {
}
