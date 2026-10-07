import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import db from "./src/db";
import { v4 as uuidv4 } from 'uuid';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes: Parkings
  app.get("/api/parkings", (req, res) => {
    try {
      const parkings = db.prepare('SELECT * FROM parkings').all();
      res.json(parkings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parkings" });
    }
  });

  app.post("/api/parkings", (req, res) => {
    const { 
      name, 
      address, 
      lat, 
      lng, 
      totalSpaces, 
      availableSpaces, 
      pricePerHour, 
      rating, 
      mapsUrl,
      evCharging = 0,
      covered = 0,
      accessible = 1,
      security = 1,
      distanceKm = 1.5
    } = req.body;

    try {
      const id = uuidv4();
      const insert = db.prepare(`
        INSERT INTO parkings (
          id, name, address, lat, lng, totalSpaces, availableSpaces, 
          pricePerHour, rating, mapsUrl, evCharging, covered, accessible, security, distanceKm
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(
        id, 
        name, 
        address, 
        lat || -17.8252, 
        lng || 31.0335, 
        totalSpaces || 50, 
        availableSpaces || totalSpaces || 50, 
        pricePerHour || 2.0, 
        rating || 4.5, 
        mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
        evCharging ? 1 : 0,
        covered ? 1 : 0,
        accessible ? 1 : 0,
        security ? 1 : 0,
        distanceKm || 1.5
      );
      res.status(201).json({ id, ...req.body });
    } catch (error) {
      console.error("Create parking error:", error);
      res.status(500).json({ error: "Failed to create parking" });
    }
  });

  // Facility bay sensor simulation
  app.get("/api/parkings/:id/sensors", (req, res) => {
    const { id } = req.params;
    try {
      const parking = db.prepare('SELECT * FROM parkings WHERE id = ?').get(id) as any;
      if (!parking) {
        return res.status(404).json({ error: "Parking not found" });
      }

      // Generate 18 simulated ultrasonic bay sensors with live status
      const totalBays = Math.min(24, parking.totalSpaces || 24);
      const openCount = parking.availableSpaces || 8;
      const bays = [];

      for (let i = 1; i <= totalBays; i++) {
        const isOccupied = i > openCount;
        const section = String.fromCharCode(65 + Math.floor((i - 1) / 6)); // A, B, C, D
        const bayNumber = `${section}-${String((i - 1) % 6 + 1).padStart(2, '0')}`;
        bays.push({
          id: `sensor-${id}-${i}`,
          bayNumber,
          section,
          status: isOccupied ? 'occupied' : 'vacant',
          signalStrength: '98%',
          sensorType: 'Ultrasonic Optical Dual-Node',
          lastDetectionSec: Math.floor(Math.random() * 300) + 12,
        });
      }

      res.json({
        parkingId: id,
        facilityName: parking.name,
        totalBays,
        vacantBays: openCount,
        occupiedBays: Math.max(0, totalBays - openCount),
        occupancyRate: Math.round(((totalBays - openCount) / totalBays) * 100),
        bays,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sensor telemetry" });
    }
  });

  // Bookings API
  app.get("/api/bookings/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const bookings = db.prepare('SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC').all(userId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", (req, res) => {
    const { 
      userId, 
      parkingId, 
      parkingName, 
      startTime, 
      endTime, 
      userName, 
      carPlate, 
      paymentMethod = 'card',
      totalAmount = 5.0
    } = req.body;

    try {
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      
      const existing = db.prepare('SELECT * FROM parkings WHERE id = ?').get(parkingId);
      if (!existing) {
        db.prepare(`
          INSERT INTO parkings (id, name, address, lat, lng, totalSpaces, availableSpaces, pricePerHour, rating, mapsUrl)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(parkingId, parkingName, 'City Center', -17.8252, 31.0335, 30, 29, 2.50, 4.5, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parkingName)}`);
      } else {
        db.prepare('UPDATE parkings SET availableSpaces = MAX(0, availableSpaces - 1) WHERE id = ?').run(parkingId);
      }

      const insert = db.prepare(`
        INSERT INTO bookings (id, userId, parkingId, parkingName, startTime, endTime, status, createdAt, userName, carPlate, paymentMethod, totalAmount)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)
      `);
      insert.run(id, userId, parkingId, parkingName, startTime, endTime || null, createdAt, userName, carPlate, paymentMethod, totalAmount);
      
      res.status(201).json({ 
        id, 
        userId, 
        parkingId, 
        parkingName, 
        startTime, 
        endTime, 
        status: 'active', 
        createdAt, 
        userName, 
        carPlate,
        paymentMethod,
        totalAmount
      });
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).json({ error: "Failed to create booking" });
    }
  });

  app.post("/api/bookings/:id/cancel", (req, res) => {
    const { id } = req.params;
    try {
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (booking.status !== 'cancelled') {
        db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id);
        if (booking.parkingId) {
          db.prepare('UPDATE parkings SET availableSpaces = MIN(totalSpaces, availableSpaces + 1) WHERE id = ?').run(booking.parkingId);
        }
      }
      
      res.json({ success: true, id, status: 'cancelled' });
    } catch (error) {
      console.error("Cancel booking error:", error);
      res.status(500).json({ error: "Failed to cancel booking" });
    }
  });

  app.post("/api/bookings/:id/checkin", (req, res) => {
    const { id } = req.params;
    try {
      const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }

      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: "This booking was cancelled and cannot be scanned." });
      }

      const checkedInAt = new Date().toISOString();
      db.prepare("UPDATE bookings SET status = 'checked_in', checkedInAt = ? WHERE id = ?").run(checkedInAt, id);

      res.json({ success: true, id, status: 'checked_in', checkedInAt });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  // Find My Car / Parked Vehicle Pin API
  app.get("/api/car-location/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const location = db.prepare('SELECT * FROM parked_vehicles WHERE userId = ? ORDER BY parkedAt DESC LIMIT 1').get(userId);
      res.json(location || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch car location" });
    }
  });

  app.post("/api/car-location", (req, res) => {
    const { userId, facilityName, level, bayNumber, carPlate, notes, timerMinutes = 120 } = req.body;
    try {
      const id = uuidv4();
      const parkedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + timerMinutes * 60 * 1000).toISOString();

      // Clear any prior pin for this user
      db.prepare('DELETE FROM parked_vehicles WHERE userId = ?').run(userId);

      const insert = db.prepare(`
        INSERT INTO parked_vehicles (id, userId, facilityName, level, bayNumber, carPlate, notes, parkedAt, expiresAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insert.run(id, userId, facilityName, level, bayNumber, carPlate, notes, parkedAt, expiresAt);

      res.status(201).json({ id, userId, facilityName, level, bayNumber, carPlate, notes, parkedAt, expiresAt });
    } catch (error) {
      console.error("Save car location error:", error);
      res.status(500).json({ error: "Failed to save car location" });
    }
  });

  app.delete("/api/car-location/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      db.prepare('DELETE FROM parked_vehicles WHERE userId = ?').run(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear car location" });
    }
  });

  // ==========================================
  // Price Alerts API & Real-Time Rate Monitoring
  // ==========================================
  app.get("/api/price-alerts/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const alerts = db.prepare(`
        SELECT a.*, p.pricePerHour as currentPrice, p.address, p.availableSpaces
        FROM price_alerts a
        LEFT JOIN parkings p ON a.parkingId = p.id
        WHERE a.userId = ?
        ORDER BY a.createdAt DESC
      `).all(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Fetch price alerts error:", error);
      res.status(500).json({ error: "Failed to fetch price alerts" });
    }
  });

  app.post("/api/price-alerts", (req, res) => {
    const { userId, parkingId, parkingName, targetPrice, initialPrice } = req.body;
    if (!userId || !parkingId || targetPrice === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Check if alert already exists for this user and parking facility
      const existing = db.prepare('SELECT * FROM price_alerts WHERE userId = ? AND parkingId = ?').get(userId, parkingId) as any;
      const createdAt = new Date().toISOString();

      if (existing) {
        db.prepare(`
          UPDATE price_alerts 
          SET targetPrice = ?, initialPrice = ?, notified = 0, notifiedAt = NULL, createdAt = ?
          WHERE id = ?
        `).run(Number(targetPrice), Number(initialPrice || existing.initialPrice), createdAt, existing.id);
        
        const updated = db.prepare('SELECT * FROM price_alerts WHERE id = ?').get(existing.id);
        return res.json(updated);
      }

      const id = uuidv4();
      const insert = db.prepare(`
        INSERT INTO price_alerts (id, userId, parkingId, parkingName, targetPrice, initialPrice, createdAt, notified)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0)
      `);
      insert.run(id, userId, parkingId, parkingName, Number(targetPrice), Number(initialPrice || 2.5), createdAt);

      const created = db.prepare('SELECT * FROM price_alerts WHERE id = ?').get(id);
      res.status(201).json(created);
    } catch (error) {
      console.error("Create price alert error:", error);
      res.status(500).json({ error: "Failed to create price alert" });
    }
  });

  app.delete("/api/price-alerts/:id", (req, res) => {
    const { id } = req.params;
    try {
      db.prepare('DELETE FROM price_alerts WHERE id = ?').run(id);
      res.json({ success: true, id });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete price alert" });
    }
  });

  // Check for triggered alerts for a user
  app.get("/api/price-alerts/:userId/check", (req, res) => {
    const { userId } = req.params;
    try {
      const triggered = db.prepare(`
        SELECT a.*, p.pricePerHour as currentPrice, p.address, p.availableSpaces
        FROM price_alerts a
        JOIN parkings p ON a.parkingId = p.id
        WHERE a.userId = ? AND p.pricePerHour <= a.targetPrice
      `).all(userId) as any[];

      res.json(triggered);
    } catch (error) {
      res.status(500).json({ error: "Failed to check price alerts" });
    }
  });

  // Update parking price (e.g. operator adjustment, off-peak discount, or flash promo)
  app.post("/api/parkings/:id/update-price", (req, res) => {
    const { id } = req.params;
    const { newPrice } = req.body;
    if (newPrice === undefined || isNaN(Number(newPrice))) {
      return res.status(400).json({ error: "Invalid price provided" });
    }

    try {
      const numPrice = Number(newPrice);
      db.prepare('UPDATE parkings SET pricePerHour = ? WHERE id = ?').run(numPrice, id);
      const updatedParking = db.prepare('SELECT * FROM parkings WHERE id = ?').get(id) as any;

      // Find any newly triggered alerts for this parking facility
      const now = new Date().toISOString();
      const triggeredAlerts = db.prepare(`
        SELECT * FROM price_alerts 
        WHERE parkingId = ? AND targetPrice >= ?
      `).all(id, numPrice) as any[];

      // Mark them as notified
      db.prepare(`
        UPDATE price_alerts 
        SET notified = 1, notifiedAt = ?
        WHERE parkingId = ? AND targetPrice >= ?
      `).run(now, id, numPrice);

      res.json({
        success: true,
        parking: updatedParking,
        triggeredAlertsCount: triggeredAlerts.length,
        triggeredAlerts,
      });
    } catch (error) {
      console.error("Update parking price error:", error);
      res.status(500).json({ error: "Failed to update price" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
