import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log('Running migrations...');
        const migrationFile = path.join(process.cwd(), 'migrations', '001_add_client_fields.sql');
        const sql = fs.readFileSync(migrationFile, 'utf8');
        await client.query(sql);
        console.log('Migration 001_add_client_fields.sql executed successfully.');
    } catch (err) {
        console.error('Error running migrations:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
