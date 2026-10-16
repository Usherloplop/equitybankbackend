// import cors from 'cors';

// const corsOptions = {
//   origin: 'http://127.0.0.1:5501',  // Adjust this to the specific frontend URL
//   methods: ['GET', 'POST'],         // Allowed methods
//   allowedHeaders: ['Content-Type'], // Allowed headers
// };

// export default cors(corsOptions);  // Export the configured CORS middleware

const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://127.0.0.1:5500',  // Local development URL
            'https://equitybanking-invest.vercel.app' // Your production frontend URL
        ];// Add your frontend origin(s) here
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow the request
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Enable credentials (cookies/auth headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

export default corsOptions;