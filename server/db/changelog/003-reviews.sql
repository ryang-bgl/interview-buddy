--liquibase formatted sql

--changeset litdeck:003-reviews
--comment: Review schedules and related tables

CREATE TABLE review_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    problem_id INT NOT NULL,
    due_date TIMESTAMP NOT NULL,
    stability FLOAT NOT NULL DEFAULT 0,
    difficulty FLOAT NOT NULL DEFAULT 0,
    elapsed_days INT NOT NULL DEFAULT 0,
    scheduled_days INT NOT NULL DEFAULT 0,
    reps INT NOT NULL DEFAULT 0,
    lapses INT NOT NULL DEFAULT 0,
    state VARCHAR(50) NOT NULL DEFAULT 'new',
    last_review TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_problem UNIQUE (user_id, problem_id)
);

CREATE TABLE review_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    problem_id INT NOT NULL,
    rating INT NOT NULL,
    state VARCHAR(50) NOT NULL,
    due_date TIMESTAMP NOT NULL,
    stability FLOAT NOT NULL,
    difficulty FLOAT NOT NULL,
    elapsed_days INT NOT NULL,
    last_elapsed_days INT NOT NULL,
    scheduled_days INT NOT NULL,
    review_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_log_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_review_log_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE INDEX idx_review_schedules_user_id ON review_schedules(user_id);
CREATE INDEX idx_review_schedules_due_date ON review_schedules(due_date);
CREATE INDEX idx_review_schedules_user_due ON review_schedules(user_id, due_date);
CREATE INDEX idx_review_logs_user_id ON review_logs(user_id);
CREATE INDEX idx_review_logs_problem_id ON review_logs(problem_id);
CREATE INDEX idx_review_logs_review_date ON review_logs(review_date);

--rollback DROP TABLE IF EXISTS review_logs;
--rollback DROP TABLE IF EXISTS review_schedules;