import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

async function createDatabase() {
  try {
    console.log('Connecting to PostgreSQL to create database...');
    
    // Connect to default 'postgres' database first
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 1810,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: 'postgres' // Default database
    });

    const client = await pool.connect();
    
    try {
      // Create the database
      await client.query('CREATE DATABASE "project_pulse"');
      console.log('✅ Database "project_pulse" created successfully!');
    } catch (error) {
      if (error.code === '42P04') { // database already exists
        console.log('✅ Database "project_pulse" already exists!');
      } else {
        throw error;
      }
    }
    
    client.release();
    await pool.end();
    
    // Now test connection to the new database
    console.log('Testing connection to "project_pulse" database...');
    const testPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 1810,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'root',
      database: 'project_pulse'
    });
    
    const testClient = await testPool.connect();
    const result = await testClient.query('SELECT NOW()');
    console.log('✅ Connection to "project_pulse" successful!');
    console.log('Current time:', result.rows[0].now);
    
    testClient.release();
    await testPool.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createDatabase();
