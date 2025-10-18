--liquibase formatted sql
--changeset ryang:002

CREATE TABLE IF NOT EXISTS user_api_key
(
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        TEXT        NOT NULL,
  key_hash       TEXT        NOT NULL,
  label          TEXT,
  revoked        INTEGER     NOT NULL DEFAULT 0,
  created_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  last_used_date TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE,
  CONSTRAINT uq_user_api_key_hash UNIQUE (key_hash)
);

CREATE INDEX IF NOT EXISTS idx_user_api_key_user_id
  ON user_api_key (user_id);
