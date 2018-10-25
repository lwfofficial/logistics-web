import {CountryService} from "../../services/country.service";
import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialDesignModule} from "../../material.module";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {SignupMobileDialogComponent, SignupPageComponent} from "./signup.component";
import {RecaptchaModule} from "ng-recaptcha";
import {RecaptchaFormsModule} from "ng-recaptcha/forms";
import {SignupDialogComponent} from "../login/login.component";
import {ConfigurationUtil} from "../../utils/config";
import {LocalizationModule} from "angular-l10n";

let COMPONENTS = [
    SignupPageComponent,
];

const routes: Routes = [
    {
        path: ':activationKey',
        component: SignupPageComponent
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
        RecaptchaFormsModule,
        RecaptchaModule.forRoot(),
        LocalizationModule.forRoot(ConfigurationUtil.localeConf()),
    ],
    exports: COMPONENTS,
    providers: [
        CountryService,
    ]
})
export class SignupModule {
}