import {AfterViewInit, Component, OnInit} from "@angular/core";
import {AuthenticationService} from "../../../services/authentication.service";
import {ProfilePublisher, UserService} from "../../../services/user.service";
import {Router} from "@angular/router";

@Component({
    selector: 'tool-bar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['../common.component.scss'],
    providers: [
        AuthenticationService,
        UserService
    ],
})
export class ToolBarComponent implements OnInit, AfterViewInit {

    profile;
    profileIsForwarder = false;
    notifications = [];
    unreadNotification = false;
    disabled = false;
    newNotifications = [];
    subProfile: any;

    constructor(private router: Router,
                private authenticationService: AuthenticationService,
                private userService: UserService,
                private profilePublisher: ProfilePublisher) {

    }

    ngOnInit(): void {
        this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
            this.profile = profile;
            if (this.userService.isForwarder(this.profile)) {
                this.profileIsForwarder = true;
            } else {
                this.profileIsForwarder = false;
            }
        });
    }

    ngAfterViewInit(): void {
        this.initProfile();
        this.checkNotification();
        setInterval(() => {
            this.checkNotification();
        }, 1000 * 60);
    }

    isLoggedIn() {
        return this.authenticationService.isLoggedIn();
    }

    initProfile() {
        if (this.isLoggedIn()) {
            this.userService
                .getUserProfile()
                .then((response: any) => {
                    this.profileIsForwarder = false;
                    if (response.success && response.profile) {
                        this.profile = response.profile;
                        if (this.userService.isForwarder(this.profile)) {
                            this.profileIsForwarder = true;
                        }
                    }
                });
        }
    }

    goToHelp() {
        window.open('https://www.lwf.io/en#faq', '_blank');
    }

    checkNotification() {
        if (this.isLoggedIn()) {
            this.userService
                .getUserNotifications()
                .subscribe((response: any) => {
                    if (response.success) {
                        this.parseNotification(response.notifications);
                    }
                })
        }
    }

    logout() {
        this.authenticationService.logout();
        this.profile = null;
        this.profileIsForwarder = false;
    }

    notificationAction(notification) {
        if (notification.link) {
            this.router.navigate(notification.link);
        }
    }

    setNotificationsAsRead() {
        this.unreadNotification = false;
        this.userService
            .setNotificationAsRead()
            .subscribe((response: any) => {
            });
    }

    parseNotification(notifications) {
        this.unreadNotification = false;
        this.notifications = notifications.map(notification => {
            if (!notification.alertNotified) {
                this.unreadNotification = true;
            }
            let link = notification.alertData.split("|");
            let text = link.shift();
            return {
                id: notification.id,
                text: text,
                link: link,
                unread: notification.alertNotified
            }
        });

        this.newNotifications = notifications.filter(notification => !notification.alertNotified);
    }
}