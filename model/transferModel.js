
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
        status,
        softcodeMessage = ''
    }) {

        this.id = randomUUID();

        this.amount = Number(amount);

        this.recipientName = recipientName;

        this.recipientAccount = recipientAccount;

        this.bankIdentifierType = bankIdentifierType;

        this.bankIdentifier = bankIdentifier;

        this.bankName = bankName;

        this.recipientEmail = recipientEmail;

        this.status = status || 'Processing';

        this.softcodeMessage = softcodeMessage;

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

        console.log(`Sending receipt to ${this.recipientEmail}`);

    }

}

export default Transfer;
