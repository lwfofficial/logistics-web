import {Component, Input, OnInit, ViewEncapsulation} from "@angular/core";
import {DomSanitizer} from "@angular/platform-browser";
import * as url from "url";
import {Lightbox} from "angular2-lightbox";
import {Language, Currency, DefaultLocale} from "angular-l10n";

@Component({
    selector: 'chat-message',
    templateUrl: './templates/message.component.html',
    styleUrls: [
        './chat.component.scss',
        '../../pages/page.component.scss',
        '../../pages/orders/orders.component.scss'
    ],
    encapsulation: ViewEncapsulation.None
})
export class MessageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @Input() text: string;
    @Input() senderName: string;
    @Input() dateTime: string;
    @Input() avatarSrc: any;
    @Input() imageSrc: string;
    @Input() class: string;

    constructor() {

    }

    ngOnInit(): void {
        this.avatarSrc = this.avatarSrc ? this.avatarSrc : 'assets/images/account/default_avatar.png';
    }

}