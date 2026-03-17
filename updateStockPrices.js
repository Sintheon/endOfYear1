const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  interval: process.env.UPDATE_INTERVAL_MINUTES ? parseInt(process.env.UPDATE_INTERVAL_MINUTES) : 1,
  logFile: process.env.LOG_FILE || path.join(__dirname, 'price_updates.log'),
  adminApiKey: process.env.ADMIN_API_KEY,
};

if (!config.adminApiKey) {
  console.error('ADMIN_API_KEY environment variable is required');
  process.exit(1);
}

const log = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [INFO] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(config.logFile, logMessage + '\n');
  },
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] ${message}`;
    console.error(logMessage);
    fs.appendFileSync(config.logFile, logMessage + '\n');
  },
  warn: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WARN] ${message}`;
    console.warn(logMessage);
    fs.appendFileSync(config.logFile, logMessage + '\n');
  }
};

if (!fs.existsSync(config.logFile)) {
  fs.writeFileSync(config.logFile, `Stock price update log created at ${new Date().toISOString()}\n\n`);
}

async function updateStockPrices() {
  log.info('Starting stock price update...');

  const httpModule = config.apiUrl.startsWith('https') ? https : http;
  const url = new URL('/api/stocks', config.apiUrl);

  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const requestBody = JSON.stringify({
      adminKey: config.adminApiKey
    });

    const req = httpModule.request(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            log.info(`Stock prices updated successfully: ${response.message || 'Success'}`);
            
            recordPriceHistory()
              .then(() => resolve(response))
              .catch(error => {
                log.error(`Failed to record price history: ${error.message}`);
                resolve(response);
              });
          } catch (error) {
            log.error(`Error parsing response: ${error.message}`);
            reject(error);
          }
        } else {
          const errorMsg = `Stock price update failed with status code ${res.statusCode}: ${data}`;
          log.error(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });

    req.on('error', (error) => {
      log.error(`Stock price update request failed: ${error.message}`);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

async function recordPriceHistory() {
  log.info('Recording price history...');

  const httpModule = config.apiUrl.startsWith('https') ? https : http;
  const url = new URL('/api/price-history', config.apiUrl);

  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const requestBody = JSON.stringify({
      adminKey: config.adminApiKey
    });

    const req = httpModule.request(url, requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            log.info(`Price history recorded successfully: ${response.message || 'Success'}`);
            resolve(response);
          } catch (error) {
            log.error(`Error parsing response: ${error.message}`);
            reject(error);
          }
        } else {
          const errorMsg = `Price history recording failed with status code ${res.statusCode}: ${data}`;
          log.error(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });

    req.on('error', (error) => {
      log.error(`Price history recording request failed: ${error.message}`);
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

async function startUpdater() {
  log.info('Stock Price Updater Started');
  log.info(`API URL: ${config.apiUrl}`);
  log.info(`Update Interval: ${config.interval} minutes`);

  try {
    await updateStockPrices();
    log.info(`Scheduled stock updates every ${config.interval} minutes`);
    setInterval(updateStockPrices, config.interval * 60 * 1000);
    
    process.on('SIGINT', () => {
      log.warn('Received shutdown signal. Stopping stock price updater.');
      process.exit(0);
    });
    
  } catch (error) {
    log.error(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

startUpdater();