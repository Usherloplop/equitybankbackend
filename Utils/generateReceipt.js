import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const generateReceipt = (transfer, softcodeMessage = '') => {
    return new Promise((resolve, reject) => {
        try {
            const receiptsDir = path.join(process.cwd(), 'receipts');

            // Create receipts directory if it does not exist
            if (!fs.existsSync(receiptsDir)) {
                fs.mkdirSync(receiptsDir, { recursive: true });
            }

            const receiptId = transfer._id || transfer.id || Date.now();

            const receiptPath = path.join(
                receiptsDir,
                `receipt_${receiptId}.pdf`
            );

            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const writeStream = fs.createWriteStream(receiptPath);

            doc.pipe(writeStream);

            // Format amount with thousands separators
            const formattedAmount = Number(transfer.amount || 0).toLocaleString(
                'en-US',
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

            // Receipt Header
            doc
                .fontSize(22)
                .font('Helvetica-Bold')
                .text('TRANSFER RECEIPT', {
                    align: 'center'
                });

            doc.moveDown(0.5);

            doc
                .fontSize(10)
                .font('Helvetica')
                .text('Transfer Document', {
                    align: 'center'
                });

            doc.moveDown(1.5);

            // Receipt Information
            doc
                .fontSize(11)
                .font('Helvetica-Bold')
                .text(`Receipt ID: ${receiptId}`);

            doc
                .font('Helvetica')
                .text(
                    `Date: ${new Date(
                        transfer.createdAt || transfer.date || Date.now()
                    ).toLocaleString('en-US')}`
                );

            doc.moveDown(1.5);

            // Transfer Details Heading
            doc
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Transfer Details');

            doc.moveDown(0.7);

            doc
                .fontSize(11)
                .font('Helvetica');

            // Amount
            doc
                .font('Helvetica-Bold')
                .text('Amount: ', { continued: true })
                .font('Helvetica')
                .text(`$${formattedAmount}`);

            // Recipient Name
            doc
                .font('Helvetica-Bold')
                .text('Recipient Name: ', { continued: true })
                .font('Helvetica')
                .text(transfer.recipientName || '');

            // Recipient Account Number - optional
            if (transfer.recipientAccount) {
                doc
                    .font('Helvetica-Bold')
                    .text('Recipient Account Number: ', { continued: true })
                    .font('Helvetica')
                    .text(transfer.recipientAccount);
            }

            // Bank Identifier Type and Bank Identifier
            if (transfer.bankIdentifierType && transfer.bankIdentifier) {
                doc
                    .font('Helvetica-Bold')
                    .text(`${transfer.bankIdentifierType}: `, {
                        continued: true
                    })
                    .font('Helvetica')
                    .text(transfer.bankIdentifier);

            } else if (transfer.bankIdentifierType) {
                doc
                    .font('Helvetica-Bold')
                    .text('Bank Identifier Type: ', {
                        continued: true
                    })
                    .font('Helvetica')
                    .text(transfer.bankIdentifierType);

            } else if (transfer.bankIdentifier) {
                doc
                    .font('Helvetica-Bold')
                    .text('Bank Identifier: ', {
                        continued: true
                    })
                    .font('Helvetica')
                    .text(transfer.bankIdentifier);
            }

            // Bank Name - optional
            if (transfer.bankName) {
                doc
                    .font('Helvetica-Bold')
                    .text('Bank Name: ', { continued: true })
                    .font('Helvetica')
                    .text(transfer.bankName);
            }

            // Recipient Email - optional
            if (transfer.recipientEmail) {
                doc
                    .font('Helvetica-Bold')
                    .text('Recipient Email: ', { continued: true })
                    .font('Helvetica')
                    .text(transfer.recipientEmail);
            }

            // Recipient Phone Number - optional
            if (transfer.recipientPhone) {
                doc
                    .font('Helvetica-Bold')
                    .text('Recipient Phone Number: ', {
                        continued: true
                    })
                    .font('Helvetica')
                    .text(transfer.recipientPhone);
            }

            doc.moveDown(1);

            // Transfer Status
            doc
                .font('Helvetica-Bold')
                .text('Status: ', { continued: true })
                .font('Helvetica')
                .text(transfer.status || 'Processing');

            // Additional Transfer Information
            if (softcodeMessage) {
                doc.moveDown(1);

                doc
                    .fontSize(12)
                    .font('Helvetica-Bold')
                    .text('Additional Transfer Information');

                doc.moveDown(0.5);

                doc
                    .fontSize(10)
                    .font('Helvetica')
                    .text(softcodeMessage, {
                        width: 490,
                        align: 'left'
                    });
            }

            doc.moveDown(2);

            // Important Disclaimer
            doc
                .fontSize(9)
                .font('Helvetica-Bold')
                .text('IMPORTANT NOTICE', {
                    align: 'center'
                });

            doc.moveDown(0.5);

            doc
                .fontSize(9)
                .font('Helvetica')
                .text(
                    'This document confirms receipt of a transfer.',
                    {
                        align: 'center',
                        width: 490
                    }
                );

            doc.moveDown(2);

            // Footer
            doc
                .fontSize(8)
                .text('Transfer Receipt', {
                    align: 'center'
                });

            doc.end();

            writeStream.on('finish', () => {
                resolve(receiptPath);
            });

            writeStream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

export default generateReceipt;