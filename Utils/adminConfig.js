const CURRENCY_ENTRIES = [
    ['AED', 'UAE Dirham', 'د.إ'], ['AFN', 'Afghan Afghani', '؋'],
    ['ALL', 'Albanian Lek', 'L'], ['AMD', 'Armenian Dram', '֏'],
    ['AOA', 'Angolan Kwanza', 'Kz'], ['ARS', 'Argentine Peso', '$'],
    ['AUD', 'Australian Dollar', '$', 'en-AU'], ['AWG', 'Aruban Florin', 'ƒ'],
    ['AZN', 'Azerbaijani Manat', '₼'], ['BAM', 'Bosnia and Herzegovina Convertible Mark', 'KM'],
    ['BBD', 'Barbadian Dollar', '$'], ['BDT', 'Bangladeshi Taka', '৳'],
    ['BHD', 'Bahraini Dinar', '.د.ب'], ['BIF', 'Burundian Franc', 'FBu'],
    ['BMD', 'Bermudian Dollar', '$'], ['BND', 'Brunei Dollar', '$'],
    ['BOB', 'Bolivian Boliviano', 'Bs.'], ['BRL', 'Brazilian Real', 'R$'],
    ['BSD', 'Bahamian Dollar', '$'], ['BTN', 'Bhutanese Ngultrum', 'Nu.'],
    ['BWP', 'Botswana Pula', 'P'], ['BYN', 'Belarusian Ruble', 'Br'],
    ['BZD', 'Belize Dollar', '$'], ['CAD', 'Canadian Dollar', '$', 'en-CA'],
    ['CDF', 'Congolese Franc', 'FC'], ['CHF', 'Swiss Franc', 'CHF'],
    ['CLP', 'Chilean Peso', '$'], ['CNY', 'Chinese Yuan Renminbi', '¥'],
    ['COP', 'Colombian Peso', '$'], ['CRC', 'Costa Rican Colón', '₡'],
    ['CUP', 'Cuban Peso', '$'], ['CVE', 'Cape Verdean Escudo', 'Esc'],
    ['CZK', 'Czech Koruna', 'Kč'], ['DJF', 'Djiboutian Franc', 'Fdj'],
    ['DKK', 'Danish Krone', 'kr'], ['DOP', 'Dominican Peso', '$'],
    ['DZD', 'Algerian Dinar', 'د.ج'], ['EGP', 'Egyptian Pound', '£'],
    ['ERN', 'Eritrean Nakfa', 'Nfk'], ['ETB', 'Ethiopian Birr', 'Br'],
    ['EUR', 'Euro', '€', 'de-DE'], ['FJD', 'Fiji Dollar', '$'],
    ['FKP', 'Falkland Islands Pound', '£'], ['GBP', 'Pound Sterling', '£', 'en-GB'],
    ['GEL', 'Georgian Lari', '₾'], ['GHS', 'Ghanaian Cedi', '₵'],
    ['GIP', 'Gibraltar Pound', '£'], ['GMD', 'Gambian Dalasi', 'D'],
    ['GNF', 'Guinean Franc', 'FG'], ['GTQ', 'Guatemalan Quetzal', 'Q'],
    ['GYD', 'Guyanese Dollar', '$'], ['HKD', 'Hong Kong Dollar', 'HK$'],
    ['HNL', 'Honduran Lempira', 'L'], ['HTG', 'Haitian Gourde', 'G'],
    ['HUF', 'Hungarian Forint', 'Ft'], ['IDR', 'Indonesian Rupiah', 'Rp'],
    ['ILS', 'Israeli New Shekel', '₪'], ['INR', 'Indian Rupee', '₹'],
    ['IQD', 'Iraqi Dinar', 'ع.د'], ['IRR', 'Iranian Rial', '﷼'],
    ['ISK', 'Icelandic Krona', 'kr'], ['JMD', 'Jamaican Dollar', '$'],
    ['JOD', 'Jordanian Dinar', 'د.ا'], ['JPY', 'Japanese Yen', '¥'],
    ['KES', 'Kenyan Shilling', 'KSh'], ['KGS', 'Kyrgyzstani Som', 'с'],
    ['KHR', 'Cambodian Riel', '៛'], ['KMF', 'Comorian Franc', 'CF'],
    ['KPW', 'North Korean Won', '₩'], ['KRW', 'South Korean Won', '₩'],
    ['KWD', 'Kuwaiti Dinar', 'د.ك'], ['KYD', 'Cayman Islands Dollar', '$'],
    ['KZT', 'Kazakhstani Tenge', '₸'], ['LAK', 'Lao Kip', '₭'],
    ['LBP', 'Lebanese Pound', 'ل.ل'], ['LKR', 'Sri Lankan Rupee', 'Rs'],
    ['LRD', 'Liberian Dollar', '$'], ['LSL', 'Lesotho Loti', 'L'],
    ['LYD', 'Libyan Dinar', 'ل.د'], ['MAD', 'Moroccan Dirham', 'د.م.'],
    ['MDL', 'Moldovan Leu', 'L'], ['MGA', 'Malagasy Ariary', 'Ar'],
    ['MKD', 'Macedonian Denar', 'ден'], ['MMK', 'Myanmar Kyat', 'K'],
    ['MNT', 'Mongolian Tögrög', '₮'], ['MOP', 'Macanese Pataca', 'MOP$'],
    ['MRU', 'Mauritanian Ouguiya', 'UM'], ['MUR', 'Mauritian Rupee', '₨'],
    ['MVR', 'Maldivian Rufiyaa', 'Rf'], ['MWK', 'Malawian Kwacha', 'MK'],
    ['MXN', 'Mexican Peso', '$'], ['MYR', 'Malaysian Ringgit', 'RM'],
    ['MZN', 'Mozambican Metical', 'MT'], ['NAD', 'Namibian Dollar', '$'],
    ['NGN', 'Nigerian Naira', '₦', 'en-NG'], ['NIO', 'Nicaraguan Córdoba', 'C$'],
    ['NOK', 'Norwegian Krone', 'kr'], ['NPR', 'Nepalese Rupee', 'रू'],
    ['NZD', 'New Zealand Dollar', 'NZ$'], ['OMR', 'Omani Rial', 'ر.ع.'],
    ['PAB', 'Panamanian Balboa', 'B/.'], ['PEN', 'Peruvian Sol', 'S/'],
    ['PGK', 'Papua New Guinean Kina', 'K'], ['PHP', 'Philippine Peso', '₱'],
    ['PKR', 'Pakistani Rupee', 'Rs'], ['PLN', 'Polish Złoty', 'zł'],
    ['PYG', 'Paraguayan Guaraní', '₲'], ['QAR', 'Qatari Riyal', 'ر.ق'],
    ['RON', 'Romanian Leu', 'lei'], ['RSD', 'Serbian Dinar', 'дин.'],
    ['RUB', 'Russian Ruble', '₽'], ['RWF', 'Rwandan Franc', 'FRw'],
    ['SAR', 'Saudi Riyal', 'ر.س'], ['SBD', 'Solomon Islands Dollar', '$'],
    ['SCR', 'Seychelles Rupee', '₨'], ['SDG', 'Sudanese Pound', 'ج.س.'],
    ['SEK', 'Swedish Krona', 'kr'], ['SGD', 'Singapore Dollar', 'S$'],
    ['SHP', 'Saint Helena Pound', '£'], ['SLE', 'Sierra Leonean Leone', 'Le'],
    ['SOS', 'Somali Shilling', 'Sh'], ['SRD', 'Surinamese Dollar', '$'],
    ['SSP', 'South Sudanese Pound', '£'], ['STN', 'São Tomé and Príncipe Dobra', 'Db'],
    ['SYP', 'Syrian Pound', '£'], ['SZL', 'Swazi Lilangeni', 'L'],
    ['THB', 'Thai Baht', '฿'], ['TJS', 'Tajikistani Somoni', 'SM'],
    ['TMT', 'Turkmenistani Manat', 'm'], ['TND', 'Tunisian Dinar', 'د.ت'],
    ['TOP', 'Tongan Paʻanga', 'T$'], ['TRY', 'Turkish Lira', '₺'],
    ['TTD', 'Trinidad and Tobago Dollar', 'TT$'], ['TWD', 'New Taiwan Dollar', 'NT$'],
    ['TZS', 'Tanzanian Shilling', 'TSh'], ['UAH', 'Ukrainian Hryvnia', '₴'],
    ['UGX', 'Ugandan Shilling', 'USh'], ['USD', 'United States Dollar', 'US$', 'en-US'],
    ['UYU', 'Uruguayan Peso', '$U'], ['UZS', 'Uzbekistani Soʻm', "so'm"],
    ['VES', 'Venezuelan Bolívar', 'Bs.'], ['VND', 'Vietnamese Đồng', '₫'],
    ['VUV', 'Vanuatu Vatu', 'Vt'], ['WST', 'Samoan Tālā', 'WS$'],
    ['XAF', 'Central African CFA Franc', 'FCFA'], ['XCD', 'East Caribbean Dollar', 'EC$'],
    ['XCG', 'Caribbean Guilder', 'Cg.'], ['XOF', 'West African CFA Franc', 'CFA'],
    ['XPF', 'CFP Franc', '₣'], ['YER', 'Yemeni Rial', '﷼'],
    ['ZAR', 'South African Rand', 'R'], ['ZMW', 'Zambian Kwacha', 'ZK'],
    ['ZWG', 'Zimbabwe Gold', 'ZiG']
];

