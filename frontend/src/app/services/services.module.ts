import {AuthenticationService, LoggedInGuard} from "./authentication.service";
import {NgModule} from "@angular/core";
import {HttpClientModule} from "@angular/common/http";
import {ProfilePublisher, UserService} from "./user.service";
import {WalletService} from "./wallet.service";
import {ServiceService} from "./service.service";
import {GeocodeService} from "./geocodeService";
import {OrderService} from "./order.service";
import {EventService} from "./event.service";
import {IssueService} from "./issue.service";
import {ChatService} from "./chat.service";

@NgModule({
    imports: [
        HttpClientModule,
    ],
    providers: [
        AuthenticationService,
        UserService,
        WalletService,
        ServiceService,
        OrderService,
        EventService,
        LoggedInGuard,
        GeocodeService,
        IssueService,
        ChatService,
        ProfilePublisher
    ]
})
export class ServicesModule {
}