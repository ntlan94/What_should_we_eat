/**
 * ============================================================================
 * Project: What Should We Eat?
 * File: backend/server.js
 * Description: Initializes the Express server, middleware, and API routes.
 * Author: Jovian Niko Soesilo
 * Collaborators: Thanh Lan Ngo
 * Date Created: 2026-11-17
 * Last Modified: 2026-11-21
 * Modified by: Thanh Lan Ngo
 * ============================================================================
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import restaurantRoutes from './src/routes/restaurants.js';
import geocodeRoutes from './src/routes/geocode.js';
import roomRoutes from './src/routes/rooms.js';
import mapRoutes from './src/routes/map.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Allow cross-origin requests from local dev servers, Codespaces, or deployed frontends.
app.use(cors());

// Cap JSON request bodies to prevent oversized payload abuse.
app.use(express.json({ limit: '16kb' }));

// Health check endpoint to verify the server is alive.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Mount feature routers under /api/*
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/map', mapRoutes);

// Catch-all 404 handler for unknown API routes.
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});