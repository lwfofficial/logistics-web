import {Component, OnInit, ViewEncapsulation} from "@angular/core";
import {ActivatedRoute, ParamMap} from "@angular/router";
import {SERVICE_TYPE} from "../../services/service.service";
import {Order, OrderService} from "../../services/order.service";
import {ProfilePublisher, UserService} from "../../services/user.service";
import {BuyerCardComponent} from "../../components/common/buyer-card-dialog/buyer-card-dialog.component";
import {MatDialog} from "@angular/material";
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";
import {CurrencyService} from "../../services/currency.service";

@Component({
    selector: 'app-order-new',
    templateUrl: './templates/orders.detail.forwarder.component.html',
    styleUrls: ['../page.component.scss', './orders.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class OrdersDetailForwarderPageComponent implements OnInit {

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
                .getForwarderOrder(params.get('orderId'))
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

    openBuyerCard(profile) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769) {
            dialogWidth = '100vw';
            dialogHeight = '100vh';
        } else {
            dialogWidth = '90%';
            dialogHeight = '700px';
        }
        this.dialog
            .open(BuyerCardComponent,
                {
                    data: {buyer: profile},
                    width: dialogWidth,
                    height: dialogHeight,
                    maxWidth: dialogWidth,
                    maxHeight: dialogHeight,
                    panelClass: 'forwarder-dialog'
                })
            .componentInstance;
    }
}