--liquibase formatted sql
--changeset rui:001

-- Ensure utf8mb4 and InnoDB
CREATE TABLE IF NOT EXISTS `user` (
  id                 CHAR(36)        NOT NULL DEFAULT (UUID()),
  email              VARCHAR(255),
  first_name         VARCHAR(100),
  last_name          VARCHAR(100),
  created_date       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated_date  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  leetstack_username VARCHAR(255),
  CONSTRAINT pk_user PRIMARY KEY (id),
  CONSTRAINT uq_user_leetstack_username UNIQUE (leetstack_username)
  ) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_dsa (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id            CHAR(36)        NOT NULL,
  title              TEXT            NOT NULL,
  title_slug         VARCHAR(255)    NOT NULL,
  difficulty         VARCHAR(50)     NOT NULL,
  is_paid_only       BOOLEAN      NOT NULL DEFAULT FALSE,  -- boolean-ish
  description        LONGTEXT        NOT NULL,            -- if descriptions can be large
  solution           LONGTEXT,
  note               LONGTEXT,
  example_testcases  LONGTEXT,
  created_date       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated_date  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_dsa PRIMARY KEY (id),
  CONSTRAINT fk_user_dsa_user FOREIGN KEY (user_id) REFERENCES `user` (id),
  CONSTRAINT uq_user_dsa_user_slug UNIQUE (user_id, title_slug)
  ) ENGINE=InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX idx_user_dsa_user_id ON user_dsa (user_id);
CREATE INDEX idx_user_dsa_title_slug ON user_dsa (title_slug);
