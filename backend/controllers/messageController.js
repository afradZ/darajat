const pool = require('../config/db');

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