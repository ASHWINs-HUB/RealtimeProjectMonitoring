import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'project_name',
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].now);
    client.release();
    
    await pool.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Make sure PostgreSQL is installed and running');
    console.log('2. Check if database "project_name" exists');
    console.log('3. Verify user "root" with password "root" exists');
    console.log('4. Check PostgreSQL is running on port 5432');
    console.log('\n📝 To create database manually:');
    console.log('   - Open pgAdmin or psql');
    console.log('   - CREATE DATABASE "project_name";');
    console.log('   - CREATE USER root WITH PASSWORD \'root\';');
    console.log('   - GRANT ALL PRIVILEGES ON DATABASE "project_name" TO root;');
  }
}

testConnection();
