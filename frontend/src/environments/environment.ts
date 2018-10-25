// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import {VERSION} from "./version";

export const environment = {
    production: false,
    server: {
        protocol: 'http',
        host: window.location.hostname,
        port: 8000,
        apiPath: ''
    },
    google: {
        mapsApiKey: 'PUTHERE',
        captchaSiteKey: 'PUTHERE',
    },
    verifyMobileNumber: false,
    paypal: {
        accessKey: 'PUTHERE',
        sandbox: true
    },
    enableAnalytics: false,
    version: VERSION,
};
