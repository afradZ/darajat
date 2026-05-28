require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = require('./config/db'); 
const messageRoutes = require('./routes/messageRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json()); 

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

app.get('/api/debug-users', async (req, res) => {
    try {
        const result = await pool.query('SELECT username, password_hash FROM users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.listen(PORT, () => {
    console.log(`Serveur Darajat en ligne sur le port ${PORT}`);
});

