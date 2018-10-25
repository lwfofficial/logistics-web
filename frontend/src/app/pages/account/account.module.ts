import {CountryService} from "../../services/country.service";
import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {LoggedInGuard} from "../../services/authentication.service";
import {CommonModule} from "@angular/common";
import {MaterialDesignModule} from "../../material.module";
import {
    AccountPageComponent,
    AccountVerificationPageComponent,
    AccountVerificationStepOneComponent,
    AccountVerificationStepThreeComponent,
    AccountVerificationStepTwoComponent,
    AddressDialogComponent, CautionDialogComponent,
    ConfirmUploadDialogComponent,
    AccountSecurityPageComponent,
    PasswordChangeDialogComponent, Confirm2FSDialogComponent, ConfirmUpdateSettingDialogComponent,
} from "./account.component";
import {ConfigurationUtil} from "../../utils/config";
import {LocalizationModule} from "angular-l10n";

let COMPONENTS = [
    AccountPageComponent,
    AccountVerificationPageComponent,
    AccountVerificationStepOneComponent,
    AccountVerificationStepTwoComponent,
    AccountVerificationStepThreeComponent,
    AddressDialogComponent,
    ConfirmUploadDialogComponent,
    CautionDialogComponent,
    AccountSecurityPageComponent,
    PasswordChangeDialogComponent,
    Confirm2FSDialogComponent,
    ConfirmUpdateSettingDialogComponent
];

const routes: Routes = [
    {
        path: '',
        component: AccountPageComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: 'verification',
        component: AccountVerificationPageComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: 'security',
        component: AccountSecurityPageComponent,
        canActivate: [LoggedInGuard]
    }
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
        AddressDialogComponent,
        ConfirmUploadDialogComponent,
        CautionDialogComponent,
        PasswordChangeDialogComponent,
        Confirm2FSDialogComponent,
        ConfirmUpdateSettingDialogComponent
    ]
})
export class AccountModule {
}