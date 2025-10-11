--liquibase formatted sql
--changeset rui:001

-- init db

CREATE TABLE users
(
  id                CHAR(36) NOT NULL DEFAULT (UUID()),
  email             VARCHAR(255),
  first_name        VARCHAR(100),
  last_name         VARCHAR(100),
  created_date      TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
  last_updated_date TIMESTAMP         DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  leetcode_username VARCHAR(255) NULL,
  CONSTRAINT unique_leetcode_username UNIQUE (leetcode_username),
  CONSTRAINT pk_users_id PRIMARY KEY (id),
);


CREATE TABLE user_dsa
(
  id                BIGINT(20) NOT NULL AUTO_INCREMENT,
  user_id           INT          NOT NULL,
  title             VARCHAR(255) NOT NULL,
  title_slug        VARCHAR(255) NOT NULL,
  difficulty        VARCHAR(50)  NOT NULL,
  is_paid_only      BOOLEAN      NOT NULL,
  description       TEXT         NOT NULL,
  solution          TEXT      DEFAULT NULL,
  note              TEXT      DEFAULT NULL,
  example_testcases TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY id,
  CONSTRAINT `FK_USER_ID` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
);