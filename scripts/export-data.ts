import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function exportData() {
  console.log('데이터 내보내기 시작...')

  const festivals = await prisma.festival.findMany({
    include: {
      performances: true,
    },
  })

  const userLogs = await prisma.userLog.findMany()

  const data = {
    festivals,
    userLogs,
  }

  fs.writeFileSync(
    'prisma/exported-data.json',
    JSON.stringify(data, null, 2)
  )

  console.log(`✓ ${festivals.length}개 페스티벌, ${festivals.reduce((sum, f) => sum + f.performances.length, 0)}개 공연 내보내기 완료`)
  console.log(`✓ ${userLogs.length}개 사용자 로그 내보내기 완료`)
  console.log('→ prisma/exported-data.json 저장됨')
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
