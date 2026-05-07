require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Allows your frontend to talk to your backend
const { Pool } = require('pg'); // PostgreSQL client

const app = express();
app.use(cors());
app.use(express.json()); // Allows the server to understand JSON data

// 1. Database Connection Setup
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// ==========================================
// 2. API ENDPOINTS
// ==========================================

// Endpoint A: Handle Inscription
app.post('/api/inscription', async (req, res) => {
    try {
        const { nom, email, telephone, formation } = req.body;
        
        // Save to PostgreSQL
        const result = await pool.query(
            'INSERT INTO inscriptions (nom_complet, email, telephone, formation) VALUES ($1, $2, $3, $4) RETURNING *',
            [nom, email, telephone, formation]
        );
        
        res.status(201).json({ success: true, message: "Inscription réussie !", data: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: "Erreur lors de l'inscription." });
    }
});

// Endpoint B: Verify Certificate
app.post('/api/verification', async (req, res) => {
    // 1. THE SPY: This will print the exact moment the frontend knocks on the door
    console.log(" Demande de vérification reçue ! Données :", req.body); 

    try {
        const { code } = req.body;
        
        const result = await pool.query(
            'SELECT * FROM attestations WHERE code_attestation = $1 AND est_valide = TRUE',
            [code]
        );
        
        if (result.rows.length > 0) {
            console.log(" Code trouvé pour:", result.rows[0].nom_etudiant);
            res.json({ valide: true, etudiant: result.rows[0].nom_etudiant });
        } else {
            console.log(" Code introuvable dans la base de données.");
            res.json({ valide: false });
        }
    } catch (err) {
        // 2. THE ALARM: This prints the FULL error, not just the message
        console.error(" ERREUR CRITIQUE BASE DE DONNÉES :", err); 
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
});

// Endpoint C: Handle Contact Form
app.post('/api/contact', async (req, res) => {
    console.log(" Nouveau message de contact reçu :", req.body); // <-- Debugging spy added
    
    try {
        const { nom, email, message } = req.body;
        
        // Save message to database
        await pool.query(
            'INSERT INTO messages_contact (nom, email, message) VALUES ($1, $2, $3)',
            [nom, email, message]
        );
        
        console.log(" Message sauvegardé avec succès !"); // <-- Debugging spy added
        // Note: Later, you can add "Nodemailer" here to instantly email the school admin!
        res.status(200).json({ success: true, message: "Message envoyé !" });
    } catch (err) {
        console.error(" ERREUR SAUVEGARDE MESSAGE :", err); // <-- Better error tracing
        res.status(500).json({ success: false, message: "Erreur lors de l'envoi." });
    }
});

// 3. Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Serveur Darajat en ligne sur http://localhost:${PORT}`);
});