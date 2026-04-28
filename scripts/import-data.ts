import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

function convertDates(obj: any) {
  const dateFields = ['startDate', 'endDate', 'startTime', 'endTime', 'watchedAt', 'createdAt', 'updatedAt']
  for (const key of dateFields) {
    if (obj[key] && typeof obj[key] === 'number') {
      obj[key] = new Date(obj[key])
    }
  }
  return obj
}

async function main() {
  const data = JSON.parse(fs.readFileSync('data-export.json', 'utf-8'))
  
  console.log(`🔄 Importing ${data.length} festivals...`)

  for (const festival of data) {
    const { performances, ...festivalData } = festival

    await prisma.festival.create({
      data: {
        ...convertDates(festivalData),
        performances: {
          create: performances.map(({ userLogs, festivalId, ...perfData }: any) => ({
            ...convertDates(perfData),
            userLogs: {
              create: userLogs.map(({ performanceId, ...log }: any) => convertDates(log)),
            },
          })),
        },
      },
    })

    console.log(`✅ ${festival.name}`)
  }

  console.log('\n✨ Import complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
