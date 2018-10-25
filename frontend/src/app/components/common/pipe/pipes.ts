import {GOOD_TYPES, MAX_GOOD_VALUES, MAX_SIZE, MAX_WEIGHT, SERVICE_TYPE} from "../../../services/service.service";
import {Pipe, PipeTransform} from "@angular/core";
import {CountryService} from "../../../services/country.service";
import {SHIPPING_MODE} from "../../../services/order.service";

@Pipe({
    name: "serviceIcon"
})
export class ServiceIconPipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {
        if (value === 'p2p-freight') return 'assets/images/services/p2p_y.png';
        if (value === 'package-collecting') return 'assets/images/services/icn_collecting_y.png';
        if (value === 'express-delivery') return 'assets/images/services/icn_express_y.png';
        return ''
    }
}

@Pipe({
    name: "serviceName"
})
export class ServiceNamePipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {
        if (value === SERVICE_TYPE.p2p) return 'P2P Freight Forwarding';
        if (value === SERVICE_TYPE.cll) return 'Package Collecting';
        if (value === SERVICE_TYPE.exp) return 'Express Delivery';
        return ''
    }
}

@Pipe({
    name: "serviceShortName"
})
export class ServiceShortNamePipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {
        if (value === SERVICE_TYPE.p2p) return 'P2P';
        if (value === SERVICE_TYPE.cll) return 'PKG';
        if (value === SERVICE_TYPE.exp) return 'EXP';
        return ''
    }
}

@Pipe({
    name: "settingName"
})
export class SettingsNamePipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {
        if (value === 'currencySetting') return 'Currency';
        if (value === 'measuresSetting') return 'Units';
        if (value === 'languageSetting') return 'Language';
        return ''
    }
}

@Pipe({
    name: "profileInfoServiceName"
})
export class ProfileInfoServiceNamePipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {
        if (value === 'p2p-freight') return 'P2P Freight Forwarding';
        if (value === 'package-collecting') return 'Package Collecting';
        if (value === 'express-delivery') return 'Instant Delivery';
        return ''
    }
}

@Pipe({
    name: "profileInfoServiceImg"
})
export class ProfileInfoServiceImgPipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {
        if (value === 'p2p-freight') return 'assets/images/services/p2p_y.png';
        if (value === 'package-collecting') return 'assets/images/services/icn_collecting_y.png';
        if (value === 'express-delivery') return 'assets/images/services/icn_express_y.png';
        return ''
    }
}

@Pipe({
    name: "maxWeight"
})
export class MaxWeightPipe implements PipeTransform {

    transform(value: number, measuresSetting: any, ...args: any[]): any {
        if (measuresSetting === 'metric') {
            if (value === MAX_WEIGHT.TINY) return 'Tiny (up to 3kg)';
            if (value === MAX_WEIGHT.MEDIUM) return 'Medium (up to 7kg)';
            if (value === MAX_WEIGHT.HEAVY) return 'Heavy (7+ kg)';
            return ''
        }
        if (measuresSetting === 'imperial') {
            if (value === MAX_WEIGHT.TINY) return 'Tiny (up to 7lbs)';
            if (value === MAX_WEIGHT.MEDIUM) return 'Medium (up to 16lbs)';
            if (value === MAX_WEIGHT.HEAVY) return 'Heavy (16+ lbs)';
            return ''
        }
    }
}
@Pipe({
    name: "convertWeight"
})
export class ConvertWeightPipe implements PipeTransform {


    transform(value: number, measureSettings: any, ...args: any[]): any {
        if (measureSettings === 'imperial') {
            value = value/0.45359237;
            return value.toFixed(2) + 'lbs'
        }
        return value + 'Kg';
    }
}

@Pipe({
    name: "maxSize"
})
export class MaxSizePipe implements PipeTransform {

    transform(value: number, measuresSetting: any, ...args: any[]): any {
        if (measuresSetting === 'metric') {
            if (value === MAX_SIZE.SMALL) return 'Small (34x19x10cm)';
            if (value === MAX_SIZE.MEDIUM) return 'Medium (42x38x37cm)';
            if (value === MAX_SIZE.LARGE) return 'Large (55x45x42cm)';
            return ''
        }
        if (measuresSetting === 'imperial') {
            if (value === MAX_SIZE.SMALL) return 'Small (13x7x4in)';
            if (value === MAX_SIZE.MEDIUM) return 'Medium (16x15x14in)';
            if (value === MAX_SIZE.LARGE) return 'Large (22x18x16in)';
            return ''
        }
    }
}


