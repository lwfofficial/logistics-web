import {CountryService} from "../../services/country.service";
import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {ConfirmDeleteDialogComponent, ServicesPageComponent} from "../services/services.component";
import {NgModule} from "@angular/core";
import {LoggedInGuard} from "../../services/authentication.service";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialDesignModule} from "../../material.module";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {PasswordRecoveryComponent, PasswordRecoveryDialogComponent} from "./password-recovery.component";
import {PasswordResetComponent, PasswordResetDialogComponent} from "./password-reset.component";

let COMPONENTS = [
    PasswordRecoveryComponent,
    PasswordRecoveryDialogComponent,
    PasswordResetComponent,
    PasswordResetDialogComponent,
];

const routes: Routes = [
    {
        path: '',
        component: PasswordRecoveryComponent
    },
    {
        path: 'reset/:activationKey',
        component: PasswordResetComponent
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
        PipeModule
    ],
    exports: COMPONENTS,
    providers: [
        CountryService,
    ],
    entryComponents:[
        PasswordRecoveryDialogComponent,
        PasswordResetDialogComponent
    ]
})
export class PasswordRecoveryModule {
}