import { PrismaClient } from '@prisma/client'

const localDb = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
})

const productionDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_PRISMA_URL!,
    },
  },
})

async function main() {
  console.log('🔄 Starting data migration...')

  const festivals = await localDb.festival.findMany({
    include: {
      performances: {
        include: {
          userLogs: true,
        },
      },
    },
  })

  console.log(`📊 Found ${festivals.length} festivals`)

  for (const festival of festivals) {
    console.log(`\n📝 Migrating: ${festival.name}`)
    
    const { performances, ...festivalData } = festival

    await productionDb.festival.create({
      data: {
        ...festivalData,
        performances: {
          create: performances.map(({ userLogs, ...perfData }) => ({
            ...perfData,
            userLogs: {
              create: userLogs,
            },
          })),
        },
      },
    })

    console.log(`  ✅ ${performances.length} performances migrated`)
  }

  console.log('\n✨ Migration complete!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await localDb.$disconnect()
    await productionDb.$disconnect()
  })
