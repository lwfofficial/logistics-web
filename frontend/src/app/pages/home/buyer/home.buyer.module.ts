import {environment} from "../../../../environments/environment";
import {HomeBuyerPageComponent} from "./home-buyer.component";
import {PipeModule} from "../../../components/common/pipe/pipe.module";
import {AgmCoreModule} from "@agm/core";
import {LoggedInGuard} from "../../../services/authentication.service";
import {SwiperModule} from "angular2-useful-swiper";
import {NgModule} from "@angular/core";
import {MaterialDesignModule} from "../../../material.module";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule} from "@angular/common";
import {LWFCommonModule} from "../../../components/common/common.module";
import {RouterModule} from "@angular/router";
import {CountryService} from "../../../services/country.service";
import {ConfigurationUtil} from "../../../utils/config";
import {LocalizationModule} from "angular-l10n";

@NgModule({
    declarations: [
        HomeBuyerPageComponent,
    ],
    imports: [
        RouterModule.forChild([
            {
                path: '',
                component: HomeBuyerPageComponent,
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
        AgmCoreModule.forRoot({
            apiKey: environment.google.mapsApiKey,
            libraries: ["places"]
        }),
        LocalizationModule.forRoot(ConfigurationUtil.localeConf()),
    ],
    exports: [
        HomeBuyerPageComponent,
    ],
    providers: [
        CountryService,
    ],
    entryComponents: [
    ]
})
export class HomeBuyerModule {
}