import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';

import generateReceipt from '../Utils/generateReceipt.js';
import { maskAccountNumber } from '../Utils/adminConfig.js';
import Transfer from '../model/transferModel.js';
import Transaction from '../model/Transactionmodel.js';
import { ensureAdminProfile } from './AdminController.js';
import AppSettings from '../model/AppSettings.js';

// ==========================================
// SEND EMAIL USING RESEND OR SMTP
// ==========================================

const sendEmail = async (recipientEmail, receiptPath, applicationName) => {

    let resendError = null;

    // OPTION 1: RESEND

    if (process.env.RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);

            const receiptBuffer = await fs.readFile(receiptPath);

            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM,
                to: recipientEmail,
                subject: `${applicationName} Transfer Receipt`,
                text: `Your ${applicationName} transfer request receipt is attached.`,
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
                subject: `${applicationName} Transfer Receipt`,
                text: `Your ${applicationName} transfer request receipt is attached.`,
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
    let savedTransaction = null;
    let receiptPath = null;

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
            accountId
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
        const profile = await ensureAdminProfile(req.user);
        const account = accountId
            ? profile?.accounts.find(
                item => String(item._id) === String(accountId) && item.isActive
            )
            : null;
        if (accountId && !account) {
            return res.status(400).json({
                success: false,
                error: 'Select an active account.'
            });
        }


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

        const maskedAccountNumber = account
            ? maskAccountNumber(account.accountNumber)
            : '';
        const transfer = await Transfer.createTransaction({

            amount: numericAmount,

            recipientName: cleanRecipientName,

            recipientAccount: cleanRecipientAccount,

            bankIdentifierType: cleanBankIdentifierType,

            bankIdentifier: cleanBankIdentifier,

            bankName: cleanBankName,

            recipientEmail: cleanRecipientEmail,

            recipientPhone: cleanRecipientPhone,

            accountId: account ? String(account._id) : '',
            userId: String(req.user._id),

            accountLabel: account
                ? `${account.type}${maskedAccountNumber ? ` (${maskedAccountNumber})` : ''}`
                : '',

            currency: profile?.currency || 'USD',

            status: 'Processing',

        });


        // ==========================================
        // STEP 2: SAVE TRANSACTION
        // ==========================================

        await transfer.save();
        savedTransaction = await Transaction.create({
            userId: req.user._id,
            source: 'transfer',
            date: new Date(),
            description: `Transfer request to ${cleanRecipientName}`,
            amount: -numericAmount,
            status: transfer.status,
            balance: null,
            accountId: account ? String(account._id) : '',
            isSimulated: true,
            recipientName: cleanRecipientName,
            recipientAccount: cleanRecipientAccount,
            bankIdentifierType: cleanBankIdentifierType,
            bankIdentifier: cleanBankIdentifier,
            bankName: cleanBankName,
            recipientEmail: cleanRecipientEmail,
            recipientPhone: cleanRecipientPhone
        });


        // ==========================================
        // STEP 3: GENERATE RECEIPT
        // ==========================================

        const receiptData = {
            ...transfer,
            _id: savedTransaction._id,
            userId: req.user._id,
            createdAt: savedTransaction.createdAt
        };
        receiptPath = await generateReceipt(receiptData);
        const applicationSettings = await AppSettings.findOne({ key: 'global' }).select(
            'applicationName'
        ).lean();
        const applicationName = applicationSettings?.applicationName
            || 'Crystaline International Group';


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
                    receiptPath,
                    applicationName
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
                transactionId: String(savedTransaction._id),
                receiptUrl: `/transfer/receipts/${savedTransaction._id}`,

                amount: transfer.amount,

                recipientName: transfer.recipientName,

                recipientAccount: transfer.recipientAccount,

                bankIdentifierType: transfer.bankIdentifierType,

                bankIdentifier: transfer.bankIdentifier,

                bankName: transfer.bankName,

                recipientEmail: transfer.recipientEmail,

                recipientPhone: transfer.recipientPhone,

                accountId: transfer.accountId,

                accountLabel: transfer.accountLabel,

                currency: transfer.currency,

                status: transfer.status,

                date: transfer.date

            }

        });

    } catch (error) {

        console.error('Transfer processing error:', error);
        if (savedTransaction) {
            try {
                await Transaction.deleteOne({
                    _id: savedTransaction._id,
                    userId: req.user._id,
                    deletedAt: null
                });
            } catch (cleanupError) {
                console.error('Failed to remove incomplete transfer request:', cleanupError);
            }
        }
        if (receiptPath) {
            try {
                await fs.unlink(receiptPath);
            } catch (cleanupError) {
                if (cleanupError.code !== 'ENOENT') {
                    console.error('Failed to remove incomplete transfer receipt:', cleanupError);
                }
            }
        }

        return res.status(500).json({

            success: false,

            error: 'Error processing the transfer request.',

            details: error.message

        });

    }

};

export async function downloadTransferReceipt(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid receipt identifier.' });
    }

    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user._id,
            deletedAt: null,
            $or: [
                { source: 'transfer' },
                { source: { $exists: false }, recipientName: { $exists: true, $ne: '' } }
            ]
        }).select('_id userId');
        if (!transaction) {
            return res.status(404).json({ message: 'Transfer receipt not found.' });
        }

        const receiptPath = path.join(
            process.cwd(),
            'receipts',
            String(req.user._id),
            `receipt_${transaction._id}.pdf`
        );
        await fs.access(receiptPath);
        return res.download(receiptPath, 'transfer-request-receipt.pdf', error => {
            if (error && !res.headersSent) {
                console.error('Failed to download transfer receipt:', error);
                res.status(500).json({ message: 'Unable to download the transfer receipt.' });
            }
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'Transfer receipt is no longer available.' });
        }
        console.error('Failed to load transfer receipt:', error);
        return res.status(500).json({ message: 'Unable to load the transfer receipt.' });
    }
}

export { processTransfer };