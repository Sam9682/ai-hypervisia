#!/bin/bash
# Database backup script for ai-hypervisia

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="hypervisia_db_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
docker exec ai-hypervisia-postgres-${USER_ID:-0} pg_dump -U hypervisia_user hypervisia_db > "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "Backup completed: ${BACKUP_DIR}/${BACKUP_FILE}"
    gzip "${BACKUP_DIR}/${BACKUP_FILE}"
    echo "Compressed: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
else
    echo "Backup failed!"
    exit 1
fi
