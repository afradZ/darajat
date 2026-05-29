require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');


const pool = require('./config/db'); 
const messageRoutes = require('./routes/messageRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

app.set('trust proxy', 1);

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

app.use(helmet());

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (origin === 'https://darajat-lilac.vercel.app') {
            return callback(null, true);
        }

        const isVercelPreview = /^https:\/\/darajat-[a-zA-Z0-9]+-afradzs-projects\.vercel\.app$/.test(origin);
        
        if (isVercelPreview) {
            return callback(null, true);
        }

        return callback(new Error('Bloqué par CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); 

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { success: false, message: "Trop de requêtes, veuillez réessayer plus tard." }
});
app.use('/api/', apiLimiter);

const loginLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 5 
});
app.use('/api/login', loginLimiter);


app.use('/api', messageRoutes);
app.use('/api', studentRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Darajat API is live." });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isValidMatch = await bcrypt.compare(password, user.password_hash);

        if (!isValidMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' }
        );


        res.json({ success: true, token });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur Darajat en ligne sur le port ${PORT}`);
});

