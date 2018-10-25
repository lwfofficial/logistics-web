import {Injectable} from "@angular/core";


@Injectable()
export class CountryService {

    getCounties() {
        return COUNTRY_CODES
            .sort((a, b) => {
                if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) {
                    return 1;
                }
                if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) {
                    return -1;
                }
                return 0
            });
    }

    getCountryByCode(countryCode: string) {
        return COUNTRY_CODES.find(country => country.code == countryCode);
    }

    getCountryByName(countryName: string) {
        return COUNTRY_CODES.find(country => country.name == countryName);
    }

}

export const MAP_MARKERS = [
    {lat: 45.465454, lng: 9.186516, title: "Milan"},
    {lat: 41.9027835, lng: 12.4963655, title: "Rome"},
    {lat: 51.5073509, lng: -0.1277583, title: "London"},
    {lat: 37.7749295, lng: -122.4194155, title: "San Francisco"},
    {lat: 39.2238411, lng: 9.1216613, title: "Cagliari"},
    {lat: 48.8565823, lng: 2.3522148, title: "Paris"},
    {lat: -23.5505199, lng: -46.6333094, title: "San Paolo"},
    {lat: 31.5457542, lng: 75.4388427, title: "Nadal"},
    {lat: 52.4938053, lng: 13.4552919, title: "Berlin"},
    {lat: 47.6062095, lng: -122.3320708, title: "Seattle"},
    {lat: 47.6062095, lng: -122.3320708, title: "Seattle"},
    {lat: 34.0522342, lng: -118.2436849, title: "Los Angeles"},
    {lat: 36.1699412, lng: -115.1398296, title: "Las Vegas"},
    {lat: 53.544389, lng: -113.4909267, title: "Edmonton"},
    {lat: 51.0486151, lng: -114.0708459, title: "Calgary"},
    {lat: 43.653226, lng: -79.3831843, title: "Toronto"},
    {lat: 55.755826, lng: 37.6172999, title: "Moscow"},
    {lat: 41.1634302, lng: 28.7664408, title: "Instabul"},
    {lat: 38.7223263, lng: -9.1392714, title: "Lisbon"},
    {lat: 21.521757, lng: -77.781167, title: "Cuba"},
    {lat: -34.6324213, lng: -71.3592116, title: "Santa Cruz"},
    {lat: -34.6036844, lng: -58.3815591, title: "Buenos Aires"},
    {lat: -33.4488897, lng: -70.6692655, title: "Santiago del Chile"},
    {lat: 6.2530408, lng: -75.5645737, title: "Medellín"},
    {lat: -0.1806532, lng: -78.4678382, title: "Quito"},
    {lat: -22.3534263, lng: -42.7076107, title: "Rio de Janeiro"},
    {lat: 19.432608, lng: -99.133208, title: "Mexico City"},
    {lat: 37.3229978, lng: -122.0321823, title: "Cupertino"},
    {lat: 42.331427, lng: -83.0457538, title: "Detroit"},
    {lat: -31.6106578, lng: -60.697294, title: "Santa Fe"},
    {lat: 22.543096, lng: 114.057865, title: "Shenzhen"},
    {lat: 39.9041999, lng: 116.4073963, title: "Pechino"},
    {lat: 31.23039, lng: 121.473702, title: "Shanghai"},
    {lat: 41.02135511, lng: 113.2196045, title: "Ulan Bator"},
    {lat: 22.396428, lng: 114.109497, title: "Hong Kong"},
    {lat: -0.589724, lng: 101.3431058, title: "Sumatra"},
    {lat: -6.17511, lng: 106.8650395, title: "Giacarta"},
    {lat: 14.6090537, lng: 121.0222565, title: "Manila"},
    {lat: 1.3553794, lng: 103.8677444, title: "Singapore"},
    {lat: 13.7563309, lng: 100.5017651, title: "Bangkok"},
    {lat: 7.9519331, lng: 98.3380884, title: "Phuket"},
    {lat: 25.0329636, lng: 121.5654268, title: "Taipei"},
    {lat: 37.566535, lng: 126.9779692, title: "Seul"},
    {lat: 35.6894875, lng: 139.6917064, title: "Tokyo"},
    {lat: 35.0116363, lng: 135.7680294, title: "Kyoto"},
    {lat: 28.6139391, lng: 77.2090212, title: "New Delhi"},
    {lat: 19.0759837, lng: 72.8776559, title: "Mumbai"},
    {lat: 33.6600365, lng: 73.2293542, title: "Islamabad"},
    {lat: 23.810332, lng: 90.4125181, title: "Dacca"},
    {lat: 6.9270786, lng: 79.861243, title: "Colombo"},
    {lat: -37.813611, lng: 144.963056, title: "Melbourne"},
    {lat: -33.8688197, lng: 151.2092955, title: "Sidney"},
    {lat: -41.2864603, lng: 174.776236, title: "Wellington"},
    {lat: -4.0434771, lng: 39.6682065, title: "Mombasa"},
    {lat: 2.0469343, lng: 45.3181623, title: "Mogadiscio"},
    {lat: 5.6037168, lng: -0.1869644, title: "Accra"},
    {lat: 6.5243793, lng: 3.3792057, title: "Lagos"},
    {lat: -26.30326424, lng: 18.00109863, title: "Johannesburg"},
    {lat: -15.3875259, lng: 28.3228165, title: "Lusaka"},
    {lat: 25.2048493, lng: 55.2707828, title: "Dubai"},


];


