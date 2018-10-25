import {HomeForwarderComponent} from "./home-forwarder.component";
import {PipeModule} from "../../../components/common/pipe/pipe.module";
import {LoggedInGuard} from "../../../services/authentication.service";
import {SwiperModule} from "angular2-useful-swiper";
import {NgModule} from "@angular/core";
import {MaterialDesignModule} from "../../../material.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {LWFCommonModule} from "../../../components/common/common.module";
import {RouterModule} from "@angular/router";
import {CountryService} from "../../../services/country.service";
import {ChartModule} from 'angular2-highcharts';
import {HighchartsStatic} from 'angular2-highcharts/dist/HighchartsService';
import {LocaleValidationModule, LocalizationModule} from "angular-l10n";
import {ConfigurationUtil} from "../../../utils/config";


declare var require: any;

export function highchartsFactory() {
    const hc = require('highcharts/highstock');
    return hc;
}


@NgModule({
    declarations: [
        HomeForwarderComponent,
    ],
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: HomeForwarderComponent,
                canActivate: [LoggedInGuard],
            }
        ]),
        ReactiveFormsModule,
        FormsModule,
        CommonModule,
        MaterialDesignModule,
        LWFCommonModule,
        SwiperModule,
        PipeModule,
        ChartModule,
        LocalizationModule.forRoot(ConfigurationUtil.localeConf()),

    ],
    exports: [
        HomeForwarderComponent,
    ],
    providers: [
        CountryService,
        {
            provide: HighchartsStatic,
            useFactory: highchartsFactory
        }
    ]
})
export class HomeForwarderModule {
}