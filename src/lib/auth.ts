import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { NextAuthConfig } from 'next-auth'
import { prisma } from './prisma'

const config = {
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Primeiro, tentar encontrar o usuário
          let user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })

          // Se não encontrar usuário, verificar se o banco está vazio e inicializar
          if (!user) {
            const userCount = await prisma.user.count()
            if (userCount === 0) {
              console.log('🔧 No users found, initializing database...')
              
              // Criar usuários padrão
              const defaultUsers = [
                { email: 'admin@moodle.local', name: 'Administrator', password: 'admin123', role: 'ADMIN' },
                { email: 'mmpagani@tjrs.jus.br', name: 'Maikon Pagani', password: 'cjud@2233', role: 'ADMIN' },
                { email: 'marciacampos@tjrs.jus.br', name: 'Marcia Campos', password: 'cjud@dicaf', role: 'USER' }
              ]
              
              for (const userData of defaultUsers) {
                const hashedPassword = await bcrypt.hash(userData.password, 12)
                await prisma.user.create({
                  data: {
                    email: userData.email,
                    name: userData.name,
                    password: hashedPassword,
                    role: userData.role as 'ADMIN' | 'USER',
                    active: true,
                  }
                })
              }
              
              console.log('✅ Default users created')
              
              // Tentar encontrar o usuário novamente
              user = await prisma.user.findUnique({
                where: { email: credentials.email as string }
              })
            }
          }

          if (!user || !user.active) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as 'ADMIN' | 'USER',
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as 'ADMIN' | 'USER'
      }
      return session
    }
  }
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
