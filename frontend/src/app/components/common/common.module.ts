import {NgModule, ModuleWithProviders} from "@angular/core";
import {RouterModule} from "@angular/router";
import {MaterialDesignModule} from "../../material.module";
import {HttpClientModule} from "@angular/common/http";
import {
    FooterComponent,
    LogoutDirective,
    ProgressSpinnerComponent,
    VerificationWarningLauncher,
} from "./common.component";
import {AvatarImageComponent} from "./avatar/avatarImage.component";
import {ServicesModule} from "../../services/services.module";
import {ToolBarComponent} from "./toolbar/toolbar.component";
import {ProfileInfoComponent, AvatarErrorDialogComponent} from './profile-info/profile-info.component';
import {QRCodeModule} from "angular2-qrcode";
import {GeocompleteComponent} from "./geocomplete/geocomplete.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ChatComponent} from "../chat/chat.component";
import {MessageComponent} from "../chat/message.component";
import {LightboxModule} from "angular2-lightbox";
import {StarRatingConfigService, StarRatingModule} from 'angular-star-rating';
import {FeedbackComponent} from './feedback/feedback.component';
import {CommonModule} from "@angular/common";
import {SignupMobileDialogComponent} from "../../pages/signup/signup.component";
import {ForwarderCardComponent} from "./forwarder-card-dialog/forwarder-card-dialog.component";
import {BuyerCardComponent} from "./buyer-card-dialog/buyer-card-dialog.component";
import {LoginMobileDialogComponent} from "../../pages/login/login.component";
import {DepositDialogComponent} from "../../pages/wallets/wallets.component";
import {PipeModule} from "./pipe/pipe.module";
import {VerificationWarningComponent} from "./verification-warning-dialog/verification-warning-dialog.component";
import {ScriptWrapperComponent} from "./script-wrapper/script-wrapper.component";
import {LocaleValidationModule, LocalizationModule} from "angular-l10n";
import {ConfigurationUtil} from "../../utils/config";
import {FileUploaderComponent} from "./file-uploader/file-uploader.component";

@NgModule({
    declarations: [
        ToolBarComponent,
        FooterComponent,
        ProgressSpinnerComponent,
        AvatarImageComponent,
        LogoutDirective,
        ProfileInfoComponent,
        GeocompleteComponent,
        ChatComponent,
        MessageComponent,
        FeedbackComponent,
        SignupMobileDialogComponent,
        LoginMobileDialogComponent,
        ForwarderCardComponent,
        BuyerCardComponent,
        DepositDialogComponent,
        VerificationWarningComponent,
        VerificationWarningLauncher,
        ScriptWrapperComponent,
        FileUploaderComponent,
        AvatarErrorDialogComponent
    ],
    imports: [
        HttpClientModule,
        RouterModule,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MaterialDesignModule,
        LightboxModule,
        StarRatingModule.forRoot(),
        QRCodeModule,
        ServicesModule,
        PipeModule,
        LocalizationModule.forRoot(ConfigurationUtil.localeConf()),
    ],
    exports: [
        ToolBarComponent,
        FooterComponent,
        ProgressSpinnerComponent,
        AvatarImageComponent,
        ProfileInfoComponent,
        QRCodeModule,
        GeocompleteComponent,
        ChatComponent,
        MessageComponent,
        FeedbackComponent,
        StarRatingModule,
        FeedbackComponent,
        SignupMobileDialogComponent,
        LoginMobileDialogComponent,
        ForwarderCardComponent,
        BuyerCardComponent,
        VerificationWarningComponent,
        VerificationWarningLauncher,
        ScriptWrapperComponent,
        FileUploaderComponent,
        AvatarErrorDialogComponent
    ],
    entryComponents: [
        FeedbackComponent,
        SignupMobileDialogComponent,
        ForwarderCardComponent,
        BuyerCardComponent,
        LoginMobileDialogComponent,
        DepositDialogComponent,
        VerificationWarningComponent,
        AvatarErrorDialogComponent
    ],
    providers: [
        StarRatingConfigService
    ]
})
export class LWFCommonModule {
}