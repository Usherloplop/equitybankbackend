import { randomUUID } from 'crypto';

class Transfer {

    constructor({
        amount,
        recipientName,
        recipientAccount,
        bankIdentifierType,
        bankIdentifier,
        bankName,
        recipientEmail,
        recipientPhone,
        accountId = '',
        accountLabel = '',
        userId = '',
        currency = 'USD',
        status
    }) {

        this.id = randomUUID();

        this.amount = Number(amount);

        this.recipientName = recipientName;

        this.recipientAccount = recipientAccount || '';

        this.bankIdentifierType = bankIdentifierType || '';

        this.bankIdentifier = bankIdentifier || '';

        this.bankName = bankName || '';

        this.recipientEmail = recipientEmail || '';

        this.recipientPhone = recipientPhone || '';

        this.accountId = accountId;

        this.accountLabel = accountLabel;

        this.userId = userId;

        this.currency = currency;

        this.status = status || 'Processing';

        this.date = new Date().toLocaleDateString('en-US');

        this.createdAt = new Date();
    }


    // CREATE TRANSACTION

    static createTransaction(transactionData) {

        return new Transfer(transactionData);

    }


    // SIMULATE SAVING TRANSACTION

    save() {

        console.log('Transaction saved:', this);

        return this;

    }


    // SIMULATE RECEIPT NOTIFICATION

    async sendReceipt() {

        if (this.recipientEmail) {
            console.log(`Sending receipt to ${this.recipientEmail}`);
        }

    }

}

export default Transfer;