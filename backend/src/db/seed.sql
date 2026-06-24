-- ============================================================================
--  UNIDrive – Demonstracijski podaci (seed)
--  Podaci usklađeni s primjerima iz frontend dizajna (UNIDrive.dc.html).
--  (Bazu odabire migrate.js prema DB_NAME – ovdje nema USE.)
-- ============================================================================

INSERT INTO users (aai_uid, first_name, last_name, phone, role, ride_pref) VALUES
  ('admin@unidu.hr',          'Admin',   'UNIDrive', NULL,            'admin',   'both'),
  ('mkovac@student.unidu.hr', 'Marta',   'Kovač',    '+385912345001', 'student', 'driver'),
  ('iperic@student.unidu.hr', 'Ivan',    'Perić',    '+385912345002', 'student', 'driver'),
  ('lsaric@student.unidu.hr', 'Lucija',  'Šarić',    '+385912345003', 'student', 'driver'),
  ('pvlasic@student.unidu.hr','Petar',   'Vlašić',   '+385912345004', 'student', 'both'),
  ('astudent@student.unidu.hr','Ana',    'Anić',     '+385912345005', 'student', 'passenger');

-- Vožnje pokrivaju dubrovačke kvartove ↔ fakultete/dom (obostrano).
INSERT INTO rides (driver_id, origin, destination, departure_time, seats_available, price, preferences, status) VALUES
  (2, 'Lapad',     'Kampus',             '2026-06-25 07:40:00', 3, 2.50, 'klima,glazba',      'active'),
  (3, 'Mokošica',  'Pomorski fakultet',  '2026-06-25 07:25:00', 2, 2.00, 'bez_pusenja',       'active'),
  (4, 'Babin Kuk', 'Ekonomski fakultet', '2026-06-25 08:10:00', 1, 3.00, 'klima,tiha_voznja', 'active'),
  (5, 'Gruž',      'Studentski dom',     '2026-06-25 07:00:00', 3, 1.50, 'glazba,prtljaga',   'active'),
  (2, 'Kampus',    'Lapad',              '2026-06-25 15:30:00', 3, 2.50, 'klima',             'active'),
  (3, 'Ploče',     'Kampus',             '2026-06-25 07:50:00', 2, 2.00, 'bez_pusenja',       'active');

INSERT INTO bookings (ride_id, passenger_id, seats, status) VALUES
  (1, 6, 1, 'confirmed');

INSERT INTO reviews (reviewer_id, reviewee_id, ride_id, rating, comment) VALUES
  (6, 2, 1, 5, 'Ugodna i točna vožnja, preporučam!');

INSERT INTO notifications (user_id, message, is_read) VALUES
  (2, 'Ana Anić je rezervirala mjesto na vašoj vožnji Lapad → Kampus.', FALSE),
  (6, 'Vaša rezervacija za vožnju Lapad → Kampus je potvrđena.', TRUE);
