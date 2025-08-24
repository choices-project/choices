const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Trending Topics Page...\n');

// Check if the trending topics page component exists and has the right structure
const trendingTopicsPath = path.join(__dirname, '../web/components/admin/trending-topics/TrendingTopicsPage.tsx');
if (fs.existsSync(trendingTopicsPath)) {
  console.log('✅ Trending topics component exists');
  
  const content = fs.readFileSync(trendingTopicsPath, 'utf8');
  
  // Check for key features
  const hasSearch = content.includes('searchTerm');
  const hasStatusFilter = content.includes('statusFilter');
  const hasCategoryFilter = content.includes('categoryFilter');
  const hasFilteredTopics = content.includes('filteredTopics');
  const hasApproveButton = content.includes('approveTopic');
  const hasRejectButton = content.includes('rejectTopic');
  const hasAnalyzeButton = content.includes('handleAnalyze');
  
  console.log(`  ${hasSearch ? '✅' : '❌'} Search functionality`);
  console.log(`  ${hasStatusFilter ? '✅' : '❌'} Status filtering`);
  console.log(`  ${hasCategoryFilter ? '✅' : '❌'} Category filtering`);
  console.log(`  ${hasFilteredTopics ? '✅' : '❌'} Filtered topics logic`);
  console.log(`  ${hasApproveButton ? '✅' : '❌'} Approve button`);
  console.log(`  ${hasRejectButton ? '✅' : '❌'} Reject button`);
  console.log(`  ${hasAnalyzeButton ? '✅' : '❌'} Analyze button`);
  
  // Check for table structure
  const hasTable = content.includes('<table');
  const hasTableHeaders = content.includes('th');
  const hasTableRows = content.includes('tr');
  
  console.log(`  ${hasTable ? '✅' : '❌'} Table structure`);
  console.log(`  ${hasTableHeaders ? '✅' : '❌'} Table headers`);
  console.log(`  ${hasTableRows ? '✅' : '❌'} Table rows`);
  
} else {
  console.log('❌ Trending topics component not found');
}

// Check the mock data to ensure it has the right structure
const mockDataPath = path.join(__dirname, '../web/lib/mock-data.ts');
if (fs.existsSync(mockDataPath)) {
  console.log('\n✅ Mock data file exists');
  
  const content = fs.readFileSync(mockDataPath, 'utf8');
  
  // Check for trending topics data structure
  const hasId = content.includes('id:');
  const hasTitle = content.includes('title:');
  const hasCategory = content.includes('category:');
  const hasStatus = content.includes('status:');
  const hasTrendScore = content.includes('trend_score:');
  
  console.log(`  ${hasId ? '✅' : '❌'} ID field`);
  console.log(`  ${hasTitle ? '✅' : '❌'} Title field`);
  console.log(`  ${hasCategory ? '✅' : '❌'} Category field`);
  console.log(`  ${hasStatus ? '✅' : '❌'} Status field`);
  console.log(`  ${hasTrendScore ? '✅' : '❌'} Trend score field`);
  
  // Check for specific data
  const hasGavinNewsom = content.includes('Gavin Newsom vs Donald Trump');
  const hasPendingStatus = content.includes("status: 'pending'");
  const hasApprovedStatus = content.includes("status: 'approved'");
  const hasRejectedStatus = content.includes("status: 'rejected'");
  
  console.log(`  ${hasGavinNewsom ? '✅' : '❌'} Gavin Newsom topic`);
  console.log(`  ${hasPendingStatus ? '✅' : '❌'} Pending status examples`);
  console.log(`  ${hasApprovedStatus ? '✅' : '❌'} Approved status examples`);
  console.log(`  ${hasRejectedStatus ? '✅' : '❌'} Rejected status examples`);
  
} else {
  console.log('\n❌ Mock data file not found');
}

// Check the admin hooks to ensure they're properly connected
const hooksPath = path.join(__dirname, '../web/lib/admin-hooks.ts');
if (fs.existsSync(hooksPath)) {
  console.log('\n✅ Admin hooks file exists');
  
  const content = fs.readFileSync(hooksPath, 'utf8');
  
  // Check for trending topics hook
  const hasTrendingTopicsHook = content.includes('useTrendingTopics');
  const hasApproveHook = content.includes('useApproveTopic');
  const hasRejectHook = content.includes('useRejectTopic');
  const hasAnalyzeHook = content.includes('useAnalyzeTrendingTopics');
  
  console.log(`  ${hasTrendingTopicsHook ? '✅' : '❌'} useTrendingTopics hook`);
  console.log(`  ${hasApproveHook ? '✅' : '❌'} useApproveTopic hook`);
  console.log(`  ${hasRejectHook ? '✅' : '❌'} useRejectTopic hook`);
  console.log(`  ${hasAnalyzeHook ? '✅' : '❌'} useAnalyzeTrendingTopics hook`);
  
} else {
  console.log('\n❌ Admin hooks file not found');
}

console.log('\n🎯 Potential Issues:');
console.log('1. Check browser console for JavaScript errors');
console.log('2. Verify that the page is loading the trending topics data');
console.log('3. Check if the filtering logic is working correctly');
console.log('4. Ensure the approve/reject buttons are visible for pending topics');
console.log('5. Test the search functionality');

console.log('\n🔧 Debugging Steps:');
console.log('1. Open browser dev tools (F12)');
console.log('2. Check Console tab for errors');
console.log('3. Check Network tab to see if API calls are working');
console.log('4. Check React DevTools to see component state');
console.log('5. Try searching for "Gavin" or "Trump" in the search box');
console.log('6. Try filtering by status (Pending, Approved, Rejected)');
console.log('7. Try filtering by category (Politics, Technology, etc.)');

console.log('\n📊 Expected Data:');
console.log('- 5 trending topics total');
console.log('- 1 Gavin Newsom vs Trump topic (pending)');
console.log('- 1 AI Regulation topic (approved)');
console.log('- 1 Climate Change topic (pending)');
console.log('- 1 SpaceX topic (rejected)');
console.log('- 1 Olympic Games topic (approved)');
