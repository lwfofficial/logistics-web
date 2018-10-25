import {Component, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {AuthenticationService} from "../../services/authentication.service";
import {ProgressSpinnerComponent} from "../../components/common/common.component";
import {Language, DefaultLocale, Currency, LocaleService} from 'angular-l10n';

@Component({
    selector: 'app-withdraw-confirm',
    templateUrl: './withdraw-confirm.component.html',
    styleUrls: ['../page.component.scss', './withdraw-confirm.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class WithdrawConfirmPageComponent implements OnInit {

    @Language() lang: string;
    @DefaultLocale() defaultLocale: string;
    @Currency() currency: string;

    @ViewChild('withdrawConfirmSpinner') withdrawConfirmSpinner: ProgressSpinnerComponent;

    hashKey;
    loading;
    error;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private authService: AuthenticationService,
                public locale: LocaleService) {
    }

    ngOnInit() {
        this.loading = true;
        this.error = false;
        this.withdrawConfirmSpinner.show();
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.hashKey = params.get('hashKey');
            this.authService
                .withdrawConfirm(this.hashKey)
                .then((response) => {
                    if (response.success) {
                        //do nothing
                    } else {
                        this.error = true;
                    }
                    this.loading = false;
                    this.withdrawConfirmSpinner.hide();
                })
                .catch(()=> {
                    this.error = true;
                    this.loading = false;
                    this.withdrawConfirmSpinner.hide();
                });
        });
    }
}