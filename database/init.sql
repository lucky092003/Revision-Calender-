-- Revision Calendar - PostgreSQL database bootstrap
-- Create the application database (run as a superuser, e.g. postgres):
--
--   psql -U postgres -f database/init.sql
--
-- Tables are created automatically by the backend on startup
-- (see app/core/database.py -> init_db), so this script only creates
-- the database itself. For production, use Alembic migrations instead
-- of create_all.

CREATE DATABASE revision_calendar
    WITH OWNER = postgres
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;