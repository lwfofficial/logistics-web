import {VERSION} from "./version";

export const environment = {
    production: true,
    server: {
        protocol: 'https',
        host: window.location.hostname,
        port: 443,
        apiPath: 'rest/'
    },
    google: {
        mapsApiKey: 'PUTHERE',
        captchaSiteKey: 'PUTHERE',
    },
    verifyMobileNumber: true,
    paypal: {
        accessKey : 'PUTHERE',
        sandbox: true
    },
    enableAnalytics: false,
    version: VERSION,
};
