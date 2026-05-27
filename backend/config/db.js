const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_P5bhB1FCeDos@ep-floral-forest-abnxfdkd.eu-west-2.aws.neon.tech/neondb?sslmode=require',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

module.exports = pool;