import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'

const prisma = new PrismaClient()

async function importData() {
  console.log('데이터 가져오기 시작...')

  const dataFile = 'prisma/exported-data.json'
  
  if (!fs.existsSync(dataFile)) {
    console.error('❌ exported-data.json 파일이 없습니다.')
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'))

  // 기존 데이터 삭제
  await prisma.userLog.deleteMany()
  await prisma.performance.deleteMany()
  await prisma.festival.deleteMany()

  console.log('기존 데이터 삭제 완료')

  // 페스티벌 & 공연 가져오기
  for (const festival of data.festivals) {
    const { performances, ...festivalData } = festival
    
    await prisma.festival.create({
      data: {
        ...festivalData,
        startDate: new Date(festivalData.startDate),
        endDate: new Date(festivalData.endDate),
        createdAt: new Date(festivalData.createdAt),
        updatedAt: new Date(festivalData.updatedAt),
        performances: {
          create: performances.map((p: any) => ({
            id: p.id,
            artistName: p.artistName,
            startTime: new Date(p.startTime),
            endTime: new Date(p.endTime),
            stage: p.stage,
            durationMinutes: p.durationMinutes,
            createdAt: new Date(p.createdAt),
            updatedAt: new Date(p.updatedAt),
          })),
        },
      },
    })
  }

  // 사용자 로그 가져오기
  for (const log of data.userLogs) {
    await prisma.userLog.create({
      data: {
        ...log,
        watchedAt: new Date(log.watchedAt),
        createdAt: new Date(log.createdAt),
        updatedAt: new Date(log.updatedAt),
      },
    })
  }

  console.log(`✓ ${data.festivals.length}개 페스티벌 가져오기 완료`)
  console.log(`✓ ${data.userLogs.length}개 사용자 로그 가져오기 완료`)
}

importData()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
