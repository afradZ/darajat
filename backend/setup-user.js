require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createAdmin() {
    const username = 'admin';
    const plainTextPassword = 'password123'; // Change this to a secure password in production

    try {
        const hash = await bcrypt.hash(plainTextPassword, 10);
        await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
            [username, hash]
        );
        console.log(` Succès: Utilisateur '${username}' créé.`);
    } catch (err) {
        console.error("Erreur:", err.message);
    } finally {
        pool.end();
    }
}

createAdmin();