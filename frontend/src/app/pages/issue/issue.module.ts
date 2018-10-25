import {NgModule} from "@angular/core";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {LoggedInGuard} from "../../services/authentication.service";
import {CommonModule} from "@angular/common";
import {MaterialDesignModule} from "../../material.module";
import {CloseIssueDialogComponent, IssuePageComponent} from "./issue.component";
import {IssueNewPageComponent} from "./issue.new.component";
import {ConfigurationUtil} from "../../utils/config";
import {LocalizationModule} from "angular-l10n";
import {CurrencyService} from "../../services/currency.service";

let COMPONENTS = [
    IssuePageComponent,
    IssueNewPageComponent,
    CloseIssueDialogComponent
];

const routes: Routes = [
    {
        path: ':issueId',
        component: IssuePageComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: 'new/:orderId/:isBuyer',
        component: IssueNewPageComponent,
        canActivate: [LoggedInGuard]
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
        PipeModule,
        LocalizationModule.forRoot(ConfigurationUtil.localeConf()),
    ],
    exports: COMPONENTS,
    entryComponents: [
        CloseIssueDialogComponent
    ],
})
export class IssueModule {
}