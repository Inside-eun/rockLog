import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('시드 데이터 생성 시작...')

  // 기존 데이터 삭제
  await prisma.userLog.deleteMany()
  await prisma.performance.deleteMany()
  await prisma.festival.deleteMany()

  // 1. 지산 밸리 록 페스티벌 2025
  const jisan = await prisma.festival.create({
    data: {
      name: '지산 밸리 록 페스티벌 2025',
      startDate: new Date('2025-07-25'),
      endDate: new Date('2025-07-27'),
      location: '경기도 이천시 지산포레스트리조트',
      genre: '록/메탈',
      imageUrl: 'https://via.placeholder.com/400x600/FF6B6B/FFFFFF?text=Jisan+Valley',
      lineup: JSON.stringify(['Foo Fighters', '뱀파이어 위켄드', '너바나', '새소년']),
      description: '대한민국 대표 록 페스티벌',
      performances: {
        create: [
          {
            artistName: 'Foo Fighters',
            startTime: new Date('2025-07-25T20:00:00'),
            endTime: new Date('2025-07-25T21:30:00'),
            stage: 'Main Stage',
            durationMinutes: 90,
          },
          {
            artistName: '뱀파이어 위켄드',
            startTime: new Date('2025-07-25T18:00:00'),
            endTime: new Date('2025-07-25T19:15:00'),
            stage: 'Main Stage',
            durationMinutes: 75,
          },
          {
            artistName: '너바나',
            startTime: new Date('2025-07-26T21:00:00'),
            endTime: new Date('2025-07-26T22:30:00'),
            stage: 'Main Stage',
            durationMinutes: 90,
          },
          {
            artistName: '새소년',
            startTime: new Date('2025-07-26T16:00:00'),
            endTime: new Date('2025-07-26T17:00:00'),
            stage: 'Valley Stage',
            durationMinutes: 60,
          },
        ],
      },
    },
  })

  // 2. 현대카드 슈퍼콘서트 2025
  const hyundai = await prisma.festival.create({
    data: {
      name: '현대카드 슈퍼콘서트 2025',
      startDate: new Date('2025-08-15'),
      endDate: new Date('2025-08-16'),
      location: '서울 잠실종합운동장',
      genre: '팝/록',
      imageUrl: 'https://via.placeholder.com/400x600/4ECDC4/FFFFFF?text=Super+Concert',
      lineup: JSON.stringify(['Coldplay', 'The Weeknd', '방탄소년단']),
      description: '세계적인 아티스트들의 공연',
      performances: {
        create: [
          {
            artistName: 'Coldplay',
            startTime: new Date('2025-08-15T19:00:00'),
            endTime: new Date('2025-08-15T21:00:00'),
            stage: 'Main Stage',
            durationMinutes: 120,
          },
          {
            artistName: 'The Weeknd',
            startTime: new Date('2025-08-16T19:30:00'),
            endTime: new Date('2025-08-16T21:30:00'),
            stage: 'Main Stage',
            durationMinutes: 120,
          },
          {
            artistName: '방탄소년단',
            startTime: new Date('2025-08-16T17:00:00'),
            endTime: new Date('2025-08-16T18:30:00'),
            stage: 'Main Stage',
            durationMinutes: 90,
          },
        ],
      },
    },
  })

  // 3. 펜타포트 록 페스티벌 2025
  const pentaport = await prisma.festival.create({
    data: {
      name: '펜타포트 록 페스티벌 2025',
      startDate: new Date('2025-08-08'),
      endDate: new Date('2025-08-10'),
      location: '인천 송도 달빛축제공원',
      genre: '록/인디',
      imageUrl: 'https://via.placeholder.com/400x600/95E1D3/FFFFFF?text=Pentaport',
      lineup: JSON.stringify(['잔나비', '혁오', 'The 1975', 'Arctic Monkeys']),
      description: '인천 송도의 록 페스티벌',
      performances: {
        create: [
          {
            artistName: '잔나비',
            startTime: new Date('2025-08-08T19:00:00'),
            endTime: new Date('2025-08-08T20:15:00'),
            stage: 'Main Stage',
            durationMinutes: 75,
          },
          {
            artistName: '혁오',
            startTime: new Date('2025-08-08T17:00:00'),
            endTime: new Date('2025-08-08T18:00:00'),
            stage: 'Main Stage',
            durationMinutes: 60,
          },
          {
            artistName: 'The 1975',
            startTime: new Date('2025-08-09T20:00:00'),
            endTime: new Date('2025-08-09T21:30:00'),
            stage: 'Main Stage',
            durationMinutes: 90,
          },
          {
            artistName: 'Arctic Monkeys',
            startTime: new Date('2025-08-10T21:00:00'),
            endTime: new Date('2025-08-10T22:30:00'),
            stage: 'Main Stage',
            durationMinutes: 90,
          },
          {
            artistName: '실리카겔',
            startTime: new Date('2025-08-09T15:00:00'),
            endTime: new Date('2025-08-09T16:00:00'),
            stage: 'Cloud Stage',
            durationMinutes: 60,
          },
        ],
      },
    },
  })

  console.log('시드 데이터 생성 완료!')
  console.log({ jisan, hyundai, pentaport })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
