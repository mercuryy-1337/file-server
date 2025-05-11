import "next-auth"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id: string
      /** The user's username */
      username?: string
      /** Whether the user is an admin */
      isAdmin?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    username?: string
    isAdmin?: boolean
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's id */
    id: string
    /** The user's username */
    username?: string
    /** Whether the user is an admin */
    isAdmin?: boolean
  }
}
