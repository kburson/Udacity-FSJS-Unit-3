
-- docker compose will start the container and alias the default user to ${POSTGRES_USER}
-- and create the default database ${POSTGRES_DB}

-- So, all we need to do is grant privs to our default user
\echo
\echo ## GRANTING privs to public SCHEMA for shopping user
GRANT ALL ON SCHEMA public TO shopping_user;

\echo
\echo ## GRANTING privs to shopping DATABASE for shopping user
GRANT ALL PRIVILEGES ON DATABASE shopping TO shopping_user;


-- # create the shopping_test database and grant privs to new user
\echo
\echo ## CREATE DATABASE shopping_test to be used for unit testing.
CREATE DATABASE shopping_test;

\echo
\echo ## GRANTING privs to shopping DATABASE for shopping user
GRANT ALL PRIVILEGES ON DATABASE shopping_test TO shopping_user;