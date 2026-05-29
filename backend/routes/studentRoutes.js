const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator'); // Added import
const studentController = require('../controllers/studentController');
const authenticateToken = require('../middleware/auth');

// Define Validation Rules 
const validateRegistration = [
    body('nom')
        .trim()
        .notEmpty().withMessage('Le nom complet est requis.')
        .isLength({ min: 2, max: 100 }).withMessage('Le nom doit contenir entre 2 et 100 caractères.')
        .escape(),
    body('email')
        .isEmail().withMessage('Adresse email invalide.')
        .normalizeEmail(),
    body('telephone')
        .trim()
        .notEmpty().withMessage('Le téléphone est requis.')
        .matches(/^[0-9\-\+\s()]+$/).withMessage('Format de téléphone invalide.')
        .isLength({ min: 8, max: 20 }).withMessage('Le numéro de téléphone est trop court ou trop long.'),
    body('formation')
        .trim()
        .notEmpty().withMessage('La formation est requise.')
        .escape()
];

//  Define Validation Checker 
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};


// Public Routes
router.post('/inscription', validateRegistration, checkValidation, studentController.registerPublic);
router.post('/verification', studentController.verifyCertificate);

// Admin Routes (Protected)
router.get('/admin/inscriptions', authenticateToken, studentController.getStudents);
router.post('/admin/etudiants', authenticateToken, studentController.addStudentManual);
router.put('/admin/etudiants/:id/statut', authenticateToken, studentController.updateStatus);
router.put('/admin/inscriptions/:id/lu', authenticateToken, studentController.markAsRead);
router.delete('/admin/inscriptions/:id', authenticateToken, studentController.deleteStudent);
router.post('/admin/attestations', authenticateToken, studentController.generateCertificate);
router.get('/admin/attestations/download/:code', authenticateToken, studentController.downloadCertificatePdf);

module.exports = router;