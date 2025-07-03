#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Student Course Enrollment System - Setup${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Check if PostgreSQL is installed
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed${NC}"
    echo -e "${YELLOW}Please install PostgreSQL first:${NC}"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Node.js/npm is not installed${NC}"
    echo -e "${YELLOW}Please install Node.js first:${NC}"
    echo "  Visit: https://nodejs.org/en/download/"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi
echo ""

# Setup database
echo -e "${YELLOW}🗄️ Setting up database...${NC}"

# Create database (suppress error if already exists)
if createdb student_enrollment 2>/dev/null; then
    echo -e "${GREEN}✅ Created database 'student_enrollment'${NC}"
else
    echo -e "${YELLOW}⚠️ Database 'student_enrollment' already exists${NC}"
fi

# Load schema
echo -e "${YELLOW}📊 Loading database schema...${NC}"
if psql -d student_enrollment -f schema.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database schema loaded${NC}"
else
    echo -e "${RED}❌ Failed to load schema${NC}"
    echo -e "${YELLOW}This might be due to existing tables. Continuing...${NC}"
fi

# Load sample data
echo -e "${YELLOW}📚 Loading sample data...${NC}"
if psql -d student_enrollment -f seed.sql > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Sample data loaded${NC}"
else
    echo -e "${YELLOW}⚠️ Sample data loading had issues (might already exist)${NC}"
fi
echo ""

# Setup environment file
echo -e "${YELLOW}⚙️ Setting up environment configuration...${NC}"
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${GREEN}✅ Created .env file from example${NC}"
        echo -e "${YELLOW}💡 You can modify .env for custom database settings${NC}"
    else
        echo -e "${YELLOW}⚠️ env.example not found, creating basic .env${NC}"
        cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=student_enrollment
DB_USER=postgres
DB_PASSWORD=
PORT=3000
EOF
        echo -e "${GREEN}✅ Created basic .env file${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Verify database setup
echo -e "${YELLOW}🔍 Verifying database setup...${NC}"
DB_CHECK=$(psql -d student_enrollment -t -c "SELECT COUNT(*) FROM colleges;" 2>/dev/null | xargs)
if [ "$DB_CHECK" -gt "0" ]; then
    echo -e "${GREEN}✅ Database verification successful${NC}"
    echo -e "${GREEN}   Found $DB_CHECK colleges in database${NC}"
else
    echo -e "${RED}❌ Database verification failed${NC}"
    echo -e "${YELLOW}   You may need to check your PostgreSQL configuration${NC}"
fi
echo ""

# Final instructions
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}🚀 To start the application:${NC}"
echo -e "${YELLOW}   npm run start:dev${NC}"
echo ""
echo -e "${BLUE}📡 Then visit:${NC}"
echo -e "${YELLOW}   API: http://localhost:3000${NC}"
echo -e "${YELLOW}   API Documentation: http://localhost:3000/api${NC}"
echo ""
echo -e "${BLUE}🧪 Test the system:${NC}"
echo -e "${YELLOW}   curl http://localhost:3000/enrollment/student/1${NC}"
echo ""
echo -e "${BLUE}🗄️ Database utilities:${NC}"
echo -e "${YELLOW}   npm run db:reset   # Reset database${NC}"
echo -e "${YELLOW}   npm run db:setup   # Setup database only${NC}"
echo ""
echo -e "${GREEN}Assignment implementation ready! 🎓${NC}" 