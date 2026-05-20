require('dotenv').config();
const express = require('express');
const cors = require('cors'); 
const { Pool } = require('pg'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

const authenticateToken = (req, res, next) => {
    // Expects header format: "Authorization: Bearer <token>"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) return res.status(401).json({ success: false, message: "Accès refusé" });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ success: false, message: "Token invalide ou expiré" });
        req.user = user;
        next(); // Token is good, proceed to the route
    });
};

// 2. API ENDPOINTS 

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
    try {
        const { code } = req.body;
        
        const result = await pool.query(
            'SELECT nom_etudiant, formation, date_emission FROM attestations WHERE code_unique = $1 AND est_valide = TRUE',
            [code]
        );
        
        if (result.rows.length > 0) {
            res.json({ valide: true, ...result.rows[0] });
        } else {
            res.json({ valide: false });
        }
    } catch (err) {
        console.error("Erreur vérification:", err);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
});

app.post('/api/admin/attestations', authenticateToken, async (req, res) => {
    try {
        const { nom_etudiant, formation } = req.body;
        if (!nom_etudiant || !formation) return res.status(400).json({ success: false, message: "Données incomplètes." });

        // 1. Verify student exists
        const checkStudent = await pool.query(
            'SELECT id FROM inscriptions WHERE nom_complet = $1 AND formation = $2',
            [nom_etudiant, formation]
        );

        if (checkStudent.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Étudiant non trouvé dans cette formation." });
        }

        // 2. Check for an existing certificate to prevent duplicates
        const existingCert = await pool.query(
            'SELECT * FROM attestations WHERE nom_etudiant = $1 AND formation = $2',
            [nom_etudiant, formation]
        );

        if (existingCert.rows.length > 0) {
            return res.status(200).json({ 
                success: true, 
                message: "Code existant récupéré.",
                data: existingCert.rows[0] 
            });
        }

        // 3. Generate new if none exists
        const year = new Date().getFullYear();
        const randomHex = require('crypto').randomBytes(3).toString('hex').toUpperCase();
        const codeUnique = `DAR-${year}-${randomHex}`;

        const result = await pool.query(
            'INSERT INTO attestations (code_unique, nom_etudiant, formation) VALUES ($1, $2, $3) RETURNING *',
            [codeUnique, nom_etudiant, formation]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
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

// Endpoint D: Récupérer tous les messages (Admin)
app.get('/api/admin/messages', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM messages_contact ORDER BY id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("🚨 Erreur lecture messages:", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

// Endpoint E: Récupérer toutes les inscriptions (Admin)
// GET: Récupérer les inscriptions avec pagination et filtres serveur
app.get('/api/admin/inscriptions', authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 5, search = '', status = 'all', formation = 'all' } = req.query;
        const offset = (page - 1) * limit;

        let baseQuery = 'FROM inscriptions WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Dynamic filter construction
        if (search) {
            baseQuery += ` AND (nom_complet ILIKE $${paramIndex} OR formation ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (status !== 'all') {
            // Adjust to match DB default fallback if null
            baseQuery += ` AND COALESCE(statut_scolaire, 'En cours') = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (formation !== 'all') {
            baseQuery += ` AND formation = $${paramIndex}`;
            params.push(formation);
            paramIndex++;
        }

        // 1. Get total count for the pagination UI
        const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
        const totalItems = parseInt(countRes.rows[0].count);

        // NEW: Get strictly the unread count for the dashboard badge
        const unreadRes = await pool.query(`SELECT COUNT(*) ${baseQuery} AND (statut IS NULL OR statut != 'lu')`, params);
        const unreadItems = parseInt(unreadRes.rows[0].count);

        // 2. Get the specific chunk of data
        const dataRes = await pool.query(
            `SELECT * ${baseQuery} ORDER BY nom_complet ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, 
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: dataRes.rows,
            meta: {
                totalItems,
                unreadItems, // <-- We now send this to the frontend
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit)
            }
        });
    } catch (err) {
        console.error("Erreur pagination:", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

// Endpoint F: Marquer un message comme lu
app.put('/api/admin/messages/:id/lu', authenticateToken, async (req, res) => {
    try {
        await pool.query("UPDATE messages_contact SET statut = 'lu' WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Endpoint G: Marquer une inscription comme lue
app.put('/api/admin/inscriptions/:id/lu', authenticateToken, async (req, res) => {
    try {
        await pool.query("UPDATE inscriptions SET statut = 'lu' WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Endpoint H: Supprimer un message
app.delete('/api/admin/messages/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM messages_contact WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: "Message supprimé." });
    } catch (err) {
        console.error("🚨 Erreur suppression message:", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});

// Endpoint I: Supprimer une inscription
app.delete('/api/admin/inscriptions/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM inscriptions WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: "Inscription supprimée." });
    } catch (err) {
        console.error("🚨 Erreur suppression inscription:", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
});
// Endpoint J: Login pour l'admin
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

        // Token expires in 12 hours 
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

// Endpoint K: Mettre à jour le statut scolaire d'un étudiant
app.put('/api/admin/etudiants/:id/statut', authenticateToken, async (req, res) => {
    try {
        const { statut_scolaire } = req.body;
        await pool.query(
            'UPDATE inscriptions SET statut_scolaire = $1 WHERE id = $2',
            [statut_scolaire, req.params.id]
        );
        res.json({ success: true, message: "Statut mis à jour." });
    } catch (err) {
        console.error("Erreur maj statut:", err);
        res.status(500).json({ success: false });
    }
});

// Endpoint M: Ajouter un étudiant manuellement (Admin)
app.post('/api/admin/etudiants', authenticateToken, async (req, res) => {
    try {
        const { nom, email, telephone, formation } = req.body;
        const result = await pool.query(
            'INSERT INTO inscriptions (nom_complet, email, telephone, formation, statut_scolaire) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nom, email, telephone, formation, 'En cours']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error("Erreur ajout manuel:", err);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
});

// 3. Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(` Serveur Darajat en ligne sur http://localhost:${PORT}`);
});


