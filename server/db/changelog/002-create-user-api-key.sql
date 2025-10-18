--liquibase formatted sql
--changeset ryang:002

CREATE TABLE IF NOT EXISTS user_api_key
(
  id             BIGINT(20) PRIMARY KEY AUTO_INCREMENT,
  user_id        CHAR(36)        NOT NULL,
  key_hash       VARCHAR(200)        NOT NULL,
  label          TEXT,
  revoked        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_date   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  last_used_date TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES `user` (id) ON DELETE CASCADE,
  CONSTRAINT uq_user_api_key_hash UNIQUE (key_hash)
);

CREATE INDEX idx_user_api_key_user_id
  ON user_api_key (user_id);