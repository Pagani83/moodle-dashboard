import bcrypt from 'bcryptjs'

// In-memory storage for users (shared between API and auth)
let users: any[] = []
let initialized = false

export async function initializeUsers() {
  if (initialized || users.length > 0) {
    return users
  }

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

  for (const userData of defaultUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      role: userData.role,
      active: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }
    
    users.push(user)
  }

  initialized = true
  console.log('✅ Simple users storage initialized with', users.length, 'users')
  return users
}

export function getUsers() {
  return users
}

export function getUserByEmail(email: string) {
  return users.find(u => u.email === email)
}

export function addUser(user: any) {
  users.push(user)
  return user
}

export function updateUser(id: string, updates: any) {
  const index = users.findIndex(u => u.id === id)
  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    return users[index]
  }
  return null
}

export function deleteUser(id: string) {
  const index = users.findIndex(u => u.id === id)
  if (index !== -1) {
    return users.splice(index, 1)[0]
  }
  return null
}