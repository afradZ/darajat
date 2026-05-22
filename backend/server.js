require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 1. Import your isolated DB connection and modular routes
const pool = require('./config/db'); 
const messageRoutes = require('./routes/messageRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
app.use(cors());
app.use(express.json()); 

// 2. Mount the modular routes
app.use('/api', messageRoutes);
app.use('/api', studentRoutes);

// 3. Keep Login here (for now)
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

// 4. Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur Darajat en ligne sur http://localhost:${PORT}`);
});

