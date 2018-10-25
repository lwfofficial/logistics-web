import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {CommonModule} from "@angular/common";
import {MaterialDesignModule} from "../../material.module";
import {
    LoginPageComponent,
    LoginMobileDialogComponent,
    SignupDialogComponent,
    ClosedBetaDialogComponent
} from "./login.component";

let COMPONENTS = [
    LoginPageComponent,
    SignupDialogComponent,
    ClosedBetaDialogComponent
];

const routes: Routes = [
    {
        path: '',
        component: LoginPageComponent
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
    ],
    exports: COMPONENTS,
    entryComponents: [
        SignupDialogComponent,
        ClosedBetaDialogComponent
    ]
})
export class LoginModule {
}