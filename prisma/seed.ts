import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      email: "admin@example.com",
      password: adminPassword,
      isAdmin: true,
      loginAttempts: {
        create: {
          attempts: 0,
        },
      },
    },
  })

  console.log({ admin })

  // Create regular user
  const userPassword = await hash("user123", 10)

  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      firstName: "Regular",
      lastName: "User",
      username: "user",
      email: "user@example.com",
      password: userPassword,
      loginAttempts: {
        create: {
          attempts: 0,
        },
      },
    },
  })

  console.log({ user })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
