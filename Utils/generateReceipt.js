import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import AppSettings from '../model/AppSettings.js';

const CURRENCY_RECEIPT_LABELS = {
    USD: '$',
    GBP: '£',
    EUR: '€',
    NGN: 'NGN ',
    CAD: 'CAD $',
    AUD: 'AUD $'
};

const generateReceipt = async (transfer) => {
    const settings = await AppSettings.findOne({ key: 'global' })
        .select('applicationName')
        .lean();
    const applicationName = settings?.applicationName
        || 'Crystaline International Group';
    return new Promise((resolve, reject) => {
        try {
            const userFolder = /^[a-f\d]{24}$/i.test(String(transfer.userId || ''))
                ? String(transfer.userId)
                : 'legacy';
            const receiptsDir = path.join(process.cwd(), 'receipts', userFolder);

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

            const finishReceipt = () => {
            const currency = transfer.currency || 'USD';
            const currencyLabel = CURRENCY_RECEIPT_LABELS[currency] || `${currency} `;

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
                .text(applicationName, {
                    align: 'center'
                });

            doc.moveDown(0.5);

            doc
                .fontSize(9)
                .font('Helvetica')
                .text('Transfer request document — not proof of independently verified settlement.', {
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
                .text(`${currencyLabel}${formattedAmount}`);

            if (transfer.accountLabel) {
                doc
                    .font('Helvetica-Bold')
                    .text('Source Account: ', { continued: true })
                    .font('Helvetica')
                    .text(transfer.accountLabel);
            }

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
                    'This document confirms a transfer request and is not proof of independently verified settlement.',
                    {
                        align: 'center',
                        width: 490
                    }
                );

            doc.moveDown(2);

            // Footer
            doc
                .fontSize(8)
                .text(`${applicationName} — Transfer Receipt`, {
                    align: 'center'
                });

            doc.end();

            writeStream.on('finish', () => {
                resolve(receiptPath);
            });

            writeStream.on('error', (error) => {
                reject(error);
            });
            };

            finishReceipt();

        } catch (error) {
            reject(error);
        }
    });
};

export default generateReceipt;