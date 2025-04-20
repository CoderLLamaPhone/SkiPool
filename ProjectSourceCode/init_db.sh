PG_URI="postgresql://skipool_db_user:8JIZLRnWhmG4Prha2RNekFiW4GcBKTZm@dpg-d000qo2li9vc739eh0dg-a.oregon-postgres.render.com/skipool_db"
# Execute each .sql file in the directory
for file in src/init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done