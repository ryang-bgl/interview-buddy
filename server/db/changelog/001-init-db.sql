--liquibase formatted sql
--changeset rui:001

CREATE TABLE IF NOT EXISTS `user`
(
  id                TEXT PRIMARY KEY,
  email             TEXT,
  first_name        TEXT,
  last_name         TEXT,
  created_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leetstack_username TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS user_dsa
(
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            TEXT        NOT NULL,
  title              TEXT        NOT NULL,
  title_slug         TEXT        NOT NULL,
  difficulty         TEXT        NOT NULL,
  is_paid_only       INTEGER     NOT NULL DEFAULT 0,
  description        TEXT        NOT NULL,
  solution           TEXT,
  note               TEXT,
  example_testcases  TEXT,
  created_date       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  last_updated_date  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_dsa_user_id
  ON user_dsa (user_id);
