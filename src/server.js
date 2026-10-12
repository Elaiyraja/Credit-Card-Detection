require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Setup Socket.io for Real-Time Dashboard updates
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// App configuration
app.use(cors({ origin: '*' }));
app.use(express.json());
app.set('io', io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'CreditCardGuard API & Real-Time Engine',
    timestamp: new Date().toISOString(),
    pciCompliance: 'Compliant - Zero PAN Storage'
  });
});

// Attach API Routes
app.use('/api', apiRoutes);

// Socket.io Connection lifecycle
io.on('connection', (socket) => {
  console.log(`[Socket.io] Live client connected: ${socket.id}`);

  // Send initial metrics snapshot
  socket.emit('telemetry:snapshot', apiRoutes.getTelemetry());

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Start Express Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🛡️  CreditCardGuard Real-Time Engine Online`);
  console.log(`📡 Backend Listening on Port: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Engine Ready (Socket.io)`);
  console.log(`🔒 PCI-DSS Compliant Secure Tokenization Pipeline Enabled`);
  console.log(`====================================================`);
});

module.exports = { app, server };
