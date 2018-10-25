import {CountryService} from "../../services/country.service";
import {RouterModule, Routes} from "@angular/router";
import {LWFCommonModule} from "../../components/common/common.module";
import {NgModule} from "@angular/core";
import {LoggedInGuard} from "../../services/authentication.service";
import {CommonModule} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MaterialDesignModule} from "../../material.module";
import {PipeModule} from "../../components/common/pipe/pipe.module";
import {
    AbortP2pOrderDialogComponent,
    NewOrderP2PPageComponent,
    NewOrderP2PStepOneComponent,
    NewOrderP2PStepThreeComponent,
    NewOrderP2PStepTwoComponent,
    NewOrderP2PStepFourComponent
} from "./orders.new.p2p.component";
import {
    AbortCllOrderDialogComponent, NewOrderCLLPageComponent, NewOrderCLLStepFourComponent, NewOrderCLLStepOneComponent,
    NewOrderCLLStepThreeComponent, NewOrderCLLStepTwoComponent
} from "./order.new.cll.component";
import {OrderDetailBuyerPageComponent} from "./orders.detail.buyer.component";
import {OrdersDetailForwarderPageComponent} from "./orders.detail.forwarder.component";
import {
    OrderStatusComponent, UpdateRefuseReasonDialogComponent,
    UpdateTrackingInfoDialogComponent,OrderActionDialogComponent
} from "./order.status.component";
import {OrderNotesComponent} from "./order.note.component";
import {WalletModule} from "../wallets/wallet.module";
import {CurrencyService} from "../../services/currency.service";
import {ConfigurationUtil} from "../../utils/config";
import {LocalizationModule} from "angular-l10n";

let COMPONENTS = [
    NewOrderCLLPageComponent,
    NewOrderCLLStepOneComponent,
    NewOrderCLLStepTwoComponent,
    NewOrderCLLStepThreeComponent,
    NewOrderCLLStepFourComponent,
    NewOrderP2PPageComponent,
    NewOrderP2PStepOneComponent,
    NewOrderP2PStepTwoComponent,
    NewOrderP2PStepThreeComponent,
    NewOrderP2PStepFourComponent,
    OrderDetailBuyerPageComponent,
    OrdersDetailForwarderPageComponent,
    OrderStatusComponent,
    OrderNotesComponent,
    UpdateTrackingInfoDialogComponent,
    UpdateRefuseReasonDialogComponent,
    AbortP2pOrderDialogComponent,
    AbortCllOrderDialogComponent,
    OrderActionDialogComponent
];

const routes: Routes = [
    {
        path: 'new/p2p-freight/:serviceId',
        component: NewOrderP2PPageComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: 'new/package-collecting/:serviceId',
        component: NewOrderCLLPageComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: 'new/p2p-freight/:serviceId/:orderId',
        component: NewOrderP2PPageComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: 'new/package-collecting/:serviceId/:orderId',
        component: NewOrderCLLPageComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: 'buyer/:orderId',
        component: OrderDetailBuyerPageComponent,
        canActivate: [LoggedInGuard]
    },
    {
        path: 'forwarder/:orderId',
        component: OrdersDetailForwarderPageComponent,
        canActivate: [LoggedInGuard]
    }
];

@NgModule({
    declarations: COMPONENTS,
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        WalletModule,
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
        CurrencyService
    ],
    entryComponents: [
        UpdateTrackingInfoDialogComponent,
        UpdateRefuseReasonDialogComponent,
        AbortP2pOrderDialogComponent,
        AbortCllOrderDialogComponent,
        OrderActionDialogComponent
    ]
})
export class OrderModule {
}