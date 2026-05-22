const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authenticateToken = require('../middleware/auth');

// Public Routes
router.post('/inscription', studentController.registerPublic);
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