const CURRENCY_LOCALES = {
    AED: 'ar-AE', AFN: 'fa-AF', ALL: 'sq-AL', AMD: 'hy-AM', AOA: 'pt-AO',
    ARS: 'es-AR', AWG: 'nl-AW', AZN: 'az-AZ', BAM: 'bs-BA', BBD: 'en-BB',
    BDT: 'bn-BD', BHD: 'ar-BH', BIF: 'fr-BI', BMD: 'en-BM', BND: 'en-BN',
    BOB: 'es-BO', BRL: 'pt-BR', BSD: 'en-BS', BTN: 'en-IN', BWP: 'en-BW',
    BYN: 'be-BY', BZD: 'en-BZ', CDF: 'fr-CD', CHF: 'de-CH', CLP: 'es-CL',
    CNY: 'zh-CN', COP: 'es-CO', CRC: 'es-CR', CUP: 'es-CU', CVE: 'pt-CV',
    CZK: 'cs-CZ', DJF: 'fr-DJ', DKK: 'da-DK', DOP: 'es-DO', DZD: 'ar-DZ',
    EGP: 'ar-EG', ERN: 'ti-ER', ETB: 'am-ET', FJD: 'en-FJ', FKP: 'en-FK',
    GEL: 'ka-GE', GHS: 'en-GH', GIP: 'en-GI', GMD: 'en-GM', GNF: 'fr-GN',
    GTQ: 'es-GT', GYD: 'en-GY', HKD: 'zh-HK', HNL: 'es-HN', HTG: 'fr-HT',
    HUF: 'hu-HU', IDR: 'id-ID', ILS: 'he-IL', INR: 'en-IN', IQD: 'ar-IQ',
    IRR: 'fa-IR', ISK: 'is-IS', JMD: 'en-JM', JOD: 'ar-JO', JPY: 'ja-JP',
    KES: 'en-KE', KGS: 'ky-KG', KHR: 'km-KH', KMF: 'fr-KM', KPW: 'ko-KP',
    KRW: 'ko-KR', KWD: 'ar-KW', KYD: 'en-KY', KZT: 'kk-KZ', LAK: 'lo-LA',
    LBP: 'ar-LB', LKR: 'si-LK', LRD: 'en-LR', LSL: 'en-LS', LYD: 'ar-LY',
    MAD: 'ar-MA', MDL: 'ro-MD', MGA: 'mg-MG', MKD: 'mk-MK', MMK: 'my-MM',
    MNT: 'mn-MN', MOP: 'zh-MO', MRU: 'ar-MR', MUR: 'en-MU', MVR: 'dv-MV',
    MWK: 'en-MW', MXN: 'es-MX', MYR: 'ms-MY', MZN: 'pt-MZ', NAD: 'en-NA',
    NIO: 'es-NI', NOK: 'nb-NO', NPR: 'ne-NP', NZD: 'en-NZ', OMR: 'ar-OM',
    PAB: 'es-PA', PEN: 'es-PE', PGK: 'en-PG', PHP: 'en-PH', PKR: 'en-PK',
    PLN: 'pl-PL', PYG: 'es-PY', QAR: 'ar-QA', RON: 'ro-RO', RSD: 'sr-RS',
    RUB: 'ru-RU', RWF: 'rw-RW', SAR: 'ar-SA', SBD: 'en-SB', SCR: 'en-SC',
    SDG: 'ar-SD', SEK: 'sv-SE', SGD: 'en-SG', SHP: 'en-SH', SLE: 'en-SL',
    SOS: 'so-SO', SRD: 'nl-SR', SSP: 'en-SS', STN: 'pt-ST', SYP: 'ar-SY',
    SZL: 'en-SZ', THB: 'th-TH', TJS: 'tg-TJ', TMT: 'tk-TM', TND: 'ar-TN',
    TOP: 'en-TO', TRY: 'tr-TR', TTD: 'en-TT', TWD: 'zh-TW', TZS: 'sw-TZ',
    UAH: 'uk-UA', UGX: 'en-UG', UYU: 'es-UY', UZS: 'uz-UZ', VES: 'es-VE',
    VND: 'vi-VN', VUV: 'en-VU', WST: 'en-WS', XAF: 'fr-CM', XCD: 'en-AG',
    XCG: 'nl-CW', XOF: 'fr-SN', XPF: 'fr-PF', YER: 'ar-YE', ZAR: 'en-ZA',
    ZMW: 'en-ZM', ZWG: 'en-ZW'
};

