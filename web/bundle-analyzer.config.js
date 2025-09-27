/**
 * Bundle Analyzer Configuration
 * 
 * This configuration provides comprehensive bundle analysis tools
 * for monitoring and optimizing the application's bundle size.
 */


const bundleAnalyzerConfig = {
  // Bundle analyzer plugin configuration
  analyzer: {
    // Server mode - opens in browser
    server: {
      analyzerMode: 'server',
      analyzerPort: 8888,
      openAnalyzer: true,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
      statsOptions: {
        source: false,
        modules: false,
        chunks: true,
        chunkModules: true,
        chunkOrigins: true,
        assets: true,
        cached: false,
        cachedAssets: false,
        reasons: true,
        usedExports: true,
        providedExports: true,
        optimizationBailout: true,
        errorDetails: true,
        chunkRelations: true,
        dependentModules: true,
        runtimeModules: true,
      },
    },
    
    // Static mode - generates HTML report
    static: {
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    },
    
    // JSON mode - generates JSON report
    json: {
      analyzerMode: 'json',
      reportFilename: 'bundle-report.json',
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json',
    },
  },

  // Bundle size thresholds
  thresholds: {
    // Maximum bundle sizes (in bytes)
    maxBundleSize: 512000, // 500KB
    maxChunkSize: 244000,  // 250KB
    maxAssetSize: 512000,  // 500KB
    
    // Warning thresholds
    warningBundleSize: 400000, // 400KB
    warningChunkSize: 200000,  // 200KB
    warningAssetSize: 400000,  // 400KB
  },

  // Bundle analysis rules
  rules: {
    // Check for duplicate dependencies
    checkDuplicates: true,
    
    // Check for unused dependencies
    checkUnused: true,
    
    // Check for large dependencies
    checkLargeDeps: true,
    largeDepThreshold: 100000, // 100KB
    
    // Check for circular dependencies
    checkCircular: true,
    
    // Check for missing dependencies
    checkMissing: true,
  },

  // Performance monitoring
  performance: {
    // Enable performance hints
    hints: 'warning',
    
    // Maximum entry point size
    maxEntrypointSize: 512000, // 500KB
    
    // Maximum asset size
    maxAssetSize: 512000, // 500KB
    
    // Asset filter function
    assetFilter: (assetFilename) => {
      // Only check JS and CSS files
      return /\.(js|css)$/.test(assetFilename);
    },
  },

  // Bundle optimization suggestions
  optimization: {
    // Suggest code splitting for large chunks
    suggestCodeSplitting: true,
    codeSplittingThreshold: 200000, // 200KB
    
    // Suggest tree shaking for unused code
    suggestTreeShaking: true,
    
    // Suggest dynamic imports for large modules
    suggestDynamicImports: true,
    dynamicImportThreshold: 100000, // 100KB
    
    // Suggest vendor chunk optimization
    suggestVendorOptimization: true,
  },

  // Reporting configuration
  reporting: {
    // Generate reports in multiple formats
    formats: ['html', 'json', 'txt'],
    
    // Include detailed analysis
    detailed: true,
    
    // Include recommendations
    recommendations: true,
    
    // Include performance metrics
    performance: true,
    
    // Include security analysis
    security: true,
  },

  // CI/CD integration
  ci: {
    // Fail build if bundle size exceeds thresholds
    failOnLargeBundle: true,
    
    // Generate reports for CI
    generateReports: true,
    
    // Upload reports to CI artifacts
    uploadReports: false,
    
    // Compare with previous builds
    compareWithPrevious: true,
  },
};

export default bundleAnalyzerConfig;
