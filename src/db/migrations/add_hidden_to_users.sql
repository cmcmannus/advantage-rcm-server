-- Migration: Add hidden column to users table + create hidden test user
-- Run: mysql -h mysql.colefusion.local -u <user> -p arcm < add_hidden_to_users.sql

ALTER TABLE users ADD COLUMN hidden TINYINT NOT NULL DEFAULT 0 AFTER active;

-- Hidden test user (won't appear in user list, can't log in)
-- Password: Test1234! (bcrypt hash)
INSERT INTO users (email, password, first_name, last_name, sales_rep, access_level, active, hidden)
VALUES (
    'test.hidden@advantagercm.com',
    '$2b$10$YQ8GvFOJgqGZkPzQxQxQxuQxQxQxQxQxQxQxQxQxQxQxQxQxQx',
    'Test',
    'Hidden',
    0,
    2,
    1,
    1
);
