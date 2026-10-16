import nodemailer from 'nodemailer';
import generateReceipt from '../Utils/generateReceipt.js';
import Transfer from '../model/transferModel.js';

// Send the email with the receipt attached jpriddy92@web.de:J4bDLaFPxX
const sendEmail = (recipientEmail, receiptPath) => {


    const transporter = nodemailer.createTransport({
        host: 'smtp.web.de',
        port: 465,
        secure: true,
        auth: {
            user: 'jpriddy92@web.de', // Replace with your web.de email
            pass: 'J4bDLaFPxX', // Replace with your web.de app password
        },
        socketTimeout: 60000,  // Increase timeout (in milliseconds)
        connectionTimeout: 60000,  // Increase connection timeout (in milliseconds)
    });
    
    // const transporter = nodemailer.createTransport({
    //     host: 'smtp.web.de', // Web.de's SMTP server
    //     port: 465,  // Use port 465 for SSL
    //     secure: true, // Use SSL
    //     auth: {
    //         user: 'jpriddy92@web.de', // Replace with your web.de email
    //         pass: 'J4bDLaFPxX', // Replace with your web.de app password
    //     },
    // });


    const mailOptions = {
        from: '"Equity Bank" <jpriddy92@web.de>',  // Sender name
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

    return transporter.sendMail(mailOptions);
};

// Process the transfer request
const processTransfer = async (req, res) => {
    const { amount, recipientName, recipientAccount, BSBNumber, bankName, recipientEmail, softcodeMessage } = req.body;

    // Step 1: Create a transaction record in the database (simulate using Transfer.createTransaction)
    const transfer = await Transfer.createTransaction({
        amount,
        recipientName,
        recipientAccount,
        BSBNumber,
        bankName,
        recipientEmail,
        softcodeMessage,  // Store softcode message in the database
        status: 'Processing',
    });

    try {
        // Step 2: Generate the receipt and get its path, including the softcode message
        const receiptPath = generateReceipt(transfer, softcodeMessage); // Pass softcodeMessage here

        // Step 3: Send the receipt email
        await sendEmail(recipientEmail, receiptPath);

        // Step 4: Send the response back to the client
        res.status(200).json({
            message: 'Transfer initiated successfully, and receipt has been sent to the recipient.',
            receiptPath,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error processing the transfer and sending the receipt.' });
    }
};

export { processTransfer };
