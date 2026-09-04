const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the parent backend folder (.env) if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

module.exports = {
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  topic: process.env.KAFKA_TOPIC_SECURITY_EVENTS || 'security-events',
  consumerGroup: process.env.KAFKA_CONSUMER_GROUP || 'cybernova-blue-team',
  producerPort: parseInt(process.env.PORT || process.env.KAFKA_PRODUCER_PORT || '9093', 10),
  fastApiUrl: process.env.FASTAPI_URL || 'http://localhost:8000',
  ssl: process.env.KAFKA_SSL === 'true' || Boolean(process.env.KAFKA_SASL_USER),
  saslUser: process.env.KAFKA_SASL_USER,
  saslPassword: process.env.KAFKA_SASL_PASSWORD,
  saslMechanism: process.env.KAFKA_SASL_MECHANISM || 'scram-sha-256'
};

