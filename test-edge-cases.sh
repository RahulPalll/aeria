#!/bin/bash

# Test Script for Edge Cases in Student Enrollment System
# This script demonstrates various edge case scenarios

echo "🧪 Testing Student Enrollment System Edge Cases"
echo "================================================="

BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test enrollment
test_enrollment() {
    local test_name="$1"
    local student_id="$2"
    local course_ids="$3"
    local expected_result="$4"
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    response=$(curl -s -X POST "$BASE_URL/enrollment" \
        -H "Content-Type: application/json" \
        -d "{\"studentId\": $student_id, \"courseIds\": [$course_ids]}")
    
    if [[ $response == *"error"* ]] || [[ $response == *"conflict"* ]] || [[ $response == *"exceeded"* ]]; then
        if [ "$expected_result" = "fail" ]; then
            echo -e "${GREEN}✅ PASS: Expected failure occurred${NC}"
        else
            echo -e "${RED}❌ FAIL: Unexpected error${NC}"
        fi
    else
        if [ "$expected_result" = "success" ]; then
            echo -e "${GREEN}✅ PASS: Enrollment successful${NC}"
        else
            echo -e "${RED}❌ FAIL: Expected failure but succeeded${NC}"
        fi
    fi
    
    echo "Response: $response"
    echo "---"
}

# Function to test validation
test_validation() {
    local test_name="$1"
    local student_id="$2"
    local course_ids="$3"
    
    echo -e "${YELLOW}Validating: $test_name${NC}"
    
    response=$(curl -s -X POST "$BASE_URL/validation/enrollment-check" \
        -H "Content-Type: application/json" \
        -d "{\"studentId\": $student_id, \"courseIds\": [$course_ids]}")
    
    echo "Validation Response: $response"
    echo "---"
}

echo "Starting Edge Case Tests..."
echo ""

# Test 1: Overnight Class Conflict
echo "🌙 Test 1: Overnight Class Conflicts"
test_validation "Overnight lab session" 1 "13"
test_enrollment "Enroll in overnight class" 1 "13" "success"

# Test 2: Buffer Time Violation
echo "⏰ Test 2: Buffer Time Violation"
test_validation "Back-to-back classes" 1 "15,16"
test_enrollment "No buffer time between classes" 1 "15,16" "fail"

# Test 3: Daily Hours Limit
echo "📚 Test 3: Daily Study Hours Limit"
test_validation "Marathon classes" 1 "17"
test_enrollment "Exceed daily hour limit" 1 "17" "fail"

# Test 4: Prerequisites Missing
echo "📋 Test 4: Prerequisites Validation"
test_validation "Course requiring prerequisites" 2 "16"
test_enrollment "Missing prerequisites" 2 "16" "fail"

# Test 5: Basic Enrollment (Should Work)
echo "✅ Test 5: Normal Enrollment"
test_validation "Normal course enrollment" 1 "1,3"
test_enrollment "Regular courses without conflicts" 1 "1,3" "success"

# Test 6: Cross-Day Overnight Conflict
echo "🌅 Test 6: Cross-Day Overnight Conflicts"
test_validation "Overnight extending to next day" 1 "13,18"
test_enrollment "Friday overnight + Saturday morning" 1 "13,18" "fail"

echo ""
echo "🎯 Edge Case Testing Complete!"
echo "================================================="
echo "To run these tests:"
echo "1. Start the server: npm run start:dev"
echo "2. Run this script: chmod +x test-edge-cases.sh && ./test-edge-cases.sh"
echo ""
echo "Check the server logs for detailed validation messages."
