require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Ensure your .env file contains your Neon connection string:
// DATABASE_URL="postgres://user:password@endpoint.neon.tech/dbname?sslmode=require"

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function createAdmin() {
    const username = 'darajat';
    const plainTextPassword = 'admin123'; // Change before handing to client

    try {
        console.log("Tentative de connexion à Neon...");
        const hash = await bcrypt.hash(plainTextPassword, 10);
        
        await pool.query(
            'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
            [username, hash]
        );
        console.log(`Succès: Utilisateur '${username}' créé.`);
    } catch (err) {
        // Dump the entire raw error instead of just err.message
        console.error("Échec de l'opération. Erreur brute:", err);
    } finally {
        pool.end();
    }
}

createAdmin();