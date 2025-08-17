const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Admin Dashboard Data...\n');

// Test mock data imports
try {
  const mockDataPath = path.join(__dirname, '../web/lib/mock-data.ts');
  if (fs.existsSync(mockDataPath)) {
    console.log('✅ Mock data file exists');
    
    const content = fs.readFileSync(mockDataPath, 'utf8');
    
    // Check for key exports
    const hasTrendingTopics = content.includes('mockTrendingTopics');
    const hasGeneratedPolls = content.includes('mockGeneratedPolls');
    const hasSystemMetrics = content.includes('mockSystemMetrics');
    const hasActivityFeed = content.includes('mockActivityFeed');
    const hasChartData = content.includes('mockChartData');
    
    console.log(`  ${hasTrendingTopics ? '✅' : '❌'} mockTrendingTopics export`);
    console.log(`  ${hasGeneratedPolls ? '✅' : '❌'} mockGeneratedPolls export`);
    console.log(`  ${hasSystemMetrics ? '✅' : '❌'} mockSystemMetrics export`);
    console.log(`  ${hasActivityFeed ? '✅' : '❌'} mockActivityFeed export`);
    console.log(`  ${hasChartData ? '✅' : '❌'} mockChartData export`);
    
    // Check for Gavin Newsom data (our specific test case)
    const hasGavinNewsom = content.includes('Gavin Newsom vs Donald Trump');
    console.log(`  ${hasGavinNewsom ? '✅' : '❌'} Gavin Newsom trending topic data`);
    
  } else {
    console.log('❌ Mock data file not found');
  }
} catch (error) {
  console.log('❌ Error reading mock data file:', error.message);
}

// Test admin hooks
try {
  const hooksPath = path.join(__dirname, '../web/lib/admin-hooks.ts');
  if (fs.existsSync(hooksPath)) {
    console.log('\n✅ Admin hooks file exists');
    
    const content = fs.readFileSync(hooksPath, 'utf8');
    
    // Check for mock data imports
    const hasMockImports = content.includes('mockTrendingTopics') && 
                          content.includes('mockGeneratedPolls') && 
                          content.includes('mockSystemMetrics');
    console.log(`  ${hasMockImports ? '✅' : '❌'} Mock data imports`);
    
    // Check for fallback logic
    const hasFallbackLogic = content.includes('using mock data');
    console.log(`  ${hasFallbackLogic ? '✅' : '❌'} Fallback to mock data logic`);
    
  } else {
    console.log('\n❌ Admin hooks file not found');
  }
} catch (error) {
  console.log('\n❌ Error reading admin hooks file:', error.message);
}

// Test dashboard component
try {
  const dashboardPath = path.join(__dirname, '../web/components/admin/dashboard/DashboardOverview.tsx');
  if (fs.existsSync(dashboardPath)) {
    console.log('\n✅ Dashboard component exists');
    
    const content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Check for mock data usage
    const hasMockChartData = content.includes('mockChartData');
    console.log(`  ${hasMockChartData ? '✅' : '❌'} Mock chart data usage`);
    
    // Check for real data hooks
    const hasRealDataHooks = content.includes('useTrendingTopics') && 
                            content.includes('useGeneratedPolls') && 
                            content.includes('useSystemMetrics');
    console.log(`  ${hasRealDataHooks ? '✅' : '❌'} Real data hooks`);
    
  } else {
    console.log('\n❌ Dashboard component not found');
  }
} catch (error) {
  console.log('\n❌ Error reading dashboard component:', error.message);
}

// Test sidebar component
try {
  const sidebarPath = path.join(__dirname, '../web/components/admin/layout/Sidebar.tsx');
  if (fs.existsSync(sidebarPath)) {
    console.log('\n✅ Sidebar component exists');
    
    const content = fs.readFileSync(sidebarPath, 'utf8');
    
    // Check for metrics display
    const hasMetricsDisplay = content.includes('metrics?.total_topics') && 
                             content.includes('metrics?.total_polls') && 
                             content.includes('metrics?.active_polls');
    console.log(`  ${hasMetricsDisplay ? '✅' : '❌'} Metrics display in sidebar`);
    
  } else {
    console.log('\n❌ Sidebar component not found');
  }
} catch (error) {
  console.log('\n❌ Error reading sidebar component:', error.message);
}

console.log('\n🎯 Dashboard Data Test Summary:');
console.log('- Mock data should now populate the dashboard');
console.log('- Trending topics should show Gavin Newsom vs Trump data');
console.log('- Charts should display realistic activity data');
console.log('- Sidebar should show actual metrics (15 topics, 8 polls, 3 active)');
console.log('- Activity feed should show recent actions');

console.log('\n🌐 Next Steps:');
console.log('1. Visit http://localhost:3001/admin');
console.log('2. Check that dashboard shows real data instead of wireframes');
console.log('3. Verify trending topics page has data');
console.log('4. Test approve/reject functionality');
console.log('5. Check that charts are populated with data');