@Pipe({
    name: "maxGoodValue"
})
export class MaxGoodValuesPipe implements PipeTransform {

    transform(value: number, ...args: any[]): any {

        if (value === MAX_GOOD_VALUES.LOW) return 'Low';
        if (value === MAX_GOOD_VALUES.MEDIUM) return 'Medium';
        if (value === MAX_GOOD_VALUES.HIGH) return 'High';
        return ''
    }
}

@Pipe({
    name: "goodValue"
})
export class GoodValuePipe implements PipeTransform {

    transform(value: any, currencySetting: any): any {
        if (!value || !currencySetting) {
            return '';
        }
        let numberValue = value;
        if (typeof value == 'string') {
            numberValue = Number(value)
        }
        return (currencySetting == 'EUR') ? `€ ${numberValue.toFixed(2)}` : `$ ${numberValue.toFixed(2)}`
    }
}

@Pipe({
    name: "goodValueSymbol"
})
export class GoodValueCurrencyPipe implements PipeTransform {

    transform(profile: any, ...args: any[]): any {
        return profile.currencySetting == 'EUR' ? '€' : '$'
    }
}


@Pipe({
    name: "goodType"
})
export class GoodTypesPipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {
        if (value === GOOD_TYPES.ELECTRONICS) return 'Electronics';
        if (value === GOOD_TYPES.CLOTHING) return 'Clothing';
        if (value === GOOD_TYPES.BEAUTY) return 'Beauty & Health';
        if (value === GOOD_TYPES.HOME) return 'Home';
        if (value === GOOD_TYPES.SPORTS) return 'Sports & Outdoors';
        return ''
    }
}

@Pipe({
    name: "countryName"
})
export class CountryNamePipe implements PipeTransform {

    constructor(private countryService: CountryService) {

    }

    transform(location: any, ...args: any[]): any {
        let country = this.countryService.getCountryByCode(location.countryCode);
        return country ? country.name : location.name;
    }
}

@Pipe({
    name: 'currencySymbol'
})
export class CurrencySymbolPipe implements PipeTransform {
    transform(value: any, ...args: any[]): any {
        if (value === 'BTC') return 'btc-currency';
        if (value === 'LWF') return 'lwf-currency';
        if (value === 'EUR') return 'eur-currency';
        if (value === 'USD') return 'usd-currency';
        return ''
    }

}
@Pipe({
    name: "currencyFullName"
})
export class CurrencyFullNamePipe implements PipeTransform {

    transform(profile: any, ...args: any[]): any {
        return profile.currencySetting == 'EUR' ? 'Euro' : 'US Dollars'
    }
}

@Pipe({
    name: "issueType"
})
export class IssueDescriptionPipe implements PipeTransform {

    transform(description: number, ...args: any[]): any {
        if (description == 1) {
            return 'Against policy'
        }
        if (description == 2) {
            return 'Not corresponding'
        }
        if (description == 3) {
            return 'Not received'
        }
        return 'Other issue';
    }
}

@Pipe({
    name: "shippingMode"
})
export class ShippingModePipe implements PipeTransform {

    transform(value: any, ...args: any[]): any {
        if (value === SHIPPING_MODE.CHEAP) return 'Cheap (15-30 days)';
        if (value === SHIPPING_MODE.STANDARD) return 'Standard (6-15 days)';
        if (value === SHIPPING_MODE.EXPRESS) return 'Express (3-6 days)';
        return ''
    }
}


@Pipe({
    name: "fileTypeIcon"
})
export class FileTypeIconPipe implements PipeTransform {

    types = {
        'docx': 'far fa-file-word fa-5x',
        'doc': 'far fa-file-word fa-5x',
        'odt': 'far fa-file-word fa-5x',
        'xlsx': 'far fa-file-excel fa-5x',
        'xls': 'far fa-file-excel fa-5x',
        'csv': 'far fa-file-excel fa-5x',
        'pptx': 'far fa-file-powerpoint fa-5x',
        'jpg': 'far fa-file-photo fa-5x',
        'jpeg': 'far fa-file-photo fa-5x',
        'pdf': 'far fa-file-pdf fa-5x',
        'zip': 'far fa-file-archive fa-5x',
    };

    transform(value: any, ...args: any[]): any {
        let extension = value.substr(value.lastIndexOf('.') + 1);
        if (this.isImage(extension)) {
            return value;
        }
        return this.types[extension] ? this.types[extension] : 'far fa-file-times fa-5x';
    }

    isImage(extension) {
        return ['jpeg', 'jpg', 'png'].includes(extension);
    }

}