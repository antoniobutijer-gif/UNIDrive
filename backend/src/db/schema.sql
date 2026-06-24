-- ============================================================================
--  UNIDrive – Fizički model podataka (MySQL / InnoDB)
--  Prema dokumentaciji, pogl. 7.1 i 7.2.
--
--  Sve tablice koriste InnoDB stroj (ACID transakcije, zaključavanje na razini
--  retka, referencijalni integritet) te utf8mb4 / utf8mb4_unicode_ci skup
--  znakova radi podrške za hrvatske dijakritičke znakove.
-- ============================================================================

-- Napomena: tablice se kreiraju u bazi na koju je spojena migracijska skripta
-- (migrate.js odabire bazu prema DB_NAME, npr. `defaultdb` na Aivenu ili
-- `unidrive` lokalno). Zato ovdje nema CREATE DATABASE / USE.

-- Radi ponovljivosti (development/test) – brišemo poštujući FK redoslijed.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rides;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
--  Tablica: users  (Entitet KORISNIK)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  aai_uid       VARCHAR(50)    NOT NULL,                          -- AAI@EduHr identitet
  first_name    VARCHAR(50)    NOT NULL,
  last_name     VARCHAR(50)    NOT NULL,
  phone         VARCHAR(20)    NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  -- Dodatna polja koja podupiru funkcionalne zahtjeve, ali ne mijenjaju
  -- logički model iz dokumentacije:
  avatar_url    VARCHAR(255)   NULL,                              -- FZ-2: profilna slika
  ride_pref     ENUM('passenger','driver','both') NOT NULL DEFAULT 'both', -- FZ-2: preferencija
  is_blocked    BOOLEAN        NOT NULL DEFAULT FALSE,            -- FZ-13: blokiranje računa
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_aai_uid (aai_uid)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  Tablica: rides  (Entitet VOŽNJA)
-- ----------------------------------------------------------------------------
CREATE TABLE rides (
  id               INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  driver_id        INT UNSIGNED      NOT NULL,
  origin           VARCHAR(100)      NOT NULL,
  destination      VARCHAR(100)      NOT NULL,
  departure_time   DATETIME          NOT NULL,
  seats_available  TINYINT UNSIGNED  NOT NULL,
  price            DECIMAL(6,2)      NOT NULL,
  -- FZ-4: filtriranje prema preferencijama (npr. "klima,glazba,bez_pusenja").
  -- Pohranjeno kao SET radi indeksiranog filtriranja.
  preferences      SET('klima','glazba','bez_pusenja','tiha_voznja','prtljaga') NULL,
  status           ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  created_at       TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rides_driver (driver_id),
  -- Kompozitni indeks za brzu pretragu vožnji (FZ-3) bez full table scana:
  KEY idx_rides_search (origin, destination, departure_time),
  CONSTRAINT fk_rides_driver
    FOREIGN KEY (driver_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  Tablica: bookings  (Entitet REZERVACIJA – presječna tablica M:N)
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  ride_id        INT UNSIGNED   NOT NULL,
  passenger_id   INT UNSIGNED   NOT NULL,
  seats          TINYINT UNSIGNED NOT NULL DEFAULT 1,             -- FZ-5: jedno ili više mjesta
  status         ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_bookings_ride (ride_id),
  KEY idx_bookings_passenger (passenger_id),
  -- Sprječava dvostruku aktivnu rezervaciju istog putnika na istoj vožnji:
  UNIQUE KEY uk_booking_ride_passenger (ride_id, passenger_id),
  CONSTRAINT fk_bookings_ride
    FOREIGN KEY (ride_id) REFERENCES rides (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_bookings_passenger
    FOREIGN KEY (passenger_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  Tablica: reviews  (Entitet OCJENA)
-- ----------------------------------------------------------------------------
CREATE TABLE reviews (
  id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  reviewer_id  INT UNSIGNED     NOT NULL,
  reviewee_id  INT UNSIGNED     NOT NULL,
  ride_id      INT UNSIGNED     NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,                         -- 1–5 zvjezdica
  comment      TEXT             NULL,
  created_at   TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reviews_reviewee (reviewee_id),
  KEY idx_reviews_ride (ride_id),
  -- Korisnik ne može dvaput ocijeniti isto za istu vožnju:
  UNIQUE KEY uk_review_unique (reviewer_id, reviewee_id, ride_id),
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_reviewee
    FOREIGN KEY (reviewee_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_ride
    FOREIGN KEY (ride_id) REFERENCES rides (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
--  Tablica: notifications  (Entitet NOTIFIKACIJA)
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
  id           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED   NOT NULL,
  message      TEXT           NOT NULL,
  is_read      BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Indeks za brzo učitavanje nepročitanih obavijesti (vidi pogl. 7.2):
  KEY idx_notifications_user (user_id, is_read),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
