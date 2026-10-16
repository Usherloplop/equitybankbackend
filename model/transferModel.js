class Transfer {
    constructor({ amount, recipientName, recipientAccount, BSBNumber, bankName, recipientEmail, status, softcodeMessage = '' }) {
        this.amount = amount;
        this.recipientName = recipientName;
        this.recipientAccount = recipientAccount;
        this.BSBNumber = BSBNumber;
        this.bankName = bankName;
        this.recipientEmail = recipientEmail;
        this.status = status;
        this.softcodeMessage = softcodeMessage; // new field for softcode
        this.date = new Date().toLocaleDateString('en-US'); // formatted date
    }

    // Static method to create a new transfer object
    static createTransaction(transactionData) {
        return new Transfer(transactionData);
    }

    // This method simulates saving the transfer in a database (you can extend it to use a real database)
    save() {
        // Here, you would typically save the transfer to a database.
        // Since we're simulating, we'll just log the transfer data.
        console.log('Transaction saved:', this);
    }

    // This method can simulate sending the transfer as an email receipt
    async sendReceipt() {
        // In a real implementation, you would send an email with this.transfer's details.
        // For now, it logs that the receipt is being sent.
        console.log(`Sending receipt to ${this.recipientEmail}`);
    }
}

export default Transfer;
