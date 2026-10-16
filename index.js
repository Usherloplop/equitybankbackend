import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import transactionRoutes from './Routes/Routes.js';
import userRoutes from './Routes/Routes.js';
import bodyParser from 'body-parser';
import corsOptions from './corsConfig.js'; // Import the CORS configuration
import transferRoutes from './Routes/transferRoutes.js';
import softcodeRoutes from './Routes/softcodeRoutes.js'
import addAdminTransactionRoutes from './Routes/addadmintransactionRoutes.js';



dotenv.config();

const app = express();

// Middleware for parsing JSON
app.use(bodyParser.json());

// CORS Configuration
// const corsOptions = {
//     origin: '*', // Allow requests from any origin
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
// };

app.use(cors(corsOptions)); // Apply the CORS middleware

// Routes
app.use('/api', transactionRoutes);  // Handles transactions
app.use('/api/users', userRoutes);   // Handles user-related operations

// Routes
app.use('/api/transfer', transferRoutes);

app.use('/api/softcode', softcodeRoutes);

app.use('/api/addadmin', addAdminTransactionRoutes);


// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Catch-All Route for Undefined Endpoints
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(error => console.error('MongoDB connection error:', error));

// Start the Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on ports ${PORT}`);
});
