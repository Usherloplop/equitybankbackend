import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import fs from 'fs/promises';

import generateReceipt from '../Utils/generateReceipt.js';
import Transfer from '../model/transferModel.js';

// ==========================================
// SEND EMAIL USING RESEND OR SMTP
// ==========================================

const sendEmail = async (recipientEmail, receiptPath) => {

    let resendError = null;

    // OPTION 1: RESEND

    if (process.env.RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);

            const receiptBuffer = await fs.readFile(receiptPath);

            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM,
                to: recipientEmail,
                subject: 'Transfer Receipt',
                text: 'Your transfer request receipt is attached.',
                attachments: [
                    {
                        filename: 'transfer_receipt.pdf',
                        content: receiptBuffer.toString('base64'),
                    },
                ],
            });

            if (error) {
                throw new Error(error.message);
            }

            console.log('Email sent successfully using Resend');

            return {
                success: true,
                provider: 'Resend',
                messageId: data?.id,
            };

        } catch (error) {
            resendError = error;
            console.error('Resend failed:', error.message);
        }
    }

    // OPTION 2: SMTP

    if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    ) {
        try {
            const port = Number(process.env.SMTP_PORT || 587);

            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port,
                secure: port === 465,
                requireTLS: port === 587,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
                connectionTimeout: 60000,
                socketTimeout: 60000,
                greetingTimeout: 30000,
            });

            const info = await transporter.sendMail({
                from: process.env.SMTP_FROM || process.env.SMTP_USER,
                to: recipientEmail,
                subject: 'Transfer Receipt',
                text: 'Your transfer request receipt is attached.',
                attachments: [
                    {
                        filename: 'transfer_receipt.pdf',
                        path: receiptPath,
                    },
                ],
            });

            console.log('Email sent successfully using SMTP');

            return {
                success: true,
                provider: 'SMTP',
                messageId: info.messageId,
            };

        } catch (smtpError) {
            console.error('SMTP failed:', smtpError.message);

            throw new Error(
                `Email delivery failed. Resend: ${
                    resendError?.message || 'Not configured'
                }. SMTP: ${smtpError.message}`
            );
        }
    }

    if (resendError) {
        throw new Error(
            `Resend failed and SMTP is not configured: ${resendError.message}`
        );
    }

    throw new Error(
        'No email provider configured. Please configure Resend or SMTP.'
    );
};


// ==========================================
// NORMALIZE OPTIONAL VALUES
// ==========================================

const optionalValue = (value) => {
    return typeof value === 'string' ? value.trim() : '';
};


// ==========================================
// PROCESS TRANSFER
// ==========================================

const processTransfer = async (req, res) => {

    try {

        const {
            amount,
            recipientName,
            recipientAccount,
            bankIdentifierType,
            bankIdentifier,
            bankName,
            recipientEmail,
            recipientPhone,
            softcodeMessage
        } = req.body;


        // ==========================================
        // VALIDATE REQUIRED FIELDS
        // ==========================================

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid transfer amount.'
            });
        }

        const cleanRecipientName = optionalValue(recipientName);

        if (!cleanRecipientName) {
            return res.status(400).json({
                success: false,
                error: 'Recipient name is required.'
            });
        }


        // ==========================================
        // OPTIONAL FIELD VALUES
        // ==========================================

        const cleanRecipientAccount = optionalValue(recipientAccount);

        const cleanBankIdentifierType = optionalValue(bankIdentifierType);

        const cleanBankIdentifier = optionalValue(bankIdentifier);

        const cleanBankName = optionalValue(bankName);

        const cleanRecipientEmail = optionalValue(recipientEmail);

        const cleanRecipientPhone = optionalValue(recipientPhone);


        // Validate email only if supplied.

        if (
            cleanRecipientEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanRecipientEmail)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid recipient email address.'
            });
        }


        // ==========================================
        // STEP 1: CREATE TRANSACTION
        // ==========================================

        const transfer = await Transfer.createTransaction({

            amount: numericAmount,

            recipientName: cleanRecipientName,

            recipientAccount: cleanRecipientAccount,

            bankIdentifierType: cleanBankIdentifierType,

            bankIdentifier: cleanBankIdentifier,

            bankName: cleanBankName,

            recipientEmail: cleanRecipientEmail,

            recipientPhone: cleanRecipientPhone,

            softcodeMessage,

            status: 'Processing',

        });


        // ==========================================
        // STEP 2: SAVE TRANSACTION
        // ==========================================

        await transfer.save();


        // ==========================================
        // STEP 3: GENERATE RECEIPT
        // ==========================================

        const receiptPath = await generateReceipt(
            transfer,
            softcodeMessage
        );


        // ==========================================
        // STEP 4: SEND EMAIL ONLY IF EMAIL EXISTS
        // ==========================================

        let emailResult = {
            success: false,
            sent: false,
            reason: 'No recipient email supplied.'
        };

        if (cleanRecipientEmail) {

            try {

                emailResult = await sendEmail(
                    cleanRecipientEmail,
                    receiptPath
                );

                emailResult.sent = true;

            } catch (emailError) {

                console.error(
                    'Email delivery failed:',
                    emailError.message
                );

                emailResult = {
                    success: false,
                    sent: false,
                    reason: emailError.message
                };

            }

        }


        // ==========================================
        // STEP 5: SEND RESPONSE
        // ==========================================

        return res.status(200).json({

            success: true,

            message: 'Transfer request submitted successfully.',

            status: transfer.status,

            emailSent: emailResult.sent,

            emailProvider: emailResult.provider || null,

            emailMessageId: emailResult.messageId || null,

            emailMessage: emailResult.reason || null,

            receiptGenerated: true,

            transfer: {

                id: transfer.id,

                amount: transfer.amount,

                recipientName: transfer.recipientName,

                recipientAccount: transfer.recipientAccount,

                bankIdentifierType: transfer.bankIdentifierType,

                bankIdentifier: transfer.bankIdentifier,

                bankName: transfer.bankName,

                recipientEmail: transfer.recipientEmail,

                recipientPhone: transfer.recipientPhone,

                status: transfer.status,

                date: transfer.date

            }

        });

    } catch (error) {

        console.error('Transfer processing error:', error);

        return res.status(500).json({

            success: false,

            error: 'Error processing the transfer request.',

            details: error.message

        });

    }

};

export { processTransfer };