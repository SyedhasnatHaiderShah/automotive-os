#!/bin/bash
set -e

# ==============================================================================
# Automotive OS — Sovereign Database Initialization Hook
# Creates dedicated runtime application role with NOSUPERUSER and NOBYPASSRLS
# ==============================================================================

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS app;

    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'automotive_app_user') THEN
        CREATE ROLE automotive_app_user WITH LOGIN PASSWORD '${APP_DB_PASSWORD:-app_secure_dev_password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
      ELSE
        ALTER ROLE automotive_app_user WITH PASSWORD '${APP_DB_PASSWORD:-app_secure_dev_password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
      END IF;
    END \$\$;

    GRANT USAGE ON SCHEMA public TO automotive_app_user;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO automotive_app_user;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO automotive_app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO automotive_app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO automotive_app_user;

    GRANT USAGE ON SCHEMA app TO automotive_app_user;
    ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT EXECUTE ON ROUTINES TO automotive_app_user;
EOSQL
