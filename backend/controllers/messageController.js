const pool = require('../config/db');
const nodemailer = require('nodemailer');

exports.createMessage = async (req, res) => {
    try {
        // Fallback to admin ID 1 if the public frontend doesn't provide one
        const targetAdmin = req.body.admin_id || 2;
        const { nom, email, message } = req.body;

        const result = await pool.query(
            'INSERT INTO messages_contact (nom, email, message, admin_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [nom, email, message, targetAdmin]
        );

        res.status(201).json({ success: true, data: result.rows[0] });

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

        await transporter.sendMail(mailOptions);

    } catch (err) {
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Erreur serveur." });
        }
    }
};

exports.getMessages = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM messages_contact WHERE admin_id = $1 ORDER BY id DESC',
            [req.user.id]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await pool.query(
            "UPDATE messages_contact SET statut = 'lu' WHERE id = $1 AND admin_id = $2", 
            [req.params.id, req.user.id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM messages_contact WHERE id = $1 AND admin_id = $2', 
            [req.params.id, req.user.id]
        );
        res.json({ success: true, message: "Message supprimé." });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};