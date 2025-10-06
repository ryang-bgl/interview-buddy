--liquibase formatted sql

--changeset litdeck:001-init-users-submissions
--comment: Initial tables for users and submissions

CREATE TABLE users (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    leetcode_username VARCHAR(255) NULL,
    CONSTRAINT unique_leetcode_username UNIQUE (leetcode_username),
    CONSTRAINT pk_users_id PRIMARY KEY (id),
);

--rollback DROP TABLE IF EXISTS submissions;
--rollback DROP TABLE IF EXISTS users;