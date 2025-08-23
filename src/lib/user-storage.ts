// Centralized user storage - in production, use a database
export interface User {
  id: string
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'USER'
  active: boolean
  createdAt: string
  lastLogin: string | null
}

let users: User[] = [
  {
    id: '1',
    email: 'admin@moodle.local',
    name: 'Administrator',
    password: '$2b$12$CdOH3pF71xfSSSwzGcBD6uGAxwCrBHFGv5jaCV.AmFlmCh00/miYa', // "admin123"
    role: 'ADMIN',
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  },
  {
    id: '2',
    email: 'marciacampos@tjrs.jus.br',
    name: 'Márcia Campos',
    password: '$2b$12$bBLxTEdNpQj.obZZq/h5FO8mJEnoPEYoxVzHguAgPPMQBaYtTTpGq', // "cjud@dicaf"
    role: 'USER',
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: null
  }
]

export const getUserByEmail = (email: string): User | undefined => {
  return users.find(u => u.email === email)
}

export const getAllUsers = (): User[] => {
  return users
}

export const createUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
    createdAt: new Date().toISOString()
  }
  users.push(newUser)
  return newUser
}

export const updateUser = (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null => {
  const userIndex = users.findIndex(u => u.id === id)
  if (userIndex === -1) return null
  
  users[userIndex] = { ...users[userIndex], ...updates }
  return users[userIndex]
}

export const deleteUser = (id: string): boolean => {
  const initialLength = users.length
  users = users.filter(u => u.id !== id)
  return users.length < initialLength
}

export const updateLastLogin = (id: string): void => {
  const user = users.find(u => u.id === id)
  if (user) {
    user.lastLogin = new Date().toISOString()
  }
}
