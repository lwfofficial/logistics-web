import {MatIconRegistry} from "@angular/material";
import {DomSanitizer} from "@angular/platform-browser";

export class IconsUtility {

    static createSVGIcons(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
        iconRegistry.addSvgIcon(
            'btc-currency',
            sanitizer.bypassSecurityTrustResourceUrl('assets/images/wallet/btc-icon.svg'));
        iconRegistry.addSvgIcon(
            'eth-currency',
            sanitizer.bypassSecurityTrustResourceUrl('assets/images/wallet/Icon-Eth.svg'));
        iconRegistry.addSvgIcon(
            'lwf-currency',
            sanitizer.bypassSecurityTrustResourceUrl('assets/images/wallet/lwf-icon.svg'));
        iconRegistry.addSvgIcon(
            'eur-currency',
            sanitizer.bypassSecurityTrustResourceUrl('assets/images/wallet/Icon-Eur.svg'));
        iconRegistry.addSvgIcon(
            'usd-currency',
            sanitizer.bypassSecurityTrustResourceUrl('assets/images/wallet/Icon-Usd.svg'));
    }
}