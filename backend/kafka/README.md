# CyberNova Apache Kafka Event-Driven Messaging Bridge

This directory contains the Apache Kafka middleware constructed using KafkaJS to decouple the Red Team attack simulation triggers from the Blue Team detection and threat mitigation processing pipeline.

## Architectural Flow
```text
Red Team Simulator (UI) ▬► FastAPI (/simulate/attack)
                               │
                       [POST]  ▼
Node.js Kafka Producer Bridge (Port 9093 /publish) ▬► Apache Kafka Broker (Port 9092)
                                                             │
                                                             ▼
                                               Node.js Kafka Consumer Worker
                                                             │
                                                     [POST]  ▼
                                              FastAPI (/events/kafka-ingest)
                                                             │
                                                             ▼
                                                Blue Team Pipeline & SOAR
```

---

## Prerequisites
1. **Node.js** v18 or later.
2. **Apache Kafka** broker running locally at `localhost:9092` (you can start one in seconds using the provided Docker configuration: `docker compose up -d` in this directory).

---

## Installation
Run the following commands to install dependencies:
```bash
cd backend/kafka
npm install
```

---

## Running the Services
Start both services in background terminals:

### 1. Producer Bridge Server (Port 9093)
```bash
npm run producer
```

### 2. Consumer Worker Daemon
```bash
npm run consumer
```

---

## Resiliency and Fallbacks
The FastAPI simulator endpoint checks if the Node Producer bridge is reachable. If it is offline or down, the system prints a warning log and automatically falls back to **synchronous processing**. This ensures that the application remains fully functional during test executions or if Kafka experiences network degradation.
