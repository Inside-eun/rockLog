import { scrapeInterparkFestivals, scrapeMelonFestivals } from '../lib/scraper'

async function main() {
  console.log('페스티벌 데이터 스크래핑 시작...')

  console.log('\n1. 인터파크 티켓 스크래핑...')
  const interparkFestivals = await scrapeInterparkFestivals()
  console.log(`인터파크: ${interparkFestivals.length}개 발견`)

  console.log('\n2. 멜론티켓 스크래핑...')
  const melonFestivals = await scrapeMelonFestivals()
  console.log(`멜론: ${melonFestivals.length}개 발견`)

  console.log('\n스크래핑 완료!')
  console.log(`총 ${interparkFestivals.length + melonFestivals.length}개 페스티벌 발견`)
}

main()
  .then(() => {
    console.log('스크립트 실행 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error)
    process.exit(1)
  })
