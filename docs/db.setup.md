# setting up the first database

connecting to DB running on docker:

> POSTGRES_USER=magical_user
> POSTGRES_PASSWORD=password123
> POSTGRES_DB=fantasy_worlds

`psql -d ${POSTGRES_DB} -h ${POSTGRES_HOST} -U ${POSTGRES_USER}`

list of db: `\l`
list of tables in connected db: `\d`
schema (info) for a table: `\d ${table_name}` :: `\d books`

## using DB Migrate

This is similar to LiquiBase for Java.

**Setup the migration table**
`npx db-migrate create mythical-worlds-table --sql-file`
`npx db-migrate create users-table --sql-file`
`npx db-migrate create articles-table --sql-file`

add SQl to the up and down files to manage the structure described in the name.

-- `ENV=test npx db-migrate up -e test`
-- `ENV=test npx db-migrate up 20241112165244-articles-table -e test`

-- `ENV=test npx db-migrate down -e test `
-- `ENV=test npx db-migrate down -c 4 -e test `

-- `ENV=test npx db-migrate reset -e test `

## using psql

```sql
CREATE DATABASE fsjs_unit_3;
```

```sql
CREATE TABLE plants (id SERIAL PRIMARY KEY, name VARCHAR(100), individuals INTEGER, sighting_date DATE, description TEXT);
```

```sql
ALTER TABLE plants
ADD COLUMN id SERIAL PRIMARY KEY;
```
