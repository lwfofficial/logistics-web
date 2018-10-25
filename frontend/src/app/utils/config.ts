import {L10nConfig, ProviderType, StorageStrategy} from "angular-l10n";

const l10nConfig: L10nConfig = {
    locale: {
        languages: [
            {code: 'en', dir: 'ltr'},
        ],
        defaultLocale: {languageCode: 'en', countryCode: 'US', numberingSystem: 'latn' },
        currency: 'USD',
        storage: StorageStrategy.Cookie
    },
    translation: {
        providers: [
            {type: ProviderType.Static, prefix: './assets/locale/locale-'}
        ],
        caching: true,
        composedKeySeparator: '.',
        missingValue: 'No key',
    }
};


export class ConfigurationUtil {

    static localeConf() {
        return l10nConfig
    }
}