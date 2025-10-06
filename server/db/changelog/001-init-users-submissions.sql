--liquibase formatted sql

--changeset litdeck:001-init-users-submissions
--comment: Initial tables for users and submissions

CREATE TABLE users (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    leetcode_username VARCHAR(255) NULL,
    CONSTRAINT unique_leetcode_username UNIQUE (leetcode_username),
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_username_key UNIQUE (username)
);

CREATE TABLE submissions (
    id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_slug VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id CHAR(36) NOT NULL,
    CONSTRAINT submissions_pkey PRIMARY KEY (id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_submissions_user_time ON submissions(user_id, submitted_at);

--rollback DROP TABLE IF EXISTS submissions;
--rollback DROP TABLE IF EXISTS users;