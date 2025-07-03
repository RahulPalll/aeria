#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Resetting Student Enrollment Database...${NC}"
echo ""

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    exit 1
fi

# Drop and recreate database
echo -e "${YELLOW}🗑️ Dropping existing database...${NC}"
dropdb student_enrollment 2>/dev/null || echo -e "${YELLOW}⚠️ Database did not exist${NC}"

echo -e "${YELLOW}🆕 Creating fresh database...${NC}"
if createdb student_enrollment; then
    echo -e "${GREEN}✅ Database created${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    exit 1
fi

# Load schema
echo -e "${YELLOW}📊 Loading database schema...${NC}"
if psql -d student_enrollment -f schema.sql > /dev/null; then
    echo -e "${GREEN}✅ Schema loaded${NC}"
else
    echo -e "${RED}❌ Failed to load schema${NC}"
    exit 1
fi

# Load sample data
echo -e "${YELLOW}📚 Loading sample data...${NC}"
if psql -d student_enrollment -f seed.sql > /dev/null; then
    echo -e "${GREEN}✅ Sample data loaded${NC}"
else
    echo -e "${RED}❌ Failed to load sample data${NC}"
    exit 1
fi

# Verify setup
echo -e "${YELLOW}🔍 Verifying database...${NC}"
TABLES=$(psql -d student_enrollment -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
COLLEGES=$(psql -d student_enrollment -t -c "SELECT COUNT(*) FROM colleges;" | xargs)

echo -e "${GREEN}✅ Database reset complete!${NC}"
echo -e "${GREEN}   Tables: $TABLES${NC}"
echo -e "${GREEN}   Sample colleges: $COLLEGES${NC}"
echo ""
echo -e "${BLUE}Ready to start the application with fresh data! 🚀${NC}"
