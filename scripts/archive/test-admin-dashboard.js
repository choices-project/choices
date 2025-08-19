const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Admin Dashboard Implementation...\n');

// Check if required files exist
const requiredFiles = [
  'web/lib/admin-store.ts',
  'web/lib/admin-hooks.ts',
  'web/components/admin/charts/BasicCharts.tsx',
  'web/components/admin/layout/AdminLayout.tsx',
  'web/components/admin/layout/Sidebar.tsx',
  'web/components/admin/layout/Header.tsx',
  'web/components/admin/dashboard/DashboardOverview.tsx',
  'web/components/admin/trending-topics/TrendingTopicsPage.tsx',
  'web/app/admin/dashboard/page.tsx',
  'web/app/admin/trending-topics/page.tsx',
];

console.log('📁 Checking required files:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check package.json for required dependencies
console.log('\n📦 Checking dependencies:');
const packageJsonPath = path.join(__dirname, '../web/package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    '@tanstack/react-query',
    'zustand',
    'recharts',
    '@visx/visx',
    'echarts',
    'echarts-for-react',
    'lucide-react',
    'date-fns'
  ];
  
  const missingDeps = [];
  requiredDeps.forEach(dep => {
    const hasDep = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    console.log(`  ${hasDep ? '✅' : '❌'} ${dep}`);
    if (!hasDep) missingDeps.push(dep);
  });
  
  if (missingDeps.length > 0) {
    console.log(`\n⚠️  Missing dependencies: ${missingDeps.join(', ')}`);
    console.log('   Run: npm install ' + missingDeps.join(' '));
  }
}

// Check TypeScript configuration
console.log('\n⚙️  Checking TypeScript configuration:');
const tsConfigPath = path.join(__dirname, '../web/tsconfig.json');
if (fs.existsSync(tsConfigPath)) {
  console.log('  ✅ tsconfig.json exists');
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
  if (tsConfig.compilerOptions?.strict) {
    console.log('  ✅ Strict mode enabled');
  } else {
    console.log('  ⚠️  Strict mode not enabled');
  }
} else {
  console.log('  ❌ tsconfig.json not found');
}

// Check environment variables
console.log('\n🔐 Checking environment setup:');
const envPath = path.join(__dirname, '../web/.env.local');
if (fs.existsSync(envPath)) {
  console.log('  ✅ .env.local exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasServiceRoleKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  console.log(`  ${hasSupabaseUrl ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL`);
  console.log(`  ${hasServiceRoleKey ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY`);
} else {
  console.log('  ❌ .env.local not found');
  console.log('  📝 Create web/.env.local with your Supabase credentials');
}

// Summary
console.log('\n📊 Summary:');
if (allFilesExist) {
  console.log('✅ All required files are present');
} else {
  console.log('❌ Some required files are missing');
}

console.log('\n🚀 Next Steps:');
console.log('1. Ensure all dependencies are installed: npm install');
console.log('2. Set up environment variables in web/.env.local');
console.log('3. Start the development server: npm run dev');
console.log('4. Navigate to http://localhost:3000/admin');
console.log('5. Test the dashboard functionality');

console.log('\n📚 Documentation:');
console.log('- Admin Dashboard Plan: docs/consolidated/features/ADMIN_DASHBOARD_PLAN.md');
console.log('- SPA Real-time Strategy: docs/consolidated/features/SPA_REALTIME_STRATEGY.md');
console.log('- Development Guide: docs/consolidated/development/DEVELOPMENT_GUIDE.md');
