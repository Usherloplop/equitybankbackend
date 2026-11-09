
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

    // --------------------------------------
    // OPTION 1: RESEND API
    // --------------------------------------

    if (process.env.RESEND_API_KEY) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY);

            const receiptBuffer = await fs.readFile(receiptPath);

            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM,
                to: recipientEmail,
                subject: 'Transfer Receipt',
                text: 'Your transfer receipt is attached.',
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

            console.error(
                'Resend failed:',
                error.message
            );
        }
    }

    // --------------------------------------
    // OPTION 2: SMTP
    // --------------------------------------

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

                // Port 465 uses SSL.
                // Port 587 uses STARTTLS.
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

            const mailOptions = {
                from:
                    process.env.SMTP_FROM ||
                    process.env.SMTP_USER,

                to: recipientEmail,

                subject: 'Transfer Receipt',

                text: 'Your transfer has been successfully processed. Please find the receipt attached.',

                attachments: [
                    {
                        filename: 'transfer_receipt.pdf',
                        path: receiptPath,
                    },
                ],
            };

            const info = await transporter.sendMail(mailOptions);

            console.log('Email sent successfully using SMTP');

            return {
                success: true,
                provider: 'SMTP',
                messageId: info.messageId,
            };

        } catch (smtpError) {

            console.error(
                'SMTP failed:',
                smtpError.message
            );

            throw new Error(
                `Email delivery failed. Resend: ${
                    resendError?.message || 'Not configured'
                }. SMTP: ${smtpError.message}`
            );
        }
    }

    // --------------------------------------
    // NO EMAIL PROVIDER AVAILABLE
    // --------------------------------------

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
// PROCESS TRANSFER
// ==========================================

const processTransfer = async (req, res) => {

    try {

        const {
            amount,
            recipientName,
            recipientAccount,
            BSBNumber,
            bankName,
            recipientEmail,
            softcodeMessage
        } = req.body;


        // STEP 1: CREATE TRANSACTION

        const transfer = await Transfer.createTransaction({
            amount,
            recipientName,
            recipientAccount,
            BSBNumber,
            bankName,
            recipientEmail,
            softcodeMessage,
            status: 'Processing',
        });


        // STEP 2: GENERATE RECEIPT

        const receiptPath = await generateReceipt(
            transfer,
            softcodeMessage
        );


        // STEP 3: SEND RECEIPT EMAIL

        const emailResult = await sendEmail(
            recipientEmail,
            receiptPath
        );


        // STEP 4: SEND RESPONSE

        return res.status(200).json({

            success: true,

            message: 'Transfer request processed and receipt email sent successfully.',

            emailProvider: emailResult.provider,

            emailMessageId: emailResult.messageId,

            receiptPath,

        });

    } catch (error) {

        console.error(
            'Transfer processing error:',
            error
        );

        return res.status(500).json({

            success: false,

            error: 'Error processing the transfer or sending the receipt.',

            details: error.message,

        });
    }
};


export { processTransfer };







// import nodemailer from 'nodemailer';
// import generateReceipt from '../Utils/generateReceipt.js';
// import Transfer from '../model/transferModel.js';

// // Send the email with the receipt attached jpriddy92@web.de:J4bDLaFPxX
// const sendEmail = (recipientEmail, receiptPath) => {


//     const transporter = nodemailer.createTransport({
//         host: 'smtp.web.de',
//         port: 465,
//         secure: true,
//         auth: {
//             user: 'jpriddy92@web.de', // Replace with your web.de email
//             pass: 'J4bDLaFPxX', // Replace with your web.de app password
//         },
//         socketTimeout: 60000,  // Increase timeout (in milliseconds)
//         connectionTimeout: 60000,  // Increase connection timeout (in milliseconds)
//     });
    
//     // const transporter = nodemailer.createTransport({
//     //     host: 'smtp.web.de', // Web.de's SMTP server
//     //     port: 465,  // Use port 465 for SSL
//     //     secure: true, // Use SSL
//     //     auth: {
//     //         user: 'jpriddy92@web.de', // Replace with your web.de email
//     //         pass: 'J4bDLaFPxX', // Replace with your web.de app password
//     //     },
//     // });


//     const mailOptions = {
//         from: '"Crystal Line Bank" <jpriddy92@web.de>',  // Sender name
//         to: recipientEmail,
//         subject: 'Transfer Receipt',
//         text: 'Your transfer has been successfully processed. Please find the receipt attached.',
//         attachments: [
//             {
//                 filename: 'transfer_receipt.pdf',
//                 path: receiptPath,
//             },
//         ],
//     };

//     return transporter.sendMail(mailOptions);
// };

// // Process the transfer request
// const processTransfer = async (req, res) => {
//     const { amount, recipientName, recipientAccount, BSBNumber, bankName, recipientEmail, softcodeMessage } = req.body;

//     // Step 1: Create a transaction record in the database (simulate using Transfer.createTransaction)
//     const transfer = await Transfer.createTransaction({
//         amount,
//         recipientName,
//         recipientAccount,
//         BSBNumber,
//         bankName,
//         recipientEmail,
//         softcodeMessage,  // Store softcode message in the database
//         status: 'Processing',
//     });

//     try {
//         // Step 2: Generate the receipt and get its path, including the softcode message
//         const receiptPath = generateReceipt(transfer, softcodeMessage); // Pass softcodeMessage here

//         // Step 3: Send the receipt email
//         await sendEmail(recipientEmail, receiptPath);

//         // Step 4: Send the response back to the client
//         res.status(200).json({
//             message: 'Transfer initiated successfully, and receipt has been sent to the recipient.',
//             receiptPath,
//         });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'Error processing the transfer and sending the receipt.' });
//     }
// };

// export { processTransfer };
