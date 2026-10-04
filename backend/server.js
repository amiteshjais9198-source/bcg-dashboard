// =============================================================================
// server.js  —  CardioSense · Non-Invasive Heart Monitoring System
//               Node.js / Express / Socket.io / Mongoose backend
//
// Data flow:
//   Python script  →  POST /api/vitals  →  MongoDB  →  Socket.io emit
//                                                           ↓
//                                            React frontend (Socket.io client)
//
// ── INTEGRATION POINTS ──────────────────────────────────────────────────────
//   • Python script POSTs JSON to POST /api/vitals, receives 201 Created
//   • React client connects via Socket.io and listens for 'new_vitals'
//   • React client calls GET /api/vitals/history on mount to seed the table
// ─────────────────────────────────────────────────────────────────────────────
// =============================================================================

'use strict';

// ── 1. Environment ────────────────────────────────────────────────────────────
require('dotenv').config();

const PORT          = process.env.PORT          || 5000;
const MONGO_URI     = process.env.MONGO_URI    
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map(o => o.trim());

// ── 2. Imports ────────────────────────────────────────────────────────────────
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');

// ── 3. Express app + raw HTTP server ─────────────────────────────────────────
//   We MUST create the raw http.Server so Socket.io can share the same port
//   as Express — no separate WebSocket port needed.
const app        = express();
const httpServer = http.createServer(app);

// ── 4. Socket.io  (strict CORS so Vite dev server is allowed) ─────────────────
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,      // ['http://localhost:5173', 'http://127.0.0.1:5173']
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Prefer WebSocket transport first — avoid polling overhead for live vitals
  transports: ['websocket', 'polling'],
});

// ── 5. Express middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
}));

app.use(express.json({ limit: '16kb' }));  // limit prevents abuse from Python loop
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// ── 6. MongoDB Schema & Model ─────────────────────────────────────────────────
//
//   Field names are kept exactly in sync with what the React frontend destructures:
//     { timestamp, heartRate, hrv, amplitude, riskStatus, sensorOnline, status, breathingRate }
//   DO NOT rename fields here without updating the frontend components too.
//
const VitalSchema = new mongoose.Schema(
  {
    // ISO date of the reading. Indexed for fast descending sort in /history.
    timestamp: {
      type:    Date,
      default: Date.now,
      index:   true,
    },

    // Beats per minute — integer expected from Python script
    heartRate: {
      type:     Number,
      required: true,
    },

    // Heart Rate Variability in milliseconds
    hrv: {
      type:     Number,
      required: true,
    },

    // BCG sensor amplitude in milli-g  (e.g. 0.83)
    amplitude: {
      type:     Number,
      required: true,
    },

    // AI risk classification:  0 = Normal  |  1 = Risk Detected
    // The React RiskCard maps:  0 → 'stable'  |  1 → 'risk'
    riskStatus: {
      type:    Number,
      enum:    [0, 1],
      default: 0,
    },

    // Whether the physical sensor is online / on chest
    sensorOnline: {
      type:    Boolean,
      default: true,
    },

    // Human-readable status string from ESP32 (e.g. 'sensor seene pe lagao', 'warmup', 'hilo')
    status: {
      type:    String,
      default: '--',
    },

    // Estimated breathing rate in breaths/min (derived from respPeak on ESP32)
    breathingRate: {
      type:    Number,
      default: null,
    },
  },
  {
    // Mongoose adds _id automatically; versionKey (__v) is noise we don't need.
    versionKey: false,
  }
);

const Vital = mongoose.model('Vital', VitalSchema);

// ── 7. Socket.io connection lifecycle ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.io] ✅ Client connected    → id: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] ❌ Client disconnected → id: ${socket.id}  reason: ${reason}`);
  });
});

// ── 8. API Routes ─────────────────────────────────────────────────────────────

// ── HEALTH CHECK ─────────────────────────────────────────────────────────────
//   curl http://localhost:5000/api/health
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime().toFixed(2) + 's',
    mongo:  mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── POST /api/vitals ──────────────────────────────────────────────────────────
