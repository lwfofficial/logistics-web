import {CountryService} from "../../services/country.service";
import {AddressDialogComponent, ConfirmUploadDialogComponent} from "../account/account.component";
import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {NgModule} from "@angular/core";
import {LoggedInGuard} from "../../services/authentication.service";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialDesignModule} from "../../material.module";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {
    ConfirmDeleteDialogComponent,
    ExpressDeliveryDialogComponent,
    P2PFreightDialogComponent,
    PackageCollectingDialogComponent,
    ServicesPageComponent
} from "./services.component";
import {ServiceComponent} from "./service.component";
import {ConfigurationUtil} from "../../utils/config";
import {LocalizationModule} from "angular-l10n";

let COMPONENTS = [
    ServicesPageComponent,
    ServiceComponent,
    P2PFreightDialogComponent,
    PackageCollectingDialogComponent,
    ExpressDeliveryDialogComponent,
    ConfirmDeleteDialogComponent,
];

const routes: Routes = [
    {
        path: '',
        component: ServicesPageComponent,
        canActivate: [LoggedInGuard]
    },
];

@NgModule({
    declarations: COMPONENTS,
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MaterialDesignModule,
        LWFCommonModule,
        PipeModule,
        LocalizationModule.forRoot(ConfigurationUtil.localeConf()),
    ],
    exports: COMPONENTS,
    providers: [
        CountryService,
    ],
    entryComponents:[
        P2PFreightDialogComponent,
        PackageCollectingDialogComponent,
        ExpressDeliveryDialogComponent,
        ConfirmDeleteDialogComponent,
    ]
})
export class ServiceModule {
}