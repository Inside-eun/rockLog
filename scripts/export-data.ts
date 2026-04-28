import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
})

async function main() {
  const festivals = await prisma.festival.findMany({
    include: {
      performances: {
        include: {
          userLogs: true,
        },
      },
    },
  })

  fs.writeFileSync('data-export.json', JSON.stringify(festivals, null, 2))
  console.log(`✅ Exported ${festivals.length} festivals to data-export.json`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
