const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('prisma/dev.db');

const festivals = db.prepare(`
  SELECT * FROM Festival
`).all();

const performances = db.prepare(`
  SELECT * FROM Performance
`).all();

const userLogs = db.prepare(`
  SELECT * FROM UserLog
`).all();

const data = festivals.map(festival => ({
  ...festival,
  performances: performances
    .filter(p => p.festivalId === festival.id)
    .map(perf => ({
      ...perf,
      userLogs: userLogs.filter(ul => ul.performanceId === perf.id)
    }))
}));

fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
console.log(`✅ Exported ${data.length} festivals`);

db.close();
