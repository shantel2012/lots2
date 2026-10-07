import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('parking.db');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    displayName TEXT,
    photoURL TEXT,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS parkings (
    id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    lat REAL,
    lng REAL,
    totalSpaces INTEGER,
    availableSpaces INTEGER,
    pricePerHour REAL,
    rating REAL,
    mapsUrl TEXT,
    evCharging INTEGER DEFAULT 0,
    covered INTEGER DEFAULT 0,
    accessible INTEGER DEFAULT 1,
    security INTEGER DEFAULT 1,
    distanceKm REAL DEFAULT 1.2
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    userId TEXT,
    parkingId TEXT,
    parkingName TEXT,
    startTime TEXT,
    endTime TEXT,
    status TEXT DEFAULT 'active',
    createdAt TEXT,
    checkedInAt TEXT,
    carPlate TEXT,
    userName TEXT,
    paymentMethod TEXT DEFAULT 'card',
    totalAmount REAL DEFAULT 5.0,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(parkingId) REFERENCES parkings(id)
  );

  CREATE TABLE IF NOT EXISTS parked_vehicles (
    id TEXT PRIMARY KEY,
    userId TEXT,
    facilityName TEXT,
    level TEXT,
    bayNumber TEXT,
    carPlate TEXT,
    notes TEXT,
    parkedAt TEXT,
    expiresAt TEXT
  );

  CREATE TABLE IF NOT EXISTS price_alerts (
    id TEXT PRIMARY KEY,
    userId TEXT,
    parkingId TEXT,
    parkingName TEXT,
    targetPrice REAL,
    initialPrice REAL,
    createdAt TEXT,
    notified INTEGER DEFAULT 0,
    notifiedAt TEXT,
    FOREIGN KEY(parkingId) REFERENCES parkings(id)
  );
`);

// Migrations in case tables already exist
try { db.exec(`ALTER TABLE parkings ADD COLUMN evCharging INTEGER DEFAULT 0;`); } catch {}
try { db.exec(`ALTER TABLE parkings ADD COLUMN covered INTEGER DEFAULT 0;`); } catch {}
try { db.exec(`ALTER TABLE parkings ADD COLUMN accessible INTEGER DEFAULT 1;`); } catch {}
try { db.exec(`ALTER TABLE parkings ADD COLUMN security INTEGER DEFAULT 1;`); } catch {}
try { db.exec(`ALTER TABLE parkings ADD COLUMN distanceKm REAL DEFAULT 1.2;`); } catch {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN checkedInAt TEXT;`); } catch {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN carPlate TEXT;`); } catch {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN userName TEXT;`); } catch {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN paymentMethod TEXT DEFAULT 'card';`); } catch {}
try { db.exec(`ALTER TABLE bookings ADD COLUMN totalAmount REAL DEFAULT 5.0;`); } catch {}

// Seed / populate diverse parking facilities
const parkingCount = db.prepare('SELECT COUNT(*) as count FROM parkings').get() as { count: number };
if (parkingCount.count < 5) {
  // Clear and seed rich parking facilities
  db.prepare('DELETE FROM parkings').run();

  const insert = db.prepare(`
    INSERT INTO parkings (id, name, address, lat, lng, totalSpaces, availableSpaces, pricePerHour, rating, mapsUrl, evCharging, covered, accessible, security, distanceKm)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialParkings = [
    {
      id: 'p1',
      name: 'City Center Plaza Garage',
      address: 'Harare CBD, Jason Moyo Ave',
      lat: -17.8252,
      lng: 31.0335,
      totalSpaces: 60,
      availableSpaces: 18,
      pricePerHour: 2.50,
      rating: 4.6,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-17.8252,31.0335',
      evCharging: 1,
      covered: 1,
      accessible: 1,
      security: 1,
      distanceKm: 0.4
    },
    {
      id: 'p2',
      name: 'Eastgate Mall Underground Bay',
      address: 'Robert Mugabe Rd & Sam Nujoma',
      lat: -17.8312,
      lng: 31.0522,
      totalSpaces: 120,
      availableSpaces: 42,
      pricePerHour: 1.50,
      rating: 4.3,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-17.8312,31.0522',
      evCharging: 0,
      covered: 1,
      accessible: 1,
      security: 1,
      distanceKm: 1.2
    },
    {
      id: 'p3',
      name: 'Joina City Multi-Level Park',
      address: 'Julius Nyerere Way & Jason Moyo',
      lat: -17.8285,
      lng: 31.0450,
      totalSpaces: 200,
      availableSpaces: 84,
      pricePerHour: 2.00,
      rating: 4.7,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-17.8285,31.0450',
      evCharging: 1,
      covered: 1,
      accessible: 1,
      security: 1,
      distanceKm: 0.8
    },
    {
      id: 'p4',
      name: 'Sam Levy’s Village North Lot',
      address: 'Borrowdale Rd, Harare',
      lat: -17.7538,
      lng: 31.0855,
      totalSpaces: 150,
      availableSpaces: 5,
      pricePerHour: 3.00,
      rating: 4.8,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-17.7538,31.0855',
      evCharging: 1,
      covered: 0,
      accessible: 1,
      security: 1,
      distanceKm: 6.5
    },
    {
      id: 'p5',
      name: 'Avondale Shopping Centre Bay',
      address: 'King George Rd, Avondale',
      lat: -17.7981,
      lng: 31.0378,
      totalSpaces: 80,
      availableSpaces: 29,
      pricePerHour: 1.75,
      rating: 4.2,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-17.7981,31.0378',
      evCharging: 0,
      covered: 0,
      accessible: 1,
      security: 1,
      distanceKm: 3.1
    },
    {
      id: 'p6',
      name: 'Newlands Express Open Air Park',
      address: 'Enterprise Rd, Newlands',
      lat: -17.8105,
      lng: 31.0792,
      totalSpaces: 45,
      availableSpaces: 14,
      pricePerHour: 1.00,
      rating: 4.0,
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-17.8105,31.0792',
      evCharging: 0,
      covered: 0,
      accessible: 1,
      security: 0,
      distanceKm: 2.8
    }
  ];

  for (const p of initialParkings) {
    insert.run(
      p.id, 
      p.name, 
      p.address, 
      p.lat, 
      p.lng, 
      p.totalSpaces, 
      p.availableSpaces, 
      p.pricePerHour, 
      p.rating, 
      p.mapsUrl,
      p.evCharging,
      p.covered,
      p.accessible,
      p.security,
      p.distanceKm
    );
  }
}

export default db;
