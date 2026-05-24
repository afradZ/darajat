const pool = require('../config/db');
const crypto = require('crypto');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// --- PUBLIC ROUTES ---
// 1. The Aggressive Normalizer
const normalizeKey = (str) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '');
};


const brochureMap = {
    'designgraphiqueuiux': {
        filename: 'Programme_UI_UX.pdf',
        path: path.join(__dirname, '../assets/brochures/ui-ux.pdf')
    },
    'developpementwebingenierielogicielle': {
        filename: 'Programme_Dev_Web.pdf',
        path: path.join(__dirname, '../assets/brochures/dev-web.pdf')
    },
    'marketingdigitalstrategie': {
        filename: 'Programme_Marketing.pdf',
        path: path.join(__dirname, '../assets/brochures/marketing.pdf')
    },
    'pedagogiemoderneetappliquee': {
        filename: 'Programme_Pedagogie_Moderne.pdf',
        path: path.join(__dirname, '../assets/brochures/pedagogie-moderne.pdf')
    },
    'psychologiedelenfantetdeladolescent': {
        filename: 'Programme_Psychologie_Enfant.pdf',
        path: path.join(__dirname, '../assets/brochures/psychologie-enfant.pdf')
    },
    'methodologiesdesoutienscolaire': {
        filename: 'Programme_Soutien_Scolaire.pdf',
        path: path.join(__dirname, '../assets/brochures/soutien-scolaire.pdf')
    }
};

