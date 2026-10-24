import { Client } from 'pg';

/**
 * Initializes dedicated runtime application role 'automotive_app_user' with NOSUPERUSER NOBYPASSRLS.
 * Executes using superuser/migration connection (MIGRATION_DATABASE_URL or DIRECT_URL).
 */
async function initAppRole() {
  const superuserUrl = process.env.MIGRATION_DATABASE_URL || process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!superuserUrl) {
    console.error('❌ [SECURITY_FATAL] Superuser/migration database connection URL is required.');
    process.exit(1);
  }

  const appPassword = process.env.APP_DB_PASSWORD || process.env.AUTOMOTIVE_APP_PASSWORD;
  if (!appPassword && (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production')) {
    console.error('❌ [SECURITY_FATAL] APP_DB_PASSWORD must be explicitly provided in staging/production.');
    process.exit(1);
  }

  const passwordToSet = appPassword || 'app_secure_dev_password';

  const client = new Client({ connectionString: superuserUrl });
  try {
    await client.connect();
    console.log('[RoleInit] Connected to database with migration credentials.');

    // 1. Create or alter automotive_app_user with strict security constraints
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS app;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'automotive_app_user') THEN
          CREATE ROLE automotive_app_user WITH LOGIN PASSWORD '${passwordToSet.replace(/'/g, "''")}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
        ELSE
          ALTER ROLE automotive_app_user WITH PASSWORD '${passwordToSet.replace(/'/g, "''")}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
        END IF;
      END $$;

      GRANT USAGE ON SCHEMA public TO automotive_app_user;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO automotive_app_user;
      GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO automotive_app_user;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO automotive_app_user;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO automotive_app_user;

      GRANT USAGE ON SCHEMA app TO automotive_app_user;
      ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT EXECUTE ON ROUTINES TO automotive_app_user;
    `);

    // 2. Verify role attributes
    const res = await client.query(`
      SELECT rolname, rolsuper, rolbypassrls, rolcanlogin
      FROM pg_roles
      WHERE rolname = 'automotive_app_user';
    `);

    if (res.rows.length === 0) {
      throw new Error('Verification failed: automotive_app_user role was not created.');
    }

    const role = res.rows[0];
    if (role.rolsuper || role.rolbypassrls || !role.rolcanlogin) {
      throw new Error(`Security violation on automotive_app_user: rolsuper=${role.rolsuper}, rolbypassrls=${role.rolbypassrls}, rolcanlogin=${role.rolcanlogin}`);
    }

    console.log('✅ automotive_app_user verified: LOGIN=true, SUPERUSER=false, BYPASSRLS=false');
  } catch (err: any) {
    console.error('❌ Role initialization failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initAppRole();
