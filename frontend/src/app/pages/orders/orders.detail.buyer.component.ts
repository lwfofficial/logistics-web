import {Component, OnInit, Pipe, PipeTransform, ViewEncapsulation} from "@angular/core";
import {Order, OrderService, SHIPPING_MODE} from "../../services/order.service";
import {ActivatedRoute, ParamMap} from "@angular/router";
import {ProfilePublisher, UserService} from "../../services/user.service";
import {SERVICE_TYPE} from "../../services/service.service";
import {ForwarderCardComponent} from "../../components/common/forwarder-card-dialog/forwarder-card-dialog.component";
import {MatDialog} from "@angular/material";
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";
import {CurrencyService} from "../../services/currency.service";

@Component({
    selector: 'app-order-new',
    templateUrl: './templates/orders.detail.buyer.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OrderDetailBuyerPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    order;
    profile: any;
    isP2POrder = false;
    isCLLOrder = false;
    goodValue;
    subProfile: any;

    constructor(private route: ActivatedRoute,
                private userService: UserService,
                private localeService: LocaleService,
                private profilePublisher: ProfilePublisher,
                private orderService: OrderService,
                private currencyService: CurrencyService,
                public dialog: MatDialog) {
    }

    sortOrderNotes() {
        this.order.notes = this.order.notes.sort((a, b) => {
            if (a.id < b.id) {
                return 1;
            }
            if (a.id > b.id) {
                return -1;
            }
            return 0;
        });
    }

    ngOnInit() {
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.orderService
                .getOrder(params.get('orderId'))
                .subscribe((response: any) => {
                        if (response.success) {
                            this.order = response.order;
                            this.sortOrderNotes();
                            this.isP2POrder = this.order.service.type === SERVICE_TYPE.p2p;
                            this.isCLLOrder = this.order.service.type === SERVICE_TYPE.cll;
                            this.convertGoodValue(this.order.goodValue);
                        }
                    },
                    (error: any) => {
                        console.log(error);
                    });
            this.userService
                .getUserProfile()
                .then((response: any) => {
                    if (response.success) {
                        this.currency = this.localeService.getCurrentCurrency();
                        this.defaultLocale = this.localeService.getCurrentLocale();
                        this.lang = this.localeService.getCurrentLanguage();
                        this.profile = response.profile;

                    }
                })
                .catch(error => {
                    console.log((error));
                });
            this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
                this.profile = profile;
            });
        });
    }

    convertGoodValue(amount){
        if (this.order.currency === this.profile.currencySetting){
            this.goodValue = amount;
        } else {
            if (this.order.currency === 'USD'){
                this.currencyService.lwfBundleToEuro(amount)
                    .then((response: any) => {
                        if (response.success) {
                            return this.goodValue = response.value;
                        }
                    }, error => {
                        console.log(error);
                    })
            } else {
                this.currencyService.EuroToDollars(amount)
                    .then((response: any) => {
                        if (response.success) {
                            return this.goodValue = response.value;
                        }
                    }, error => {
                        console.log(error);
                    })
            }
        }
    }
    openForwarderCard(service, readOnly) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769 || window.innerHeight < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '90%';
            dialogHeight = '740px';
        }
        this.dialog
            .open(ForwarderCardComponent,
                {
                    data: {forwarder: service, readOnly},
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight,
                    panelClass: 'forwarder-dialog'
                })
            .componentInstance;
    }
}