exports.registerPublic = async (req, res) => {
    try {
        const { nom, email, telephone, formation } = req.body;
        
        console.log(`--- NOUVELLE INSCRIPTION ---`);
        console.log(`Formation reçue du frontend : "${formation}"`);

        // Save to DB
        const result = await pool.query(
            'INSERT INTO inscriptions (nom_complet, email, telephone, formation) VALUES ($1, $2, $3, $4) RETURNING *',
            [nom, email, telephone, formation]
        );
        
        // Respond immediately
        res.status(201).json({ success: true, message: "Inscription réussie !", data: result.rows[0] });

        // Setup Mailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
        const mailOptions = {
            from: `"Centre Darajat" <${process.env.EMAIL_USER}>`,
            to: email, 
            subject: `Confirmation d'inscription : ${formation}`,
            text: `Bonjour ${nom},\n\nNous confirmons votre pré-inscription pour : ${formation}. Notre équipe vous contactera au ${telephone}.`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px;">
                    <h2 style="color: #1e293b;">Bienvenue à Darajat !</h2>
                    <p>Bonjour <strong>${nom}</strong>,</p>
                    <p>Nous confirmons la réception de votre pré-inscription pour la formation : <strong style="color: #2563eb;">${formation}</strong>.</p>
                    <p>Vous trouverez ci-joint la brochure détaillée. Notre équipe vous contactera très prochainement au <strong>${telephone}</strong> pour finaliser votre dossier.</p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <p style="color: #475569; font-size: 0.9em;">Ceci est un message automatique, merci de ne pas y répondre.</p>
                </div>
            `
        };

        const formationKey = normalizeKey(formation);
        console.log(`Clé normalisée pour la recherche : "${formationKey}"`);

        // Attach the brochure
        if (brochureMap[formationKey]) {
            mailOptions.attachments = [brochureMap[formationKey]];
            console.log(` PDF Attaché : ${brochureMap[formationKey].filename}`);
        } else {
            console.log(` ALARME: Échec du mapping. Le frontend a envoyé : "${formation}"`);
        }

        // Send Email
        transporter.sendMail(mailOptions).then(info => {
             console.log(" Email envoyé avec succès aux étudiants. ID:", info.messageId);
        }).catch(err => {
            console.error("Erreur d'envoi d'email de confirmation étudiant:", err);
        });
        
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: "Ce numéro de téléphone est déjà inscrit à cette formation." });
        }
        console.error(err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "Erreur lors de l'inscription." });
        }
    }
};

exports.verifyCertificate = async (req, res) => {
    try {
        const { code } = req.body;
        const result = await pool.query(
            'SELECT nom_etudiant, formation, date_emission FROM attestations WHERE code_unique = $1 AND est_valide = TRUE',
            [code]
        );
        
        if (result.rows.length > 0) res.json({ valide: true, ...result.rows[0] });
        else res.json({ valide: false });
    } catch (err) {
        console.error("Erreur vérification:", err);
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

// --- ADMIN ROUTES ---
exports.getStudents = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = 'all', formation = 'all' } = req.query;
        const offset = (page - 1) * limit;

        let baseQuery = 'FROM inscriptions WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (search) {
            baseQuery += ` AND (nom_complet ILIKE $${paramIndex} OR formation ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        if (status !== 'all') {
            baseQuery += ` AND COALESCE(statut_scolaire, 'En cours') = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }
        if (formation !== 'all') {
            baseQuery += ` AND formation = $${paramIndex}`;
            params.push(formation);
            paramIndex++;
        }

        const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
        const totalItems = parseInt(countRes.rows[0].count);

        const unreadRes = await pool.query(`SELECT COUNT(*) ${baseQuery} AND (statut IS NULL OR statut != 'lu')`, params);
        const unreadItems = parseInt(unreadRes.rows[0].count);

        const dataRes = await pool.query(
            `SELECT * ${baseQuery} ORDER BY nom_complet ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`, 
            [...params, limit, offset]
        );

        res.json({
            success: true,
            data: dataRes.rows,
            meta: { totalItems, unreadItems, currentPage: parseInt(page), totalPages: Math.ceil(totalItems / limit) }
        });
    } catch (err) {
        console.error("Erreur pagination:", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

exports.addStudentManual = async (req, res) => {
    try {
        const { nom, email, telephone, formation } = req.body;
        const result = await pool.query(
            'INSERT INTO inscriptions (nom_complet, email, telephone, formation, statut_scolaire) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nom, email, telephone, formation, 'En cours']
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur serveur." });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        await pool.query('UPDATE inscriptions SET statut_scolaire = $1 WHERE id = $2', [req.body.statut_scolaire, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        await pool.query("UPDATE inscriptions SET statut = 'lu' WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        await pool.query('DELETE FROM inscriptions WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};

exports.generateCertificate = async (req, res) => {
    try {
        const { nom_etudiant, formation } = req.body;
        if (!nom_etudiant || !formation) return res.status(400).json({ success: false, message: "Données incomplètes." });

        const checkStudent = await pool.query('SELECT id FROM inscriptions WHERE nom_complet = $1 AND formation = $2', [nom_etudiant, formation]);
        if (checkStudent.rows.length === 0) return res.status(404).json({ success: false, message: "Étudiant non trouvé." });

        const existingCert = await pool.query('SELECT * FROM attestations WHERE nom_etudiant = $1 AND formation = $2', [nom_etudiant, formation]);
        if (existingCert.rows.length > 0) return res.status(200).json({ success: true, message: "Code existant.", data: existingCert.rows[0] });

        const year = new Date().getFullYear();
        const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
        const codeUnique = `DAR-${year}-${randomHex}`;

        const result = await pool.query(
            'INSERT INTO attestations (code_unique, nom_etudiant, formation) VALUES ($1, $2, $3) RETURNING *',
            [codeUnique, nom_etudiant, formation]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};

exports.downloadCertificatePdf = async (req, res) => {
    try {
        const { code } = req.params;

        const result = await pool.query(
            'SELECT nom_etudiant, formation, date_emission FROM attestations WHERE code_unique = $1',
            [code]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Attestation introuvable." });
        }

        const certData = result.rows[0];
        const dateStr = new Date(certData.date_emission).toLocaleDateString('fr-FR');

        const pdfDoc = await PDFDocument.create();
        
        const templatePath = path.join(__dirname, '../assets/template.png');
        const imageBytes = fs.readFileSync(templatePath);
        const bgImage = await pdfDoc.embedPng(imageBytes); // Use .embedJpg() if you exported a JPG
        
        // Create a standard A4 Landscape page
        const page = pdfDoc.addPage([841.89, 595.28]);
        
        page.drawImage(bgImage, {
            x: 0,
            y: 0,
            width: 841.89,
            height: 595.28,
        });

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

        page.drawText(certData.nom_etudiant, { x: 300, y: 330, size: 24, font: fontBold, color: rgb(0, 0, 0) });
        page.drawText(certData.formation, { x: 250, y: 230, size: 20, font: fontBold, color: rgb(0.2, 0.6, 0.3) });
        page.drawText(`Fait le : ${dateStr}`, { x: 600, y: 100, size: 12, font: fontNormal, color: rgb(0.1, 0.1, 0.1) });
        page.drawText(`Code : ${code}`, { x: 50, y: 50, size: 10, font: fontNormal, color: rgb(0.4, 0.4, 0.4) });

        const pdfBytes = await pdfDoc.save();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Attestation_${certData.nom_etudiant.replace(/\s+/g, '_')}.pdf"`);
        res.send(Buffer.from(pdfBytes));

    } catch (err) {
        console.error("Erreur génération PDF:", err);
        res.status(500).json({ success: false, message: "Erreur serveur" });
    }
};