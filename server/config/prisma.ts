import './env.js'
import { Prisma, PrismaClient } from '../generated/prisma/client.js'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

(Prisma.Decimal.prototype as unknown as {toJSON:()=>number}).toJSON = function () {
  return (this as unknown as {toNumber:()=>number}).toNumber()
}

export const prisma = new PrismaClient({ adapter })
