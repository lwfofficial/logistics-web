import {CountryService} from "../../services/country.service";
import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialDesignModule} from "../../material.module";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {
    DepositFormComponent,
    DepositPaypalDialogComponent,
    WalletsPageComponent,
    WithdrawalDialogComponent,
    WithdrawalFormComponent
} from "./wallets.component";
import {LoggedInGuard} from "../../services/authentication.service";
import {ConfigurationUtil} from "../../utils/config";
import {LocalizationModule} from "angular-l10n";
import {ConfigurationService} from "../../services/configuration.service";

let COMPONENTS = [
    WalletsPageComponent,
    DepositFormComponent,
    WithdrawalFormComponent,
    WithdrawalDialogComponent,
    DepositPaypalDialogComponent
];

const routes: Routes = [
    {
        path: '',
        component: WalletsPageComponent,
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
        ConfigurationService
    ],
    entryComponents: [
        WithdrawalDialogComponent,
        DepositPaypalDialogComponent
    ]
})
export class WalletModule {
}