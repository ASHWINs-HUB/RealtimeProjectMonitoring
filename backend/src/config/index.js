import dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME'
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
  },

  github: {
    token: process.env.GITHUB_TOKEN,
    org: process.env.GITHUB_ORG || 'personal',
    apiUrl: 'https://api.github.com'
  },

  jira: {
    baseUrl: (process.env.JIRA_BASE_URL || '').trim(),
    email: (process.env.JIRA_EMAIL || '').trim(),
    apiToken: (process.env.JIRA_API_TOKEN || '').trim(),
    webhookToken: process.env.JIRA_WEBHOOK_TOKEN || 'secure_jira_pulse_token_2024'
  },

  webhook: {
    secret: process.env.WEBHOOK_SECRET
  },

  ml: {
    retrainCron: process.env.ML_RETRAIN_CRON || '0 */6 * * *',
    minSamples: parseInt(process.env.ML_MIN_SAMPLES) || 5
  },

  cors: {
    origins: process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL]
      : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://172.17.25.164:3002', 'http://172.17.25.164:3003', 'http://192.168.56.1:3002', 'http://192.168.56.1:3003', 'http://192.168.41.1:3002', 'http://192.168.41.1:3003']
  }
};

export default config;
