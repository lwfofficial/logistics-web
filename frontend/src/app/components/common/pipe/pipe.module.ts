import {NgModule} from "@angular/core";
import {
    CountryNamePipe,
    CurrencySymbolPipe,
    FileTypeIconPipe,
    GoodTypesPipe,
    GoodValueCurrencyPipe,
    GoodValuePipe,
    IssueDescriptionPipe,
    MaxGoodValuesPipe,
    MaxSizePipe,
    MaxWeightPipe,
    ProfileInfoServiceImgPipe,
    ProfileInfoServiceNamePipe,
    ServiceIconPipe,
    ServiceNamePipe,
    ServiceShortNamePipe,
    ShippingModePipe,
    SettingsNamePipe,
    ConvertWeightPipe,
    CurrencyFullNamePipe,
} from "./pipes";


let COMPONENTS = [
    ServiceIconPipe,
    ServiceNamePipe,
    ServiceShortNamePipe,
    ProfileInfoServiceNamePipe,
    MaxWeightPipe,
    MaxSizePipe,
    MaxGoodValuesPipe,
    GoodTypesPipe,
    CurrencySymbolPipe,
    CountryNamePipe,
    ShippingModePipe,
    IssueDescriptionPipe,
    FileTypeIconPipe,
    ProfileInfoServiceImgPipe,
    GoodValuePipe,
    GoodValueCurrencyPipe,
    SettingsNamePipe,
    ConvertWeightPipe,
    CurrencyFullNamePipe,
];


@NgModule({
    declarations: COMPONENTS,
    imports: [],
    exports: COMPONENTS,
})
export class PipeModule {
}