//
//   Called by the Python hardware-listener script, typically in a tight loop.
//   Keeps the Python loop unblocked by:
//     • Responding with 201 immediately after save
//     • Doing the Socket.io emit after the response (non-blocking for the sender)
//
//   Expected JSON body from Python:
//   {
//     "heartRate": 74,
//     "hrv":       46,
//     "amplitude": 0.81,
//     "riskStatus": 0        // optional — defaults to 0 (Normal)
//   }
//
app.post('/api/vitals', async (req, res) => {
  try {
    const { heartRate, hrv, amplitude, riskStatus, sensorOnline, status, breathingRate } = req.body;

    // ── Sensor offline / no-chest detection ───────────────────────────────
    //   Bridge sends sensorOnline:false OR riskStatus:-1 when sensor is off chest,
    //   in motion, or warming up. In that case we emit 'sensor_offline' but do
    //   NOT save to MongoDB so the history table stays clean.
    if (sensorOnline === false || riskStatus === -1) {
      const offlinePayload = {
        status:    status || 'sensor offline',
        timestamp: new Date().toISOString(),
      };
      io.emit('sensor_offline', offlinePayload);
      console.warn(`[POST /api/vitals] ⚠ Sensor offline — status: "${offlinePayload.status}"`);
      return res.status(201).json({ ok: true, offline: true });
    }

    // ── Basic validation ───────────────────────────────────────────────────
    if (heartRate === undefined || hrv === undefined || amplitude === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: heartRate, hrv, amplitude',
      });
    }

    // ── Graceful Fallback if MongoDB is offline ────────────────────────────
    if (useMock) {
      const vitalObj = {
        _id:           'mock_' + mockIdCounter++,
        heartRate,
        hrv,
        amplitude,
        riskStatus:    riskStatus ?? 0,
        sensorOnline:  true,
        status:        status || '--',
        breathingRate: breathingRate ?? null,
        timestamp:     new Date().toISOString(),
      };

      mockHistory.unshift(vitalObj);
      if (mockHistory.length > 50) mockHistory.pop();

      _lastVitalTime = Date.now();
      res.status(201).json({ ok: true, id: vitalObj._id, mock: true });
      io.emit('new_vitals', vitalObj);
      console.log(`[MOCK POST /vitals] HR: ${heartRate} | HRV: ${hrv} | Amp: ${amplitude}g | Risk: ${riskStatus ?? 0} | Breath: ${breathingRate ?? '--'}`);
      return;
    }

    // ── Persist to MongoDB (if connected) ──────────────────────────────────
    const vital = await new Vital({
      heartRate,
      hrv,
      amplitude,
      riskStatus:    riskStatus ?? 0,
      sensorOnline:  true,
      status:        status || '--',
      breathingRate: breathingRate ?? null,
    }).save();

    _lastVitalTime = Date.now();
    res.status(201).json({ ok: true, id: vital._id });
    io.emit('new_vitals', vital.toObject());

    console.log(
      `[POST /api/vitals] HR: ${heartRate} bpm | HRV: ${hrv} ms | Amp: ${amplitude}g | Risk: ${riskStatus ?? 0} | Breath: ${breathingRate ?? '--'}`
    );

  } catch (err) {
    console.error('[POST /api/vitals] Error:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ── Fallback in-memory DB (used if MongoDB fails to connect) ─────────────────
let useMock = false;
let mockIdCounter = 1;
const mockHistory = [];

// ── GET /api/vitals/history ────────────────────────────────────────────────────
//
//   Returns the 10 most recent readings for the React PatientHistoryTable.
//
app.get('/api/vitals/history', async (_req, res) => {
  try {
    if (useMock) {
      return res.json(mockHistory.slice(0, 10));
    }

    const readings = await Vital.find()
      .sort({ timestamp: -1 })   // newest first
      .limit(10)
      .lean()                    // bypass Mongoose document instantiation
      .exec();

    res.json(readings);

  } catch (err) {
    console.error('[GET /api/vitals/history] Error:', err.message);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── 9. MongoDB connection + server start ──────────────────────────────────────
//
//   We delay httpServer.listen() until Mongoose is fully connected so we never
//   accept HTTP or WebSocket traffic before the DB is ready.
//
async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 2000, // Drop quickly if offline
    });
    console.log(`[MongoDB]    ✅ Connected → ${MONGO_URI}`);
  } catch (err) {
    console.error('[MongoDB]    ⚠️ Connection failed:', err.message);
    console.warn('             ↳ Falling back to in-memory MOCK database so the app can run.');
    useMock = true;
  }

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════╗');
    console.log('║   CardioSense · Heart Monitor  —  Backend        ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║   HTTP  + Socket.io  → http://localhost:${PORT}    ║`);
    console.log(`║   MongoDB            → ${useMock ? 'MOCK (Offline Mode)' : 'bcg_project'}               ║`);
    console.log(`║   CORS allowed       → ${ALLOWED_ORIGINS.join(', ')} ║`);
    console.log('╚══════════════════════════════════════════════════╝');
    console.log('');
  });
}

start();

// ── 10. Watchdog timer — fires sensor_offline if no data arrives for 5 s ──────
//   Prevents the frontend from showing stale data when the Python bridge drops.
let _lastVitalTime = null;

setInterval(() => {
  if (_lastVitalTime && Date.now() - _lastVitalTime > 5000) {
    io.emit('sensor_offline', {
      status:    'no data (5s timeout)',
      timestamp: new Date().toISOString(),
    });
    console.warn('[Watchdog] No vitals received for >5 s — emitting sensor_offline');
    _lastVitalTime = null; // reset so we don't spam the event every 2 s
  }
}, 2000);

// ── 11. Graceful shutdown ──────────────────────────────────────────────────────
//   Ensures in-flight requests finish and MongoDB is cleanly closed on SIGTERM
//   (e.g. when Docker stops the container or PM2 restarts the process).
async function shutdown(signal) {
  console.log(`\n[Server] ${signal} received — shutting down gracefully…`);
  await mongoose.connection.close();
  console.log('[MongoDB] Connection closed.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
