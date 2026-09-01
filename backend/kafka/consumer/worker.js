const { Kafka } = require('kafkajs');
const urlModule = require('url');
const config = require('../config');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'cybernova-consumer-worker',
  brokers: config.brokers
});

const consumer = kafka.consumer({ groupId: config.consumerGroup });

// Helper to forward event JSON payload to FastAPI
function forwardEventToFastApi(eventData) {
  return new Promise((resolve, reject) => {
    try {
      const url = new urlModule.URL(`${config.fastApiUrl}/api/events/kafka-ingest`);
      const httpModule = url.protocol === 'https:' ? require('https') : require('http');
      const postData = JSON.stringify({ event: eventData });

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 5000
      };

      const req = httpModule.request(options, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              resolve({ raw: body });
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (e) => { reject(e); });
      req.on('timeout', () => { req.destroy(new Error('Connection timeout to FastAPI')); });

      req.write(postData);
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Start Consumer Daemon
async function startConsumer() {
  let connected = false;
  
  while (!connected) {
    try {
      console.log(`[CONSUMER] Connecting to Kafka brokers: ${config.brokers.join(', ')}...`);
      await consumer.connect();
      connected = true;
      console.log(`[CONSUMER] Consumer successfully connected to brokers.`);
    } catch (error) {
      console.error(`[CONSUMER] Failed connection effort: ${error.message}. Retrying in 5 seconds...`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }

  // Ensure topic exists before subscribing
  const admin = kafka.admin();
  try {
    console.log(`[CONSUMER] Ensuring topic "${config.topic}" exists...`);
    await admin.connect();
    const existingTopics = await admin.listTopics();
    if (!existingTopics.includes(config.topic)) {
      await admin.createTopics({
        topics: [{ topic: config.topic, numPartitions: 1, replicationFactor: 1 }],
      });
      console.log(`[CONSUMER] Topic "${config.topic}" created successfully.`);
    } else {
      console.log(`[CONSUMER] Topic "${config.topic}" already exists.`);
    }
    await admin.disconnect();
  } catch (err) {
    console.warn(`[CONSUMER] Topic check/creation warning: ${err.message}`);
  }

  try {
    console.log(`[CONSUMER] Subscribing to topic: "${config.topic}"...`);
    await consumer.subscribe({ topic: config.topic, fromBeginning: false });


    console.log(`[CONSUMER] Initializing message read loop...`);
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const timestamp = new Date().toISOString();
        if (!message.value) return;

        try {
          const rawValue = message.value.toString();
          console.log(`[CONSUMER] [${timestamp}] Incoming Event Received on Partition ${partition}. Processing...`);
          
          const event = JSON.parse(rawValue);
          
          // Forward event to FastAPI pipeline
          const response = await forwardEventToFastApi(event);
          console.log(`[CONSUMER] Successfully forwarded event ${event.event_id || event.id || 'unidentified'} to Blue Team FastAPI pipeline.`);
          console.log(`[CONSUMER] Pipeline outcome: Risk Score ${response.risk_score || 0} | Severity: ${response.risk_level || 'Low'} | Incident ID: ${response.incident_id || 'None'}`);
        } catch (error) {
          console.error(`[CONSUMER] [${timestamp}] Error processing message from partition ${partition}:`, error.message);
        }
      }
    });

  } catch (error) {
    console.error(`[CONSUMER] Critical failure in consumer run-loop:`, error.message);
    process.exit(1);
  }
}

// Start running worker daemon
startConsumer();

// Graceful exit
async function shutdown() {
  console.log('[CONSUMER] Shutting down consumer background worker...');
  try {
    await consumer.disconnect();
    console.log('[CONSUMER] Consumer disconnected cleanly.');
  } catch (e) {
    console.error('[CONSUMER] Disconnect error:', e.message);
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
