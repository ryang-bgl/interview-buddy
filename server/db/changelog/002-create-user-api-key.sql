--liquibase formatted sql
--changeset ryang:002

CREATE TABLE user_api_key
(
  id                BIGINT       NOT NULL AUTO_INCREMENT,
  user_id           CHAR(36)     NOT NULL,
  key_hash          VARCHAR(255) NOT NULL,
  label             VARCHAR(100)     NULL,
  revoked           BOOLEAN      NOT NULL DEFAULT FALSE,
  created_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_date    TIMESTAMP NULL,
  CONSTRAINT pk_user_api_key_id PRIMARY KEY (id),
  CONSTRAINT fk_user_api_key_user_id FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT uq_user_api_key_hash UNIQUE (key_hash)
);

CREATE INDEX idx_user_api_key_user_id
  ON user_api_key (user_id);

