const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../web/lib/automated-polls.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix all the null check issues
const patterns = [
  { from: "return data?.map(this.mapTrendingTopicFromDB) || [];", to: "return data ? data.map(this.mapTrendingTopicFromDB) : [];" },
  { from: "return data?.map(this.mapGeneratedPollFromDB) || [];", to: "return data ? data.map(this.mapGeneratedPollFromDB) : [];" },
  { from: "return data?.map(this.mapPollFromDB) || [];", to: "return data ? data.map(this.mapPollFromDB) : [];" },
  { from: "return data?.map(this.mapVoteFromDB) || [];", to: "return data ? data.map(this.mapVoteFromDB) : [];" },
  { from: "return data?.map(this.mapFeedbackFromDB) || [];", to: "return data ? data.map(this.mapFeedbackFromDB) : [];" },
  { from: "return data?.map(this.mapAnalyticsFromDB) || [];", to: "return data ? data.map(this.mapAnalyticsFromDB) : [];" }
];

patterns.forEach(pattern => {
  content = content.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
});

fs.writeFileSync(filePath, content);
console.log('Fixed null check issues in automated-polls.ts');