const COUNTRY_CODES = [
    {
        "name": "Afghanistan",
        "dial_code": "+93",
        "code": "AF"
    }, {"name": "Albania", "dial_code": "+355", "code": "AL"}, {
        "name": "Algeria",
        "dial_code": "+213",
        "code": "DZ"
    }, {"name": "American Samoa", "dial_code": "+1 684", "code": "AS"}, {
        "name": "Andorra",
        "dial_code": "+376",
        "code": "AD"
    }, {"name": "Angola", "dial_code": "+244", "code": "AO"}, {
        "name": "Anguilla",
        "dial_code": "+1 264",
        "code": "AI"
    }, {
        "name": "Argentina",
        "dial_code": "+54",
        "code": "AR"
    }, {"name": "Armenia", "dial_code": "+374", "code": "AM"}, {
        "name": "Aruba",
        "dial_code": "+297",
        "code": "AW"
    }, {"name": "Australia", "dial_code": "+61", "code": "AU"}, {
        "name": "Austria",
        "dial_code": "+43",
        "code": "AT"
    }, {"name": "Azerbaijan", "dial_code": "+994", "code": "AZ"}, {
        "name": "Bahamas",
        "dial_code": "+1 242",
        "code": "BS"
    }, {"name": "Bahrain", "dial_code": "+973", "code": "BH"}, {
        "name": "Bangladesh",
        "dial_code": "+880",
        "code": "BD"
    }, {"name": "Barbados", "dial_code": "+1 246", "code": "BB"}, {
        "name": "Belarus",
        "dial_code": "+375",
        "code": "BY"
    }, {"name": "Belgium", "dial_code": "+32", "code": "BE"}, {
        "name": "Belize",
        "dial_code": "+501",
        "code": "BZ"
    }, {"name": "Benin", "dial_code": "+229", "code": "BJ"}, {
        "name": "Bermuda",
        "dial_code": "+1 441",
        "code": "BM"
    }, {"name": "Bhutan", "dial_code": "+975", "code": "BT"}, {
        "name": "Bosnia and Herzegovina",
        "dial_code": "+387",
        "code": "BA"
    }, {"name": "Botswana", "dial_code": "+267", "code": "BW"}, {
        "name": "Brazil",
        "dial_code": "+55",
        "code": "BR"
    }, {"name": "British Indian Ocean Territory", "dial_code": "+246", "code": "IO"}, {
        "name": "Bulgaria",
        "dial_code": "+359",
        "code": "BG"
    }, {"name": "Burkina Faso", "dial_code": "+226", "code": "BF"}, {
        "name": "Burundi",
        "dial_code": "+257",
        "code": "BI"
    }, {"name": "Cambodia", "dial_code": "+855", "code": "KH"}, {
        "name": "Cameroon",
        "dial_code": "+237",
        "code": "CM"
    }, {"name": "Canada", "dial_code": "+1", "code": "CA"}, {
        "name": "Cape Verde",
        "dial_code": "+238",
        "code": "CV"
    }, {"name": "Cayman Islands", "dial_code": "+ 345", "code": "KY"}, {
        "name": "Central African Republic",
        "dial_code": "+236",
        "code": "CF"
    }, {"name": "Chad", "dial_code": "+235", "code": "TD"}, {
        "name": "Chile",
        "dial_code": "+56",
        "code": "CL"
    }, {"name": "China, People's Republic", "dial_code": "+86", "code": "CN"},
    {"name": "Colombia", "dial_code": "+57", "code": "CO"}, {
        "name": "Comoros",
        "dial_code": "+269",
        "code": "KM"
    }, {"name": "Congo", "dial_code": "+242", "code": "CG"}, {
        "name": "Cook Islands",
        "dial_code": "+682",
        "code": "CK"
    }, {"name": "Costa Rica", "dial_code": "+506", "code": "CR"}, {
        "name": "Croatia",
        "dial_code": "+385",
        "code": "HR"
    }, {"name": "Cuba", "dial_code": "+53", "code": "CU"}, {
        "name": "Cyprus",
        "dial_code": "+537",
        "code": "CY"
    }, {"name": "Czech Republic, The", "dial_code": "+420", "code": "CZ"}, {
        "name": "Denmark",
        "dial_code": "+45",
        "code": "DK"
    }, {"name": "Djibouti", "dial_code": "+253", "code": "DJ"}, {
        "name": "Dominica",
        "dial_code": "+1 767",
        "code": "DM"
    }, {"name": "Dominican Republic", "dial_code": "+1 849", "code": "DO"}, {
        "name": "Ecuador",
        "dial_code": "+593",
        "code": "EC"
    }, {"name": "Egypt", "dial_code": "+20", "code": "EG"}, {
        "name": "El Salvador",
        "dial_code": "+503",
        "code": "SV"
    }, {"name": "Guinea-Equatorial", "dial_code": "+240", "code": "GQ"}, {
        "name": "Eritrea",
        "dial_code": "+291",
        "code": "ER"
    }, {"name": "Estonia", "dial_code": "+372", "code": "EE"}, {
        "name": "Ethiopia",
        "dial_code": "+251",
        "code": "ET"
    }, {"name": "Faroe Islands", "dial_code": "+298", "code": "FO"}, {
        "name": "Fiji",
        "dial_code": "+679",
        "code": "FJ"
    }, {"name": "Finland", "dial_code": "+358", "code": "FI"}, {
        "name": "France",
        "dial_code": "+33",
        "code": "FR"
    }, {"name": "French Guyana", "dial_code": "+594", "code": "GF"}, {
        "name": "French Polynesia",
        "dial_code": "+689",
        "code": "PF"
    }, {"name": "Gabon", "dial_code": "+241", "code": "GA"}, {
        "name": "Gambia",
        "dial_code": "+220",
        "code": "GM"
    }, {"name": "Georgia", "dial_code": "+995", "code": "GE"}, {
        "name": "Germany",
        "dial_code": "+49",
        "code": "DE"
    }, {"name": "Ghana", "dial_code": "+233", "code": "GH"}, {
        "name": "Gibraltar",
        "dial_code": "+350",
        "code": "GI"
    }, {"name": "Greece", "dial_code": "+30", "code": "GR"}, {
        "name": "Greenland",
        "dial_code": "+299",
        "code": "GL"
    }, {"name": "Grenada", "dial_code": "+1 473", "code": "GD"}, {
        "name": "Guadeloupe",
        "dial_code": "+590",
        "code": "GP"
    }, {"name": "Guam", "dial_code": "+1 671", "code": "GU"}, {
        "name": "Guatemala",
        "dial_code": "+502",
        "code": "GT"
    }, {"name": "Guinea Republic", "dial_code": "+224", "code": "GN"}, {
        "name": "Guinea-Bissau",
        "dial_code": "+245",
        "code": "GW"
    }, {"name": "Guyana (British)", "dial_code": "+595", "code": "GY"}, {
        "name": "Haiti",
        "dial_code": "+509",
        "code": "HT"
    }, {"name": "Honduras", "dial_code": "+504", "code": "HN"}, {
        "name": "Hungary",
        "dial_code": "+36",
        "code": "HU"
    }, {"name": "Iceland", "dial_code": "+354", "code": "IS"}, {
        "name": "India",
        "dial_code": "+91",
        "code": "IN"
    }, {"name": "Indonesia", "dial_code": "+62", "code": "ID"}, {
        "name": "Iraq",
        "dial_code": "+964",
        "code": "IQ"
    }, {"name": "Ireland, Republic Of", "dial_code": "+353", "code": "IE"}, {
        "name": "Israel",
        "dial_code": "+972",
        "code": "IL"
    }, {"name": "Italy", "dial_code": "+39", "code": "IT"}, {
        "name": "Jamaica",
        "dial_code": "+1 876",
        "code": "JM"
    }, {"name": "Japan", "dial_code": "+81", "code": "JP"}, {
        "name": "Jordan",
        "dial_code": "+962",
        "code": "JO"
    }, {"name": "Kazakhstan", "dial_code": "+7 7", "code": "KZ"}, {
        "name": "Kenya",
        "dial_code": "+254",
        "code": "KE"
    }, {"name": "Kiribati", "dial_code": "+686", "code": "KI"}, {
        "name": "Kuwait",
        "dial_code": "+965",
        "code": "KW"
    }, {"name": "Kyrgyzstan", "dial_code": "+996", "code": "KG"}, {
        "name": "Latvia",
        "dial_code": "+371",
        "code": "LV"
    }, {"name": "Lebanon", "dial_code": "+961", "code": "LB"}, {
        "name": "Lesotho",
        "dial_code": "+266",
        "code": "LS"
    }, {"name": "Liberia", "dial_code": "+231", "code": "LR"}, {
        "name": "Liechenstein",
        "dial_code": "+423",
        "code": "LI"
    }, {"name": "Lithuania", "dial_code": "+370", "code": "LT"}, {
        "name": "Luxembourg",
        "dial_code": "+352",
        "code": "LU"
    }, {"name": "Madagascar", "dial_code": "+261", "code": "MG"}, {
        "name": "Malawi",
        "dial_code": "+265",
        "code": "MW"
    }, {"name": "Malaysia", "dial_code": "+60", "code": "MY"}, {
        "name": "Maldives",
        "dial_code": "+960",
        "code": "MV"
    }, {"name": "Mali", "dial_code": "+223", "code": "ML"}, {
        "name": "Malta",
        "dial_code": "+356",
        "code": "MT"
    }, {"name": "Marshall Islands", "dial_code": "+692", "code": "MH"}, {
        "name": "Martinique",
        "dial_code": "+596",
        "code": "MQ"
    }, {"name": "Mauritania", "dial_code": "+222", "code": "MR"}, {
        "name": "Mauritius",
        "dial_code": "+230",
        "code": "MU"
    }, {"name": "Mayotte", "dial_code": "+262", "code": "YT"}, {
        "name": "Mexico",
        "dial_code": "+52",
        "code": "MX"
    }, {"name": "Monaco", "dial_code": "+377", "code": "MC"}, {
        "name": "Mongolia",
        "dial_code": "+976",
        "code": "MN"
    }, {"name": "Montenegro, Republicof", "dial_code": "+382", "code": "ME"}, {
        "name": "Montserrat",
        "dial_code": "+1664",
        "code": "MS"
    }, {"name": "Morocco", "dial_code": "+212", "code": "MA"}, {
        "name": "Myanmar",
        "dial_code": "+95",
        "code": "MM"
    }, {"name": "Namibia", "dial_code": "+264", "code": "NA"}, {
        "name": "Nauru, Republic Of",
        "dial_code": "+674",
        "code": "NR"
    }, {"name": "Nepal", "dial_code": "+977", "code": "NP"}, {
        "name": "Netherlands, The",
        "dial_code": "+31",
        "code": "NL"
    }, {
        "name": "New Caledonia",
        "dial_code": "+687",
        "code": "NC"
    }, {"name": "New Zealand", "dial_code": "+64", "code": "NZ"}, {
        "name": "Nicaragua",
        "dial_code": "+505",
        "code": "NI"
    }, {"name": "Niger", "dial_code": "+227", "code": "NE"}, {
        "name": "Nigeria",
        "dial_code": "+234",
        "code": "NG"
    }, {"name": "Niue", "dial_code": "+683", "code": "NU"}, {
        "name": "Norway",
        "dial_code": "+47",
        "code": "NO"
    }, {"name": "Oman", "dial_code": "+968", "code": "OM"}, {
        "name": "Pakistan",
        "dial_code": "+92",
        "code": "PK"
    }, {"name": "Palau", "dial_code": "+680", "code": "PW"}, {
        "name": "Panama",
        "dial_code": "+507",
        "code": "PA"
    }, {"name": "Papua New Guinea", "dial_code": "+675", "code": "PG"}, {
        "name": "Paraguay",
        "dial_code": "+595",
        "code": "PY"
    }, {"name": "Peru", "dial_code": "+51", "code": "PE"}, {
        "name": "Philippines, The",
        "dial_code": "+63",
        "code": "PH"
    }, {"name": "Poland", "dial_code": "+48", "code": "PL"}, {
        "name": "Portugal",
        "dial_code": "+351",
        "code": "PT"
    }, {"name": "Puerto Rico", "dial_code": "+1 939", "code": "PR"}, {
        "name": "Qatar",
        "dial_code": "+974",
        "code": "QA"
    }, {"name": "Romania", "dial_code": "+40", "code": "RO"}, {
        "name": "Rwanda",
        "dial_code": "+250",
        "code": "RW"
    }, {"name": "Samoa", "dial_code": "+685", "code": "WS"}, {
        "name": "San Marino",
        "dial_code": "+378",
        "code": "SM"
    }, {"name": "Saudi Arabia", "dial_code": "+966", "code": "SA"}, {
        "name": "Senegal",
        "dial_code": "+221",
        "code": "SN"
    }, {"name": "Serbia", "dial_code": "+381", "code": "RS"}, {
        "name": "Seychelles",
        "dial_code": "+248",
        "code": "SC"
    }, {"name": "Sierra Leone", "dial_code": "+232", "code": "SL"}, {
        "name": "Singapore",
        "dial_code": "+65",
        "code": "SG"
    }, {"name": "Slovakia", "dial_code": "+421", "code": "SK"}, {
        "name": "Slovenia",
        "dial_code": "+386",
        "code": "SI"
    }, {"name": "Solomon Islands", "dial_code": "+677", "code": "SB"}, {
        "name": "South Africa",
        "dial_code": "+27",
        "code": "ZA"
    }, {
        "name": "Spain",
        "dial_code": "+34",
        "code": "ES"
    }, {"name": "Sri Lanka", "dial_code": "+94", "code": "LK"}, {
        "name": "Sudan",
        "dial_code": "+249",
        "code": "SD"
    }, {"name": "Suriname", "dial_code": "+597", "code": "SR"}, {
        "name": "Swaziland",
        "dial_code": "+268",
        "code": "SZ"
    }, {"name": "Sweden", "dial_code": "+46", "code": "SE"}, {
        "name": "Switzerland",
        "dial_code": "+41",
        "code": "CH"
    }, {"name": "Tajikistan", "dial_code": "+992", "code": "TJ"}, {
        "name": "Thailand",
        "dial_code": "+66",
        "code": "TH"
    }, {"name": "Togo", "dial_code": "+228", "code": "TG"}, {"name": "Tonga", "dial_code": "+676", "code": "TO"}, {
        "name": "Trinidad and Tobago",
        "dial_code": "+1 868",
        "code": "TT"
    }, {"name": "Tunisia", "dial_code": "+216", "code": "TN"}, {
        "name": "Turkey",
        "dial_code": "+90",
        "code": "TR"
    }, {
        "name": "Turksand Caicos Islands",
        "dial_code": "+1 649",
        "code": "TC"
    }, {"name": "Tuvalu", "dial_code": "+688", "code": "TV"}, {
        "name": "Uganda",
        "dial_code": "+256",
        "code": "UG"
    }, {"name": "Ukraine", "dial_code": "+380", "code": "UA"}, {
        "name": "United Arab Emirates",
        "dial_code": "+971",
        "code": "AE"
    }, {"name": "United Kingdom", "dial_code": "+44", "code": "GB"}, {
        "name": "United States Of America",
        "dial_code": "+1",
        "code": "US"
    }, {"name": "Uruguay", "dial_code": "+598", "code": "UY"}, {
        "name": "Uzbekistan",
        "dial_code": "+998",
        "code": "UZ"
    }, {"name": "Vanuatu", "dial_code": "+678", "code": "VU"}, {"name": "Yemen", "dial_code": "+967", "code": "YE"}, {
        "name": "Zambia",
        "dial_code": "+260",
        "code": "ZM"
    }, {"name": "Zimbabwe", "dial_code": "+263", "code": "ZW"}, {
        "name": "Bolivia",
        "dial_code": "+591",
        "code": "BO"
    }, {"name": "Brunei", "dial_code": "+673", "code": "BN"}, {
        "name": "Congo, The Democratic Republicof",
        "dial_code": "+243",
        "code": "CD"
    }, {
        "name": "Coted'Ivoire",
        "dial_code": "+225",
        "code": "CI"
    }, {"name": "Falkland Islands", "dial_code": "+500", "code": "FK"}, {
        "name": "Guernsey",
        "dial_code": "+44",
        "code": "GG"
    }, {"name": "Vatican City", "dial_code": "+379", "code": "VA"}, {
        "name": "Hong Kong",
        "dial_code": "+852",
        "code": "HK"
    }, {"name": "Iran (Islamic Republicof)", "dial_code": "+98", "code": "IR"}, {
        "name": "Jersey",
        "dial_code": "+44",
        "code": "JE"
    }, {
        "name": "Korea, Republicof (South K.)",
        "dial_code": "+850",
        "code": "KP"
    }, {"name": "Korea, the D.P.ROF(North K.)", "dial_code": "+82", "code": "KR"}, {
        "name": "Lao People's Democratic Republic",
        "dial_code": "+856",
        "code": "LA"
    }, {"name": "Libya", "dial_code": "+218", "code": "LY"}, {
        "name": "Macau",
        "dial_code": "+853",
        "code": "MO"
    }, {
        "name": "Macedonia, Republicof",
        "dial_code": "+389",
        "code": "MK"
    }, {"name": "Micronesia, Federated States Of", "dial_code": "+691", "code": "FM"}, {
        "name": "Moldova, Republic Of",
        "dial_code": "+373",
        "code": "MD"
    }, {"name": "Mozambique", "dial_code": "+258", "code": "MZ"}, {
        "name": "Palestinian Territory, Occupied",
        "dial_code": "+970",
        "code": "PS"
    }, {
        "name": "Reunion, Island Of",
        "dial_code": "+262",
        "code": "RE"
    }, {"name": "Russian Federation, The", "dial_code": "+7", "code": "RU"}, {
        "name": "Saint Barthelemy",
        "dial_code": "+590",
        "code": "BL"
    }, {
        "name": "St. Helena",
        "dial_code": "+290",
        "code": "SH"
    }, {"name": "St. Kitts", "dial_code": "+1 869", "code": "KN"}, {
        "name": "St. Lucia",
        "dial_code": "+1 758",
        "code": "LC"
    }, {"name": "St. Martin", "dial_code": "+590", "code": "MF"}, {
        "name": "St. Pierre and Miquelon",
        "dial_code": "+508",
        "code": "PM"
    }, {"name": "St. Vincent", "dial_code": "+1 784", "code": "VC"}, {
        "name": "Sao Tome and Principe",
        "dial_code": "+239",
        "code": "ST"
    }, {"name": "Somalia", "dial_code": "+252", "code": "SO"}, {
        "name": "Svalbard and Jan Mayen",
        "dial_code": "+47",
        "code": "SJ"
    }, {"name": "Syria", "dial_code": "+963", "code": "SY"}, {
        "name": "Taiwan",
        "dial_code": "+886",
        "code": "TW"
    }, {"name": "Tanzania", "dial_code": "+255", "code": "TZ"}, {
        "name": "Timor-Leste",
        "dial_code": "+670",
        "code": "TL"
    }, {"name": "Venezuela", "dial_code": "+58", "code": "VE"}, {
        "name": "Vietnam",
        "dial_code": "+84",
        "code": "VN"
    }, {"name": "Virgin Islands(British)", "dial_code": "+1 284", "code": "VG"}, {
        "name": "Virgin Islands(US)",
        "dial_code": "+1 340",
        "code": "VI"
    }];
