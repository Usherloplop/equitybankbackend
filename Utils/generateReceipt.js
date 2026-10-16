import PDFDocument from 'pdfkit';
import fs from 'fs';

// Function to generate the receipt as a PDF file
const generateReceipt = (transfer, softcodeMessage) => {
    const doc = new PDFDocument();
    const receiptPath = `./receipts/receipt_${transfer.id}.pdf`; // Path where the receipt will be saved
    doc.pipe(fs.createWriteStream(receiptPath));  // Pipe the PDF output to the file system

    doc.fontSize(16).text('Transfer Receipt', { align: 'center' });
    doc.text(`\nAmount: USD${transfer.amount}`, { align: 'left' });
    doc.text(`Recipient: ${transfer.recipientName}`, { align: 'left' });
    doc.text(`Account Number: ${transfer.recipientAccount}`, { align: 'left' });
    doc.text(`Routing Number: ${transfer.routingNumber}`, { align: 'left' });
    doc.text(`Bank: ${transfer.bankName}`, { align: 'left' });
    doc.text(`Email: ${transfer.recipientEmail}`, { align: 'left' });

    // Add the softcode message (if provided)
    if (softcodeMessage) {
        doc.text(`\nSoftcode Message: ${softcodeMessage}`, { align: 'left' });
    }

    doc.end();  // Finalize the document

    return receiptPath;  // Return the path to the generated receipt
};

export default generateReceipt;
