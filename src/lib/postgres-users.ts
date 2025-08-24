import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

// PostgreSQL connection for production
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_POSTGRES || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export interface PostgresUser {
  id: string
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'USER'
  active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export async function initializePostgresUsers(): Promise<PostgresUser[]> {
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `)

    // Check if users exist
    const { rows: existingUsers } = await pool.query('SELECT * FROM users')
    
    if (existingUsers.length > 0) {
      console.log('✅ PostgreSQL users already exist:', existingUsers.length)
      return existingUsers
    }

    // Insert default users
    const defaultUsers = [
      {
        email: 'admin@moodle.local',
        name: 'Administrator',
        password: 'admin123',
        role: 'ADMIN'
      },
      {
        email: 'mmpagani@tjrs.jus.br',
        name: 'Maikon Pagani',
        password: 'cjud@2233',
        role: 'ADMIN'
      },
      {
        email: 'marciacampos@tjrs.jus.br',
        name: 'Marcia Campos',
        password: 'cjud@dicaf',
        role: 'USER'
      }
    ]

    const insertedUsers = []
    
    for (const userData of defaultUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      const { rows } = await pool.query(
        `INSERT INTO users (email, name, password, role, active) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [userData.email, userData.name, hashedPassword, userData.role, true]
      )
      
      insertedUsers.push(rows[0])
      console.log(`✅ PostgreSQL user created: ${userData.email}`)
    }

    return insertedUsers
  } catch (error) {
    console.error('❌ PostgreSQL users initialization error:', error)
    throw error
  }
}

export async function getPostgresUserByEmail(email: string): Promise<PostgresUser | null> {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    return rows[0] || null
  } catch (error) {
    console.error('❌ PostgreSQL get user error:', error)
    return null
  }
}

export async function getAllPostgresUsers(): Promise<PostgresUser[]> {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at')
    return rows
  } catch (error) {
    console.error('❌ PostgreSQL get all users error:', error)
    return []
  }
}

export async function updatePostgresUserLastLogin(email: string): Promise<void> {
  try {
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1',
      [email]
    )
  } catch (error) {
    console.error('❌ PostgreSQL update last login error:', error)
  }
}

// Test connection
export async function testPostgresConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1')
    console.log('✅ PostgreSQL connection successful')
    return true
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error)
    return false
  }
}