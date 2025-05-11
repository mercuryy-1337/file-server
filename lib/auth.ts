import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import prisma from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user) {
          return null
        }

        // Check for login attempts
        const loginAttempt = await prisma.loginAttempt.findUnique({
          where: {
            userId: user.id,
          },
        })

        // Check if account is locked
        if (loginAttempt?.lockedUntil && new Date() < new Date(loginAttempt.lockedUntil)) {
          throw new Error("Account is locked. Try again later.")
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          // Update login attempts
          await updateLoginAttempts(user.id)
          return null
        }

        // Reset login attempts on successful login
        if (loginAttempt) {
          await prisma.loginAttempt.update({
            where: {
              userId: user.id,
            },
            data: {
              attempts: 0,
              lastAttempt: new Date(),
              lockedUntil: null,
            },
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          username: user.username,
          image: user.image,
          isAdmin: user.isAdmin,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.isAdmin = user.isAdmin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.username = token.username as string | undefined
        session.user.isAdmin = token.isAdmin as boolean | undefined
      }
      return session
    },
  },
}

async function updateLoginAttempts(userId: string) {
  const loginAttempt = await prisma.loginAttempt.findUnique({
    where: {
      userId,
    },
  })

  if (!loginAttempt) {
    await prisma.loginAttempt.create({
      data: {
        userId,
        attempts: 1,
        lastAttempt: new Date(),
      },
    })
    return
  }

  const newAttempts = loginAttempt.attempts + 1
  let lockedUntil = null

  // Lock account after 5 failed attempts for 15 minutes
  if (newAttempts >= 5) {
    const lockTime = new Date()
    lockTime.setMinutes(lockTime.getMinutes() + 15)
    lockedUntil = lockTime
  }

  await prisma.loginAttempt.update({
    where: {
      userId,
    },
    data: {
      attempts: newAttempts,
      lastAttempt: new Date(),
      lockedUntil,
    },
  })
}
