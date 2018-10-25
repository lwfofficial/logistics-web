import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {MaterialDesignModule} from "./material.module";
import {RouterModule, Routes} from "@angular/router";
import {HttpClientModule} from "@angular/common/http";
import {AuthenticationService, LoggedInGuard} from "./services/authentication.service";
import {NgxPageScrollModule} from 'ngx-page-scroll';
import {LWFCommonModule} from "./components/common/common.module";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {NotFoundPageComponent} from "./pages/404/404.component";
import {ServicesModule} from "./services/services.module";

import {L10nLoader, LocaleValidationModule, LocalizationModule} from 'angular-l10n';
import {ConfigurationUtil} from "./utils/config";

const routes: Routes = [
    {
        path: 'home',
        loadChildren: './pages/home/home.module#HomeModule'
    },
    {
        path: 'buyer',
        loadChildren: './pages/home/buyer/home.buyer.module#HomeBuyerModule'
    },
    {
        path: 'forwarder',
        loadChildren: './pages/home/forwarder/home.forwarder.module#HomeForwarderModule'
    },
    {
        path: 'account',
        loadChildren: './pages/account/account.module#AccountModule'
    },
    {
        path: 'services',
        loadChildren: './pages/services/service.module#ServiceModule'
    },
    {
        path: 'login',
        loadChildren: './pages/login/login.module#LoginModule'
    },
    {
        path: 'orders',
        loadChildren: './pages/orders/order.module#OrderModule'
    },
    {
        path: 'issue',
        loadChildren: './pages/issue/issue.module#IssueModule'
    },
    {
        path: 'password-recovery',
        loadChildren: './pages/password-recovery/password-recovery.module#PasswordRecoveryModule'
    },
    {
        path: 'our-services',
        loadChildren: './pages/our-services/our-services.module#OurServicesModule'
    },
    {
        path: 'signup',
        loadChildren: './pages/signup/signup.module#SignupModule'
    },
    {
        path: 'withdrawConfirm',
        loadChildren: './pages/withdraw-confirm/withdraw-confirm.module#WithdrawConfirmModule'
    },
    {
        path: 'wallets',
        loadChildren: './pages/wallets/wallet.module#WalletModule'
    },
    {
        path: '404',
        component: NotFoundPageComponent
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];

@NgModule({
    declarations: [
        AppComponent,
        NotFoundPageComponent
    ],
    imports: [
        RouterModule.forRoot(routes),
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        LWFCommonModule,
        ServicesModule,
        MaterialDesignModule,
        NgxPageScrollModule,
        LocalizationModule.forRoot(ConfigurationUtil.localeConf()),
    ],
    providers: [
        AuthenticationService,
        LoggedInGuard,
    ],
    bootstrap: [AppComponent]
})
export class AppModule {

    constructor(public l10nLoader: L10nLoader) {
        this.l10nLoader.load()
            .catch(error => {
            console.log(error)
        });
    }

}
