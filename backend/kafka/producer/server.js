const express = require('express');
const { Kafka } = require('kafkajs');
const config = require('../config');

const app = express();
app.use(express.json());

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'cybernova-producer-bridge',
  brokers: config.brokers,
  retry: {
    initialRetryTime: 300,
    retries: 3
  }
});

const producer = kafka.producer();
let isProducerConnected = false;
let isConnecting = false;

// Connect to Kafka Broker
async function connectProducer() {
  if (isConnecting || isProducerConnected) return;
  isConnecting = true;
  try {
    console.log(`[PRODUCER] Connecting to Kafka brokers: ${config.brokers.join(', ')}...`);
    await producer.connect();
    isProducerConnected = true;
    console.log(`[PRODUCER] Kafka Producer bridge successfully connected.`);
  } catch (error) {
    console.error(`[PRODUCER] Failed to connect Kafka producer:`, error.message);
  } finally {
    isConnecting = false;
  }
}

connectProducer();

// REST Route to publish an event
app.post('/publish', async (req, res) => {
  const { event } = req.body;
  if (!event) {
    return res.status(400).json({ error: 'Missing "event" payload object in request body' });
  }

  // Fail-fast if broker is host-offline, triggering background reconnect
  if (!isProducerConnected) {
    connectProducer(); // try to connect in background
    return res.status(503).json({ error: 'Kafka producer bridge disconnected. Reconnection attempt initiated in background.' });
  }

  try {
    const rawVal = JSON.stringify(event);
    console.log(`[PRODUCER] Publishing event ${event.event_uuid || event.event_id || 'unidentified'} to topic "${config.topic}"...`);
    
    await producer.send({
      topic: config.topic,
      messages: [
        {
          key: event.event_id || event.username || null,
          value: rawVal
        }
      ]
    });

    return res.status(200).json({ status: 'success', message: 'Event successfully published to Kafka topic' });
  } catch (error) {
    console.error(`[PRODUCER] Error publishing message to Kafka:`, error);
    return res.status(500).json({ error: `Failed to publish message: ${error.message}` });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: isProducerConnected ? 'UP' : 'DOWN',
    brokers: config.brokers,
    topic: config.topic
  });
});

// Run server
const port = config.producerPort;
const server = app.listen(port, () => {
  console.log(`[PRODUCER] Bridge server running on http://localhost:${port}`);
});

// Graceful exit
async function shutdown() {
  console.log('[PRODUCER] Shutting down Express server & disconnecting Kafka producer...');
  server.close();
  try {
    await producer.disconnect();
    console.log('[PRODUCER] Kafka producer disconnected cleanly.');
  } catch (e) {
    console.error('[PRODUCER] Disconnect error:', e.message);
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
