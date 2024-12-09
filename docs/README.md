## setup environment

copy the following into a file names `.env` at the root of the project.
You can modify any of the settings that you like, but make sure the database connections are aligned with you local db connection setup.

**.env**

```sh
# when using docker compose this will name the application stack
COMPOSE_PROJECT_NAME=udacity-fsjs

# default runtime environment
POSTGRES_DEFAULT_ENV=dev

# dev environment settings
POSTGRES_DB=shopping
# test environment settings
POSTGRES_TEST_DB=shopping_test

# Database connection
POSTGRES_HOST=127.0.0.1
POSTGRES_USER=shopping_user
POSTGRES_PORT=5432

# These should be passed to service using Kubernetes secrets or some other secure config
POSTGRES_PASSWORD=password123
SALT_ROUNDS=10
BCRYPT_PASSWORD=Trump-landslide-victory!
CRYPTO_PEPPER=YankeeDoodle
TOKEN_SECRET=GodIsSovereign!
```
