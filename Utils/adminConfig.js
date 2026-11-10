export const SUPPORTED_CURRENCIES = {
    USD: { name: 'US Dollar', symbol: '$', locale: 'en-US' },
    GBP: { name: 'British Pound', symbol: '£', locale: 'en-GB' },
    EUR: { name: 'Euro', symbol: '€', locale: 'de-DE' },
    NGN: { name: 'Nigerian Naira', symbol: '₦', locale: 'en-NG' },
    CAD: { name: 'Canadian Dollar', symbol: '$', locale: 'en-CA' },
    AUD: { name: 'Australian Dollar', symbol: '$', locale: 'en-AU' }
};

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
