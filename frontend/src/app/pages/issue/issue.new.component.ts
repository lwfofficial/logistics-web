import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {Order, OrderService} from "../../services/order.service";
import {UserService} from "../../services/user.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {IssueService} from "../../services/issue.service";
import {Currency, DefaultLocale, Language, LocaleService} from "angular-l10n";

@Component({
    selector: 'app-issue',
    templateUrl: './templates/issue.new.component.html',
    styleUrls: ['./issue.component.scss',
        '../page.component.scss',
        '../orders/orders.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class IssueNewPageComponent implements OnInit {
    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    order: any;
    profile: any;

    newIssueForm: FormGroup;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private orderService: OrderService,
                private userService: UserService,
                private localeService: LocaleService,
                private issueService: IssueService) {

        this.newIssueForm = new FormGroup({
            type: new FormControl('', [Validators.required]),
            description: new FormControl('', [Validators.required]),
        });
    }

    ngOnInit() {
        this.route
            .paramMap
            .subscribe((params: ParamMap) => {
                let isBuyer = params.get('isBuyer') === 'buyer';
                let getOrder = isBuyer ? this.orderService.getOrder(params.get('orderId')) :
                    this.orderService.getForwarderOrder(params.get('orderId'));
                getOrder
                    .subscribe((response: any) => {
                        if (response.success) {
                            this.order = response.order;
                        }
                    });
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
    }

    back() {
        if (this.userService.isForwarder(this.profile)) {
            this.router.navigate(['orders/forwarder', this.order.id]);
        } else {
            this.router.navigate(['orders/buyer', this.order.id]);
        }
    }

    createIssue({value, valid}: { value: any, valid: boolean }) {
        if (valid) {
            value.order = this.order.id;
            this.issueService
                .createIssue(value)
                .subscribe((response: any) => {
                        if (response.success) {
                            this.router.navigate(['issue', response.issueId]);
                        }
                    },
                    error => {
                        console.log(error);
                    });
        }
    }

}