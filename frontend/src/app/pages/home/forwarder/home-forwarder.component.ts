import {AfterViewInit, Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {MatDialog, MatPaginator, MatSort, MatTableDataSource} from "@angular/material";
import {ProfilePublisher, UserService} from "../../../services/user.service";
import {Order, ORDER_STATUS, OrderService} from "../../../services/order.service";
import {startWith} from "rxjs/operators/startWith";
import {catchError} from "rxjs/operators/catchError";
import {merge} from "rxjs/observable/merge";
import {map} from "rxjs/operators/map";
import {of as observableOf} from "rxjs/observable/of";
import {switchMap} from "rxjs/operators/switchMap";
import {ProgressSpinnerComponent} from "../../../components/common/common.component";
import {FormBuilder} from "@angular/forms";
import {Service, ServiceService} from "../../../services/service.service";
import {GeocompleteComponent} from "../../../components/common/geocomplete/geocomplete.component";
import {Router} from "@angular/router";
import {EventService} from "../../../services/event.service";
import {HttpClient} from "@angular/common/http";
import {BuyerCardComponent} from "../../../components/common/buyer-card-dialog/buyer-card-dialog.component";
import { animate, state, style, transition, trigger } from '@angular/animations';
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";
import {WalletService} from "../../../services/wallet.service";


@Component({
    selector: 'app-orders',
    templateUrl: './home-forwarder.component.html',
    styleUrls: ['../../page.component.scss',
                '../home.component.scss',
                '../buyer/home-buyer.component.scss',
                './home-forwarder.component.scss'],
    animations: [
        trigger('detailExpand', [
            state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
            state('expanded', style({ height: '*', visibility: 'visible', backgroundColor: '#f0f1f3'})),
            transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
    ],
    encapsulation: ViewEncapsulation.None,
})
export class HomeForwarderComponent implements OnInit, AfterViewInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('fromSearch') fromSearch: GeocompleteComponent;
    @ViewChild('toSearch') toSearch: GeocompleteComponent;
    @ViewChild(MatPaginator) ordersPaginator: MatPaginator;
    @ViewChild(MatSort) ordersSort: MatSort;
    @ViewChild('orderSpinner') ordersSpinner: ProgressSpinnerComponent;
    @ViewChild('eventsTable', {read: MatSort}) eventsSort: MatSort;
    @ViewChild('eventsPaginator') eventsPaginator: MatPaginator;
    @ViewChild('eventSpinner') eventsSpinner: ProgressSpinnerComponent;
    @ViewChild(MatPaginator) feedbackPaginator: MatPaginator;


    ordersDisplayedColumns = ['id', 'type', 'dateCreated', 'state', 'price', 'view-details'];
    eventsDisplayedColumns = ['name', 'description', 'type', 'dateCreated'];
    profile;
    wallet;
    countries = [];
    forwarders = [];
    orders = new MatTableDataSource();
    events = new MatTableDataSource();
    ordersCount = 0;
    eventsCount = 0;
    maxPerPage = 5;
    graphOptions = {};
    feedbacks;
    length;
    pageSize = 3;

    services: Service[];
    subProfile: any;

    isExpansionDetailRow = (index, row) => row.hasOwnProperty('detailRow');

    constructor(private router: Router,
                private userService: UserService,
                private localeService: LocaleService,
                private profilePublisher: ProfilePublisher,
                private orderService: OrderService,
                private eventService: EventService,
                private serviceService: ServiceService,
                private walletService: WalletService,
                private fb: FormBuilder,
                private http: HttpClient,
                public dialog: MatDialog) {
}

    ngOnInit() {
        this.orders = new MatTableDataSource<Order>([]);
        this.events = new MatTableDataSource<Event>([]);
        this.updateUserProfile();
        this.getServices();
        this.subProfile = this.profilePublisher.Stream.subscribe(profile => {
            this.profile = profile;
        });
    }

    ngAfterViewInit(): void {
        this.ordersSort.sortChange.subscribe(() => this.ordersPaginator.pageIndex = 0);
        this.eventsSort.sortChange.subscribe(() => this.eventsPaginator.pageIndex = 0);
        this.updateOrderTable();
        this.updateEventTable();
        this.initGraph();
    }

    updateOrderTable() {
        merge(this.ordersSort.sortChange, this.ordersPaginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.ordersSpinner.show();
                    return this.orderService
                        .getForwarderOrders(
                            this.ordersSort.active,
                            this.ordersSort.direction,
                            this.ordersPaginator.pageIndex + 1,
                            this.maxPerPage
                        );
                }),
                map((data: any) => {
                    this.ordersSpinner.hide();
                    this.ordersCount = data.ordersCount;
                    return data.orders;
                }),
                catchError(() => {
                    this.ordersSpinner.hide();
                    return observableOf([]);
                })
            ).subscribe(data => {
                const rows = [];
                data.forEach(order => rows.push(order, {
                    detailRow: true,
                    order: order
                }));
                this.orders.data = rows;
            });
    }

    updateEventTable() {
        merge(this.eventsSort.sortChange, this.eventsPaginator.page)
            .pipe(
                startWith({}),
                switchMap(() => {
                    this.eventsSpinner.show();
                    return this.eventService
                        .getEvents(
                            this.eventsSort.active,
                            this.eventsSort.direction,
                            this.eventsPaginator.pageIndex + 1,
                            this.maxPerPage
                        );
                }),
                map((data: any) => {
                    this.eventsSpinner.hide();
                    this.eventsCount = data.eventsCount;
                    return data.events;
                }),
                catchError(() => {
                    this.eventsSpinner.hide();
                    return observableOf([]);
                })
            ).subscribe(data => this.events.data = data);
    }

    goToOrderDetail(order) {
        if (order.state === ORDER_STATUS.new) {
            this.router.navigate([`orders/new/${order.service.type}/`, order.service.id, order.id]);
        } else {
            this.router.navigate(['orders/forwarder', order.id]);
        }
    }

    openBuyerCard(profile) {
        let dialogWidth;
        let dialogHeight;
        if (window.innerWidth < 769 || window.innerHeight < 769) {
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

    private updateUserProfile() {
        this.userService
            .getUserProfile()
            .then((response: any) => {
                if (response.success && response.profile) {
                    this.currency = this.localeService.getCurrentCurrency();
                    this.defaultLocale = this.localeService.getCurrentLocale();
                    this.lang = this.localeService.getCurrentLanguage();
                    this.profile = response.profile;
                    this.wallet = response.wallet;
                    this.getFeedbackList();
                }
            });
    }

    private getServices() {
        this.serviceService
            .getServices()
            .subscribe((response: any) => {
                if (response.success) {
                    this.services = response.services;
                }
            }, error => {
                console.log(error);
            })
    }

    private getFeedbackList(){
        this.userService
            .getForwarderFeedbacks(1, this.pageSize, this.profile.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.length = response.feedbacksCount;
                    this.feedbacks = response.feedbacks;
                }
            });
    }

    changePage(event) {
        this.userService
            .getForwarderFeedbacks(event.pageIndex + 1, event.pageSize, this.profile.id)
            .subscribe((response: any) => {
                if (response.success) {
                    this.length = response.feedbacksCount;
                    this.feedbacks = response.feedbacks;
                }
            })
    }

    openOrderPaymentReportPdf(orderId) {
        let newWindow = window.open("", "_blank");
        this.walletService
            .getForwarderOrderPaymentReport(orderId)
            .subscribe((response: Blob) => {
                    let fileURL = URL.createObjectURL(response);
                    newWindow.location.href = fileURL;
                },
                error => {
                    console.log(error);
                });
    }

    
    private initGraph() {
        this.graphOptions = {

            rangeSelector: {
                selected: 1
            },

            title: {
                text: 'AAPL Stock Price'
            },

            series: [{
                name: 'AAPL',
                data: [
                    [1300320000000, 47.81],
                    [1300406400000, 47.24],
                    [1300665600000, 48.47],
                    [1300752000000, 48.74],
                    [1300838400000, 48.46],
                    [1300924800000, 49.28],
                    [1301011200000, 50.22],
                    [1301270400000, 50.06],
                    [1301356800000, 50.14],
                    [1301443200000, 49.80],
                    [1301529600000, 49.79],
                    [1301616000000, 49.22],
                    [1301875200000, 48.74],
                    [1301961600000, 48.41],
                    [1302048000000, 48.29],
                    [1302134400000, 48.30],
                    [1302220800000, 47.87],
                    [1302480000000, 47.26],
                    [1302566400000, 47.49],
                    [1302652800000, 48.02],
                    [1302739200000, 47.49],
                    [1302825600000, 46.78],
                    [1303084800000, 47.41],
                    [1303171200000, 48.27],
                    [1303257600000, 48.92],
                    [1303344000000, 50.10],
                    [1303689600000, 50.43],
                    [1303776000000, 50.06],
                    [1303862400000, 50.02],
                    [1303948800000, 49.54],
                    [1304035200000, 50.02],
                    [1304294400000, 49.47],
                    [1304380800000, 49.74],
                    [1304467200000, 49.94],
                    [1304553600000, 49.54],
                    [1304640000000, 49.52],
                    [1304899200000, 49.66],
                    [1304985600000, 49.92],
                    [1305072000000, 49.60],
                    [1305158400000, 49.51],
                    [1305244800000, 48.64],
                    [1305504000000, 47.61],
                    [1305590400000, 48.02],
                    [1305676800000, 48.55],
                    [1305763200000, 48.65],
                    [1305849600000, 47.89],
                    [1306108800000, 47.77],
                    [1306195200000, 47.46],
                    [1306281600000, 48.11],
                    [1306368000000, 47.86],
                    [1306454400000, 48.20],
                    [1306800000000, 49.69],
                    [1306886400000, 49.36],
                    [1306972800000, 49.44],
                    [1307059200000, 49.06],
                    [1307318400000, 48.29],
                    [1307404800000, 47.43],
                    [1307491200000, 47.46],
                    [1307577600000, 47.36],
                    [1307664000000, 46.56],
                    [1307923200000, 46.66],
                    [1308009600000, 47.49],
                    [1308096000000, 46.68],
                    [1308182400000, 46.45],
                    [1308268800000, 45.75],
                    [1308528000000, 45.05],
                    [1308614400000, 46.47],
                    [1308700800000, 46.09],
                    [1308787200000, 47.32],
                    [1308873600000, 46.62],
                    [1309132800000, 47.43],
                    [1309219200000, 47.89],
                    [1309305600000, 47.72],
                    [1309392000000, 47.95],
                    [1309478400000, 49.04],
                    [1309824000000, 49.92],
                    [1309910400000, 50.25],
                    [1309996800000, 51.03],
                    [1310083200000, 51.39],
                    [1310342400000, 50.57],
                    [1310428800000, 50.54],
                    [1310515200000, 51.15],
                    [1310601600000, 51.11],
                    [1310688000000, 52.13],
                    [1310947200000, 53.40],
                    [1311033600000, 53.84],
                    [1311120000000, 55.27],
                    [1311206400000, 55.33],
                    [1311292800000, 56.19],
                    [1311552000000, 56.93],
                    [1311638400000, 57.63],
                    [1311724800000, 56.08],
                    [1311811200000, 55.97],
                    [1311897600000, 55.78],
                    [1312156800000, 56.68],
                    [1312243200000, 55.46],
                    [1312329600000, 56.08],
                    [1312416000000, 53.91],
                    [1312502400000, 53.37],
                    [1312761600000, 50.46],
                    [1312848000000, 53.43],
                    [1312934400000, 51.96],
                    [1313020800000, 53.39],
                    [1313107200000, 53.86],
                    [1313366400000, 54.77],
                    [1313452800000, 54.35],
                    [1313539200000, 54.35],
                    [1313625600000, 52.29],
                    [1313712000000, 50.86],
                    [1313971200000, 50.92],
                    [1314057600000, 53.37],
                    [1314144000000, 53.74],
                    [1314230400000, 53.39],
                    [1314316800000, 54.80],
                    [1314576000000, 55.71],
                    [1314662400000, 55.71],
                    [1314748800000, 54.98],
                    [1314835200000, 54.43],
                    [1314921600000, 53.44],
                    [1315267200000, 54.25],
                    [1315353600000, 54.85],
                    [1315440000000, 54.88],
                    [1315526400000, 53.93],
                    [1315785600000, 54.28],
                    [1315872000000, 54.95],
                    [1315958400000, 55.61],
                    [1316044800000, 56.14],
                    [1316131200000, 57.21],
                    [1316390400000, 58.80],
                    [1316476800000, 59.06],
                    [1316563200000, 58.88],
                    [1316649600000, 57.40],
                    [1316736000000, 57.76],
                    [1316995200000, 57.60],
                    [1317081600000, 57.04],
                    [1317168000000, 56.72],
                    [1317254400000, 55.80],
                    [1317340800000, 54.47],
                    [1317600000000, 53.51],
                    [1317686400000, 53.21],
                    [1317772800000, 54.04],
                    [1317859200000, 53.91],
                    [1317945600000, 52.83],
                    [1318204800000, 55.54],
                    [1318291200000, 57.18],
                    [1318377600000, 57.46],
                    [1318464000000, 58.35],
                    [1318550400000, 60.29],
                    [1318809600000, 60.00],
                    [1318896000000, 60.32],
                    [1318982400000, 56.95],
                    [1319068800000, 56.47],
                    [1319155200000, 56.12],
                    [1319414400000, 57.97],
                    [1319500800000, 56.82],
                    [1319587200000, 57.23],
                    [1319673600000, 57.81],
                    [1319760000000, 57.85],
                    [1320019200000, 57.83],
                    [1320105600000, 56.64],
                    [1320192000000, 56.77],
                    [1320278400000, 57.58],
                    [1320364800000, 57.18],
                    [1320624000000, 57.10],
                    [1320710400000, 58.03],
                    [1320796800000, 56.47],
                    [1320883200000, 55.03],
                    [1320969600000, 54.95],
                    [1321228800000, 54.18],
                    [1321315200000, 55.55],
                    [1321401600000, 54.97],
                    [1321488000000, 53.92],
                    [1321574400000, 53.56],
                    [1321833600000, 52.72],
                    [1321920000000, 53.79],
                    [1322006400000, 52.43],
                    [1322179200000, 51.94],
                    [1322438400000, 53.73],
                    [1322524800000, 53.31],
                    [1322611200000, 54.60],
                    [1322697600000, 55.42],
                    [1322784000000, 55.67],
                    [1323043200000, 56.14],
                    [1323129600000, 55.85],
                    [1323216000000, 55.58],
                    [1323302400000, 55.81],
                    [1323388800000, 56.23],
                    [1323648000000, 55.98],
                    [1323734400000, 55.54],
                    [1323820800000, 54.31],
                    [1323907200000, 54.13],
                    [1323993600000, 54.43],
                    [1324252800000, 54.60],
                    [1324339200000, 56.56],
                    [1324425600000, 56.64],
                    [1324512000000, 56.94],
                    [1324598400000, 57.62],
                    [1324944000000, 58.08],
                    [1325030400000, 57.52],
                    [1325116800000, 57.87],
                    [1325203200000, 57.86],
                    [1325548800000, 58.75],
                    [1325635200000, 59.06],
                    [1325721600000, 59.72],
                    [1325808000000, 60.34],
                    [1326067200000, 60.25],
                    [1326153600000, 60.46],
                    [1326240000000, 60.36],
                    [1326326400000, 60.20],
                    [1326412800000, 59.97],
                    [1326758400000, 60.67],
                    [1326844800000, 61.30],
                    [1326931200000, 61.11],
                    [1327017600000, 60.04],
                    [1327276800000, 61.06],
                    [1327363200000, 60.06],
                    [1327449600000, 63.81],
                    [1327536000000, 63.52],
                    [1327622400000, 63.90],
                    [1327881600000, 64.72],
                    [1327968000000, 65.21],
                    [1328054400000, 65.17],
                    [1328140800000, 65.02],
                    [1328227200000, 65.67],
                    [1328486400000, 66.28],
                    [1328572800000, 66.98],
                    [1328659200000, 68.10],
                    [1328745600000, 70.45],
                    [1328832000000, 70.49],
                    [1329091200000, 71.80],
                    [1329177600000, 72.78],
                    [1329264000000, 71.10],
                    [1329350400000, 71.74],
                    [1329436800000, 71.73],
                    [1329782400000, 73.55],
                    [1329868800000, 73.29],
                    [1329955200000, 73.77],
                ],
                tooltip: {
                    valueDecimals: 2
                }
            }]
        }
    }

}
