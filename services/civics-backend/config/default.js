/**
 * Default configuration for Civics Backend Service
 */

export default {
  // Service settings
  service: {
    name: 'civics-backend',
    version: '1.0.0',
    port: process.env.PORT || 3001,
    environment: process.env.NODE_ENV || 'development'
  },
  
  // Database settings
  database: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    timeout: 30000
  },
  
  // API settings
  apis: {
    congressGov: {
      baseUrl: 'https://api.congress.gov/v3',
      apiKey: process.env.CONGRESS_GOV_API_KEY,
      timeout: 30000
    },
    googleCivic: {
      baseUrl: 'https://www.googleapis.com/civicinfo/v2',
      apiKey: process.env.GOOGLE_CIVIC_API_KEY,
      timeout: 30000
    },
    fec: {
      baseUrl: 'https://api.open.fec.gov/v1',
      apiKey: process.env.FEC_API_KEY,
      timeout: 30000
    }
  },
  
  // Scheduling
  schedule: {
    ingestion: process.env.INGESTION_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    healthCheck: process.env.HEALTH_CHECK_INTERVAL || 300000 // 5 minutes
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'json'
  }
};




