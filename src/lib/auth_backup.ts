import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// Temporary user storage (in production, use a database)
const users = [
  {
    id: '1',
    email: 'admin@moodle.local',
    name: 'Administrator',
    password: '$2b$12$CdOH3pF71xfSSSwzGcBD6uGAxwCrBHFGv5jaCV.AmFlmCh00/miYa', // "admin123"
    role: 'ADMIN',
    active: true
  }
]

const nextAuth = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = users.find(u => 
          u.email === credentials.email && u.active
        )

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as "ADMIN" | "USER",
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
})

export const { handlers, auth, signIn, signOut } = nextAuth
