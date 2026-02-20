import pool from './src/config/database.js';
import bcrypt from 'bcrypt';

async function createStakeholder() {
  try {
    const hashedPassword = await bcrypt.hash('stakeholder123', 10);
    
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
      ['Stakeholder User', 'stakeholder@projectpulse.io', hashedPassword, 'stakeholder', true]
    );
    
    console.log('✅ Stakeholder user created successfully!');
    console.log('📧 Email: stakeholder@projectpulse.io');
    console.log('🔑 Password: stakeholder123');
    console.log('👤 Role:', result.rows[0].role);
    console.log('🆔 ID:', result.rows[0].id);
    
  } catch (error) {
    if (error.code === '23505') {
      console.log('ℹ️  Stakeholder user already exists');
    } else {
      console.error('❌ Error creating stakeholder:', error);
    }
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createStakeholder();
