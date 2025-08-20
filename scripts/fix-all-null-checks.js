const fs = require('fs');
const path = require('path');

// Fix automated-polls.ts null checks
const automatedPollsPath = path.join(__dirname, '../web/lib/automated-polls.ts');
let automatedPollsContent = fs.readFileSync(automatedPollsPath, 'utf8');

// Fix all the null check issues in automated-polls.ts
const automatedPollsPatterns = [
  { from: "return data ? this.mapTrendingTopicFromDB(data) : null;", to: "return data ? this?.mapTrendingTopicFromDB(data) : null;" },
  { from: "return data ? data.map(this.mapGeneratedPollFromDB) : [];", to: "return data ? data.map((item) => this?.mapGeneratedPollFromDB(item)) : [];" },
  { from: "return data ? this.mapGeneratedPollFromDB(data) : null;", to: "return data ? this?.mapGeneratedPollFromDB(data) : null;" },
  { from: "return data?.map(this.mapDataSourceFromDB) || [];", to: "return data ? data.map((item) => this?.mapDataSourceFromDB(item)) : [];" },
  { from: "return data ? this.mapDataSourceFromDB(data) : null;", to: "return data ? this?.mapDataSourceFromDB(data) : null;" },
  { from: "return data ? this.mapQualityMetricsFromDB(data) : null;", to: "return data ? this?.mapQualityMetricsFromDB(data) : null;" },
  { from: "return data ? this.mapSystemConfigurationFromDB(data) : null;", to: "return data ? this?.mapSystemConfigurationFromDB(data) : null;" }
];

automatedPollsPatterns.forEach(pattern => {
  automatedPollsContent = automatedPollsContent.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
});

fs.writeFileSync(automatedPollsPath, automatedPollsContent);

// Fix comprehensive-testing-runner.ts null checks
const testingRunnerPath = path.join(__dirname, '../web/lib/comprehensive-testing-runner.ts');
let testingRunnerContent = fs.readFileSync(testingRunnerPath, 'utf8');

const testingRunnerPatterns = [
  { from: "const report = await crossPlatformTesting.generateComprehensiveReport()", to: "if (!crossPlatformTesting) { throw new Error('Cross-platform testing not available'); } const report = await crossPlatformTesting.generateComprehensiveReport()" },
  { from: "const report = await mobileCompatibilityTesting.generateComprehensiveReport()", to: "if (!mobileCompatibilityTesting) { throw new Error('Mobile compatibility testing not available'); } const report = await mobileCompatibilityTesting.generateComprehensiveReport()" },
  { from: "details: { error: error.message },", to: "details: { error: error instanceof Error ? error.message : 'Unknown error' }," }
];

testingRunnerPatterns.forEach(pattern => {
  testingRunnerContent = testingRunnerContent.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
});

fs.writeFileSync(testingRunnerPath, testingRunnerContent);

// Fix database-optimizer.ts null checks
const databaseOptimizerPath = path.join(__dirname, '../web/lib/database-optimizer.ts');
let databaseOptimizerContent = fs.readFileSync(databaseOptimizerPath, 'utf8');

const databaseOptimizerPatterns = [
  { from: "const { data, error } = await supabase", to: "const { data, error } = await supabase!" },
  { from: "const { data: pollsData, error: pollsError } = await supabase", to: "const { data: pollsData, error: pollsError } = await supabase!" },
  { from: "const { data: votesData, error: votesError } = await supabase", to: "const { data: votesData, error: votesError } = await supabase!" }
];

databaseOptimizerPatterns.forEach(pattern => {
  databaseOptimizerContent = databaseOptimizerContent.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
});

fs.writeFileSync(databaseOptimizerPath, databaseOptimizerContent);

// Fix other files with similar patterns
const filesToFix = [
  { path: '../web/lib/media-bias-analysis.ts', patterns: [
    { from: "return data ? this.mapMediaPollFromDB(data) : null;", to: "return data ? this?.mapMediaPollFromDB(data) : null;" },
    { from: "return data ? this.mapComparisonFromDB(data) : null;", to: "return data ? this?.mapComparisonFromDB(data) : null;" }
  ]},
  { path: '../web/lib/poll-narrative-system.ts', patterns: [
    { from: "return data ? this.mapNarrativeFromDB(data) : null;", to: "return data ? this?.mapNarrativeFromDB(data) : null;" },
    { from: "return data ? this.mapVerifiedFactFromDB(data) : null;", to: "return data ? this?.mapVerifiedFactFromDB(data) : null;" },
    { from: "return data ? this.mapCommunityFactFromDB(data) : null;", to: "return data ? this?.mapCommunityFactFromDB(data) : null;" }
  ]},
  { path: '../web/lib/github-issue-integration.ts', patterns: [
    { from: "analysis.relatedIssues", to: "analysis.relatedIssues || []" }
  ]}
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  let content = fs.readFileSync(filePath, 'utf8');
  
  file.patterns.forEach(pattern => {
    content = content.replace(new RegExp(pattern.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.to);
  });
  
  fs.writeFileSync(filePath, content);
});

console.log('Fixed all null check issues across multiple files');