export const SUPPORTED_CURRENCIES = Object.fromEntries(
    CURRENCY_ENTRIES.map(([code, name, symbol, locale]) => [
        code,
        { name, symbol, locale: locale || CURRENCY_LOCALES[code] || 'en-US' }
    ])
);

export function formatCurrencyAmount(amount, currency) {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    if (!currencyInfo) throw new RangeError(`Unsupported currency: ${currency}`);
    const { symbol, locale } = currencyInfo;
    const code = currency;
    const value = Number(amount);
    if (!Number.isFinite(value)) return '—';

    const currencyFormat = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code
    }).resolvedOptions();
    const formattedNumber = new Intl.NumberFormat(locale, {
        minimumFractionDigits: currencyFormat.minimumFractionDigits,
        maximumFractionDigits: currencyFormat.maximumFractionDigits
    }).format(Math.abs(value));
    const sign = value < 0 ? '-' : '';
    return `${code} ${sign}${symbol}${formattedNumber}`;
}

export const ACCOUNT_TYPES = [
    'Retirement Account',
    'Checking Account',
    'Savings Account',
    'Credit Card'
];

export const NEW_USER_ACCOUNTS = ACCOUNT_TYPES.map(type => ({
    type,
    accountNumber: '',
    balance: 0,
    isActive: false
}));

