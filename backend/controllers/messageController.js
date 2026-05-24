const pool = require('../config/db');
const nodemailer = require('nodemailer');

exports.createMessage = async (req, res) => {
    try {
        const { nom, email, message } = req.body;
        await pool.query(
            'INSERT INTO messages_contact (nom, email, message) VALUES ($1, $2, $3)',
            [nom, email, message]
        );
        res.status(200).json({ success: true, message: "Message envoyé !" });
    } catch (err) {
        console.error("ERREUR SAUVEGARDE MESSAGE:", err);
        res.status(500).json({ success: false, message: "Erreur lors de l'envoi." });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM messages_contact ORDER BY id DESC');
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Erreur lecture messages:", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await pool.query("UPDATE messages_contact SET statut = 'lu' WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        await pool.query('DELETE FROM messages_contact WHERE id = $1', [req.params.id]);
        res.json({ success: true, message: "Message supprimé." });
    } catch (err) {
        console.error("Erreur suppression message:", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

exports.createMessage = async (req, res) => {
    try {
        console.log("--- NOUVELLE REQUÊTE DE CONTACT ---");
        const { nom, email, message } = req.body;

        // Save to DB
        const result = await pool.query(
            'INSERT INTO messages_contact (nom, email, message) VALUES ($1, $2, $3) RETURNING *',
            [nom, email, message]
        );
        console.log("1. Base de données : OK");

        // Respond to frontend
        res.status(201).json({ success: true, data: result.rows[0] });
        console.log("2. Réponse Frontend : OK");

        // Setup Mailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Send Email
        const mailOptions = {
            from: `"Dashboard Darajat" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, 
            replyTo: email, 
            subject: `Nouveau message : ${nom}`,
            text: `Nom : ${nom}\nEmail : ${email}\n\nMessage :\n${message}`
        };

        console.log("3. Tentative d'envoi à Google...");
        const info = await transporter.sendMail(mailOptions);
        console.log("4. ✅ Email envoyé. ID:", info.messageId);

    } catch (err) {
        console.error("🚨 ERREUR:", err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Erreur serveur." });
        }
    }
};