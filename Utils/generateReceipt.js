
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

// ==========================================
// GENERATE TRANSFER RECEIPT
// ==========================================

const generateReceipt = async (transfer, softcodeMessage = '') => {

    // ==========================================
    // CREATE RECEIPTS DIRECTORY
    // ==========================================

    const receiptsDirectory = path.resolve(
        process.cwd(),
        'receipts'
    );

    await fs.mkdir(receiptsDirectory, {
        recursive: true
    });


    // ==========================================
    // GENERATE RECEIPT FILE PATH
    // ==========================================

    const receiptPath = path.join(
        receiptsDirectory,
        `receipt_${transfer.id}.pdf`
    );


    // ==========================================
    // CREATE PDF DOCUMENT
    // ==========================================

    const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
            Title: 'Transfer Receipt',
            Author: 'Transfer Services'
        }
    });


    // ==========================================
    // START PDF WRITING
    // ==========================================

    const pdfPromise = pipeline(
        doc,
        createWriteStream(receiptPath)
    );


    // ==========================================
    // RECEIPT HEADER
    // ==========================================

    doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('Transfer Receipt', {
            align: 'center'
        });

    doc.moveDown(1);


    // ==========================================
    // RECEIPT INFORMATION
    // ==========================================

    doc.fontSize(10)
        .font('Helvetica');

    doc.text(`Receipt ID: ${transfer.id || 'N/A'}`);

    doc.text(
        `Date: ${transfer.date || new Date().toLocaleDateString('en-US')}`
    );

    doc.moveDown(1);


    // ==========================================
    // TRANSFER DETAILS
    // ==========================================

    doc.fontSize(13)
        .font('Helvetica-Bold')
        .text('Transfer Details');

    doc.moveDown(0.5);

    doc.fontSize(11)
        .font('Helvetica');

    doc.text(
        `Amount: USD ${Number(transfer.amount).toFixed(2)}`
    );

    doc.moveDown(0.3);

    doc.text(
        `Recipient: ${transfer.recipientName || 'N/A'}`
    );

    doc.moveDown(0.3);

    doc.text(
        `Account Number: ${transfer.recipientAccount || 'N/A'}`
    );

    doc.moveDown(0.3);


    // ==========================================
    // DYNAMIC BANK IDENTIFIER
    // ==========================================

    const identifierType =
        transfer.bankIdentifierType || 'Bank Identifier';

    const identifierValue =
        transfer.bankIdentifier || 'N/A';

    doc.text(
        `${identifierType}: ${identifierValue}`
    );

    doc.moveDown(0.3);


    // ==========================================
    // BANK DETAILS
    // ==========================================

    doc.text(
        `Bank: ${transfer.bankName || 'N/A'}`
    );

    doc.moveDown(0.3);

    doc.text(
        `Recipient Email: ${transfer.recipientEmail || 'N/A'}`
    );

    doc.moveDown(1);


    // ==========================================
    // TRANSFER STATUS
    // ==========================================

    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(`Status: ${transfer.status || 'Processing'}`);

    doc.moveDown(1);


    // ==========================================
    // SOFTCODE MESSAGE
    // ==========================================

    if (softcodeMessage) {

        doc.fontSize(13)
            .font('Helvetica-Bold')
            .text('Additional Transfer Information');

        doc.moveDown(0.5);

        doc.fontSize(10)
            .font('Helvetica')
            .text(softcodeMessage, {
                width: 490,
                align: 'left'
            });

        doc.moveDown(1);

    }


    // ==========================================
    // RECEIPT DISCLAIMER
    // ==========================================

    doc.moveDown(1);

    doc.fontSize(9)
        .font('Helvetica')
        .text(
            'This document confirms receipt of a transfer request only. It is not proof of completed payment or settlement. Confirm the transaction directly with the authorized financial institution.',
            {
                width: 490,
                align: 'left'
            }
        );


    // ==========================================
    // FINALIZE PDF
    // ==========================================

    doc.end();

    // Wait until the PDF file is completely written.

    await pdfPromise;


    // ==========================================
    // RETURN RECEIPT PATH
    // ==========================================

    console.log(
        'Transfer receipt generated successfully:',
        receiptPath
    );

    return receiptPath;

};

export default generateReceipt;