export function maskAccountNumber(accountNumber = '') {
    const digits = String(accountNumber).replace(/\s/g, '');
    if (!digits) return '';
    return `****${digits.slice(-4)}`;
}

export function validateTransactionInput(input, accountIds) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        return { error: 'Transaction details are required.' };
    }

    const description = typeof input.description === 'string'
        ? input.description.trim()
        : '';
    if ((typeof input.amount !== 'number' && typeof input.amount !== 'string')
        || input.amount === '') {
        return { error: 'Enter a valid transaction amount.' };
    }
    const amount = Number(input.amount);
    const date = new Date(input.date);
    const status = input.status;
    const statuses = ['Completed', 'Pending', 'Processing', 'Failed'];

    if (!description || description.length > 200) {
        return { error: 'Description must contain between 1 and 200 characters.' };
    }
    if (!Number.isFinite(amount) || Math.abs(amount) > 1e12) {
        return { error: 'Enter a valid transaction amount.' };
    }
    if (typeof input.date !== 'string' || !input.date || Number.isNaN(date.getTime())) {
        return { error: 'Enter a valid transaction date.' };
    }
    if (!statuses.includes(status)) {
        return { error: 'Select a valid transaction status.' };
    }

    let balance = input.balance;
    if (typeof balance === 'string') {
        balance = balance.trim();
        if (balance && !Number.isFinite(Number(balance))) {
            return { error: 'Balance must be a number or left blank.' };
        }
        balance = balance ? Number(balance) : status;
    } else if (balance === undefined || balance === null || balance === '') {
        balance = status === 'Completed' ? amount : status;
    } else {
        balance = Number(balance);
        if (!Number.isFinite(balance) || Math.abs(balance) > 1e12) {
            return { error: 'Enter a valid transaction balance.' };
        }
    }

    if (typeof input.accountId !== 'string' || !input.accountId) {
        return { error: 'Select an account for this transaction.' };
    }
    const accountId = input.accountId;
    if (!accountIds.has(accountId)) {
        return { error: 'Select an active account.' };
    }

    return {
        value: {
            date,
            description,
            amount,
            balance,
            status,
            accountId: String(accountId)
        }
    };
}
