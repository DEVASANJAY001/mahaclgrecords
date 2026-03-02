-- Alter students table to make password_hash optional
ALTER TABLE students 
ALTER COLUMN password_hash DROP NOT NULL;
