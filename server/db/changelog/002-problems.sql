--liquibase formatted sql

--changeset litdeck:002-problems
--comment: Problems table and related structures

CREATE TABLE problems (
    id INT NOT NULL,
    frontend_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_slug VARCHAR(255) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    is_paid_only BOOLEAN NOT NULL,
    content TEXT NOT NULL,
    topic_tags JSON,
    example_testcases TEXT,
    similar_questions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT problems_pkey PRIMARY KEY (id),
    CONSTRAINT problems_title_slug_key UNIQUE (title_slug)
);

CREATE TABLE topics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE problems_topic (
    problem_id INT NOT NULL,
    topic_slug VARCHAR(255) NOT NULL,
    PRIMARY KEY (problem_id, topic_slug),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (topic_slug) REFERENCES topics(slug) ON DELETE CASCADE
);

CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_frontend_id ON problems(frontend_id);
CREATE INDEX idx_problems_topic_problem_id ON problems_topic(problem_id);
CREATE INDEX idx_problems_topic_slug ON problems_topic(topic_slug);

--rollback DROP TABLE IF EXISTS problems_topic;
--rollback DROP TABLE IF EXISTS topics;
--rollback DROP TABLE IF EXISTS problems;