import Transaction from '../model/Transactionmodel.js';


// ==========================================
// ADD TRANSACTION
// ==========================================

export const addTransaction = async (req, res) => {

    try {

        const {

            description,

            amount,

            status,

            recipientName,

            recipientAccount,

            bankIdentifierType,

            bankIdentifier,

            bankName,

            recipientEmail,

            recipientPhone

        } = req.body;


        const newTransaction = new Transaction({

            description,

            amount,

            status,

            recipientName,

            recipientAccount,

            bankIdentifierType,

            bankIdentifier,

            bankName,

            recipientEmail,

            recipientPhone

        });


        await newTransaction.save();


        res.status(201).json({

            message: 'Transaction added successfully',

            transaction: newTransaction

        });

    } catch (error) {

        console.error('Error adding transaction:', error);

        res.status(500).json({

            message: 'Error adding transaction',

            error: error.message

        });

    }

};


// ==========================================
// GET TRANSACTIONS
// ==========================================

export const getTransactions = async (req, res) => {

    try {

        const transactions = await Transaction.find()
            .sort({ date: -1 });

        res.status(200).json(transactions);

    } catch (error) {

        console.error('Error fetching transactions:', error);

        res.status(500).json({

            message: 'Error fetching transactions',

            error: error.message

        });

    }

};