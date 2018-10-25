import {Component, OnInit, ViewChild} from '@angular/core';
import {ToolBarComponent} from "./components/common/toolbar/toolbar.component";
import {Router} from '@angular/router';
import {environment} from "../environments/environment";
import {ProfilePublisher, UserService} from "./services/user.service";
import {AuthenticationService} from "./services/authentication.service";
import {Currency, DefaultLocale, Language} from "angular-l10n";
import {ConfigurationService} from "./services/configuration.service";

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    providers: [ProfilePublisher, ConfigurationService]
})
export class AppComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild(ToolBarComponent) toolbar: ToolBarComponent;

    enableAnalytics = false;
    profileInterval;
    configuration;

    constructor(public router: Router,
                private authService: AuthenticationService,
                private userService: UserService,
                private configurationService: ConfigurationService,
                private profilePublisher: ProfilePublisher) {
        this.enableAnalytics = environment.enableAnalytics;
        this.router.events.subscribe( () => window.scrollTo(0, 0) );
    }

    ngOnInit(): void {
        this.getConfiguration();
        this.profileInterval = setInterval(()=>{
            this.refreshProfile();
        }, 30000);
    }

    getConfiguration() {
        this.configurationService.getConfiguration()
            .then((response: any) => {
                if (response.success) {
                    this.configuration = btoa(JSON.stringify(response.configuration));
                    localStorage.setItem('configuration', this.configuration);
                }
            }).catch((error) => {
                console.log(error);
        });
    }

    refreshProfile() {
        if (this.authService.isLoggedIn()) {
            this.userService.getUserProfile()
                .then((response)=> {
                    if (response.success) {
                        this.profilePublisher.Stream.emit(response.profile);
                    }
                });
        }
    }
}
