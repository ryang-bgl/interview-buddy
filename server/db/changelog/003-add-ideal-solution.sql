--liquibase formatted sql
--changeset codex:003

ALTER TABLE user_dsa
    ADD COLUMN ideal_solution_code LONGTEXT NULL;
