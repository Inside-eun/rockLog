import puppeteer from 'puppeteer'
import { prisma } from './db'

interface ScrapedFestival {
  name: string
  startDate: Date
  endDate: Date
  location: string
  genre: string
  imageUrl?: string
  description?: string
}

interface ScrapedPerformance {
  artistName: string
  startTime: Date
  endTime: Date
  stage: string
  durationMinutes: number
}

export async function scrapeInterparkFestivals() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.goto('https://tickets.interpark.com/contents/genre/concert', {
      waitUntil: 'networkidle2',
    })

    const festivals = await page.evaluate(() => {
      const festivalElements = document.querySelectorAll('.prdList li')
      const results: any[] = []

      festivalElements.forEach((el) => {
        const titleEl = el.querySelector('.prdTitle')
        const dateEl = el.querySelector('.prdDate')
        const placeEl = el.querySelector('.prdPlace')
        const imgEl = el.querySelector('img')

        if (titleEl && dateEl && placeEl) {
          results.push({
            name: titleEl.textContent?.trim() || '',
            dateText: dateEl.textContent?.trim() || '',
            location: placeEl.textContent?.trim() || '',
            imageUrl: imgEl?.src || '',
          })
        }
      })

      return results
    })

    console.log(`스크래핑된 페스티벌 수: ${festivals.length}`)
    return festivals
  } catch (error) {
    console.error('스크래핑 중 오류:', error)
    return []
  } finally {
    await browser.close()
  }
}

export async function scrapeMelonFestivals() {
  console.log('멜론티켓 스크래핑은 구현 예정입니다.')
  return []
}

export async function saveFestivalToDB(festivalData: ScrapedFestival) {
  try {
    const existingFestival = await prisma.festival.findFirst({
      where: {
        name: festivalData.name,
        startDate: festivalData.startDate,
      },
    })

    if (existingFestival) {
      console.log(`이미 존재하는 페스티벌: ${festivalData.name}`)
      return existingFestival
    }

    const festival = await prisma.festival.create({
      data: festivalData,
    })

    console.log(`저장된 페스티벌: ${festival.name}`)
    return festival
  } catch (error) {
    console.error('페스티벌 저장 중 오류:', error)
    throw error
  }
}

export async function savePerformanceToDB(
  festivalId: string,
  performanceData: ScrapedPerformance
) {
  try {
    const performance = await prisma.performance.create({
      data: {
        festivalId,
        ...performanceData,
      },
    })

    console.log(`저장된 공연: ${performance.artistName}`)
    return performance
  } catch (error) {
    console.error('공연 저장 중 오류:', error)
    throw error
  }
}
