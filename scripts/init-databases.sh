#!/bin/bash
set -e

for db in novabuild_account_db project_service novabuild_intelligent_db; do
  psql -v ON_ERROR_STOP=1 \
    --username "$POSTGRES_USER" \
    --dbname postgres \
    --set=db_name="$db" \
    --command='SELECT format('\''CREATE DATABASE %I'\'', :'db_name') WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name')\gexec'
done
