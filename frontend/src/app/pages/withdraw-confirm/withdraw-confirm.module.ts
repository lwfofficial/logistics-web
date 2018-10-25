import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialDesignModule} from "../../material.module";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {WithdrawConfirmPageComponent} from "./withdraw-confirm.component";
import {ConfigurationUtil} from "../../utils/config";
import {LocalizationModule} from "angular-l10n";

let COMPONENTS = [
    WithdrawConfirmPageComponent,
];

const routes: Routes = [
    {
        path: ':hashKey',
        component: WithdrawConfirmPageComponent
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
    ]
})
export class WithdrawConfirmModule {
}