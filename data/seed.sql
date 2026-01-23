DROP TABLE IF EXISTS listing_photos;
DROP TABLE IF EXISTS listings;

CREATE TABLE listings (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  price       INTEGER NOT NULL,
  beds        INTEGER NOT NULL,
  baths       INTEGER NOT NULL,
  status      TEXT NOT NULL, -- 'Active' or 'Sold'
  latitude    DOUBLE PRECISION,
  longitude   DOUBLE PRECISION,
  sold_at     TIMESTAMPTZ
);

CREATE TABLE listing_photos (
  id          SERIAL PRIMARY KEY,
  listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS favorites (
  user_email TEXT NOT NULL,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_email, listing_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_idx ON favorites(user_email);

-- ACTIVE LISTINGS

INSERT INTO listings (id, title, price, beds, baths, status, latitude, longitude, sold_at)
VALUES
  ('A1001', 'Bernal Heights View Home',     1895000, 3, 2, 'Active', 37.7412, -122.4190, NULL),
  ('A1002', 'Sunnyvale Family House',       2149000, 4, 3, 'Active', 37.3688, -122.0363, NULL),
  ('A1003', 'SoMa Modern Loft',             1499000, 2, 2, 'Active', 37.7786, -122.4059, NULL),
  ('A1004', 'Palo Alto Modern Ranch',       3280000, 4, 3, 'Active', 37.4419, -122.1430, NULL),
  ('A1005', 'Redwood City Townhome',        1395000, 3, 2, 'Active', 37.4852, -122.2364, NULL),
  ('A1006', 'San Jose Tech Bungalow',       1180000, 3, 2, 'Active', 37.3382, -121.8863, NULL),
  ('A1007', 'Mill Valley Hillside Retreat', 2595000, 4, 3, 'Active', 37.9060, -122.5449, NULL),
  ('A1008', 'Fremont Cul-de-Sac Home',      1325000, 4, 2, 'Active', 37.5483, -121.9886, NULL);

-- SOLD LISTINGS

INSERT INTO listings (id, title, price, beds, baths, status, latitude, longitude, sold_at)
VALUES
  ('S2001', 'Noe Valley Classic',           2050000, 3, 2, 'Sold', 37.7502, -122.4337, '2024-11-12T00:00:00Z'),
  ('S2002', 'Oakland Craftsman',           1295000, 3, 2, 'Sold', 37.8044, -122.2712, '2024-09-18T00:00:00Z'),
  ('S2003', 'Marina District Condo',        1750000, 2, 2, 'Sold', 37.8010, -122.4380, '2024-06-01T00:00:00Z'),
  ('S2004', 'Mission Dolores Flat',         1625000, 2, 2, 'Sold', 37.7599, -122.4269, '2024-03-15T00:00:00Z'),
  ('S2005', 'Berkeley Brownstone',          1890000, 3, 2, 'Sold', 37.8715, -122.2730, '2023-12-05T00:00:00Z'),
  ('S2006', 'Walnut Creek Family House',    1420000, 4, 3, 'Sold', 37.9101, -122.0652, '2023-08-20T00:00:00Z'),
  ('S2007', 'Los Gatos Estate',             3450000, 5, 4, 'Sold', 37.2358, -121.9624, '2023-05-10T00:00:00Z');

-- PHOTOS: ACTIVES

INSERT INTO listing_photos (listing_id, url, sort_order) VALUES
  -- A1001 Bernal Heights View Home
  ('A1001', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&auto=format&fit=crop', 0),
  ('A1001', 'https://images.unsplash.com/photo-1444419988131-046ed4e5ffd6?w=1600&auto=format&fit=crop', 1),
  ('A1001', 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1600&auto=format&fit=crop', 2),

  -- A1002 Sunnyvale Family House
  ('A1002', 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1600&auto=format&fit=crop', 0),
  ('A1002', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&auto=format&fit=crop', 1),
  ('A1002', 'https://images.unsplash.com/photo-1486304873000-235643847519?w=1600&auto=format&fit=crop', 2),

  -- A1003 SoMa Modern Loft
  ('A1003', 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1600&auto=format&fit=crop', 0),
  ('A1003', 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1600&auto=format&fit=crop', 1),

  -- A1004 Palo Alto Modern Ranch
  ('A1004', 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1600&auto=format&fit=crop', 0),
  ('A1004', 'https://images.unsplash.com/photo-1600585154340-0ef3c08c0632?w=1600&auto=format&fit=crop', 1),
  ('A1004', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&auto=format&fit=crop', 2),

  -- A1005 Redwood City Townhome
  ('A1005', 'https://images.unsplash.com/photo-1600607687920-4e2a534e6edb?w=1600&auto=format&fit=crop', 0),
  ('A1005', 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1600&auto=format&fit=crop', 1),

  -- A1006 San Jose Tech Bungalow
  ('A1006', 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&auto=format&fit=crop', 0),
  ('A1006', 'https://images.unsplash.com/photo-1600585154340-0ef3c08c0632?w=1600&auto=format&fit=crop', 1),

  -- A1007 Mill Valley Hillside Retreat
  ('A1007', 'https://images.unsplash.com/photo-1600585154154-4e5fe7c5f1a6?w=1600&auto=format&fit=crop', 0),
  ('A1007', 'https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?w=1600&auto=format&fit=crop', 1),
  ('A1007', 'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1600&auto=format&fit=crop', 2),

  -- A1008 Fremont Cul-de-Sac Home
  ('A1008', 'https://images.unsplash.com/photo-1600585154084-4e5fe7c5f1a6?w=1600&auto=format&fit=crop', 0),
  ('A1008', 'https://images.unsplash.com/photo-1600585154340-0ef3c08c0632?w=1600&auto=format&fit=crop', 1);

-- PHOTOS: SOLD

INSERT INTO listing_photos (listing_id, url, sort_order) VALUES
  -- S2001 Noe Valley Classic
  ('S2001', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&auto=format&fit=crop', 0),
  ('S2001', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&auto=format&fit=crop', 1),

  -- S2002 Oakland Craftsman
  ('S2002', 'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?w=1600&auto=format&fit=crop', 0),
  ('S2002', 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=1600&auto=format&fit=crop', 1),

  -- S2003 Marina District Condo
  ('S2003', 'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1600&auto=format&fit=crop', 0),
  ('S2003', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&auto=format&fit=crop', 1),

  -- S2004 Mission Dolores Flat
  ('S2004', 'https://images.unsplash.com/photo-1520256862855-398228c41684?w=1600&auto=format&fit=crop', 0),
  ('S2004', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1600&auto=format&fit=crop', 1),

  -- S2005 Berkeley Brownstone
  ('S2005', 'https://images.unsplash.com/photo-1512914890250-353c97c9e7e2?w=1600&auto=format&fit=crop', 0),
  ('S2005', 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1600&auto=format&fit=crop', 1),

  -- S2006 Walnut Creek Family House
  ('S2006', 'https://images.unsplash.com/photo-1600585154084-4e5fe7c5f1a6?w=1600&auto=format&fit=crop', 0),
  ('S2006', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&auto=format&fit=crop', 1),

  -- S2007 Los Gatos Estate
  ('S2007', 'https://images.unsplash.com/photo-1600585154154-4e5fe7c5f1a6?w=1600&auto=format&fit=crop', 0),
  ('S2007', 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=1600&auto=format&fit=crop', 1);