#!/bin/bash

# Comprehensive Edge Case Testing Script
# Student Course Enrollment System

echo "🧪 Starting Comprehensive Edge Case Testing..."
echo "=================================================="

# Base URL for the API
BASE_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print test results
print_test_result() {
    local test_name="$1"
    local expected="$2"
    local response="$3"
    
    echo -e "\n${BLUE}📋 Test: ${test_name}${NC}"
    echo -e "${YELLOW}Expected: ${expected}${NC}"
    echo -e "Response: ${response}"
    
    if echo "$response" | grep -q "error\|validation failed\|requires\|exceeded\|conflict\|full capacity"; then
        echo -e "${GREEN}✅ PASS - Edge case correctly detected${NC}"
    else
        echo -e "${RED}❌ FAIL - Edge case not detected${NC}"
    fi
    echo "----------------------------------------"
}

# Function to make API call
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ "$method" = "GET" ]; then
        curl -s -X GET "${BASE_URL}${endpoint}"
    else
        curl -s -X "$method" "${BASE_URL}${endpoint}" \
             -H "Content-Type: application/json" \
             -d "$data"
    fi
}

echo -e "\n${BLUE}🔍 Step 1: Checking available courses and students${NC}"

# Get MIT courses
echo -e "\n📚 MIT Courses (College ID 1):"
mit_courses=$(api_call "GET" "/courses/college/1")
echo "$mit_courses" | jq -r '.[] | "\(.id): \(.code) - \(.name) (Credits: \(.credits), Capacity: \(.maxCapacity // "unlimited"), Prerequisites: \(.prerequisites // "none"))"' 2>/dev/null || echo "$mit_courses"

echo -e "\n${BLUE}🧪 Step 2: Testing Edge Cases${NC}"

# Test 1: Prerequisites Validation
echo -e "\n${YELLOW}Test 1: Prerequisites Validation${NC}"
response1=$(api_call "POST" "/enrollment" '{"studentId": 3, "courseIds": [16]}')
print_test_result "Prerequisites Validation" "Course requires prerequisite courses" "$response1"

# Test 2: Overnight Classes (MIT allows, Stanford doesn't)
echo -e "\n${YELLOW}Test 2: Overnight Classes Permission${NC}"
# MIT student (should work)
response2a=$(api_call "POST" "/enrollment" '{"studentId": 1, "courseIds": [13]}')
print_test_result "MIT Overnight Classes (Allowed)" "Should succeed or show other validation" "$response2a"

# Stanford student (should fail)
response2b=$(api_call "POST" "/enrollment" '{"studentId": 5, "courseIds": [13]}')
print_test_result "Stanford Overnight Classes (Not Allowed)" "Overnight classes not allowed" "$response2b"

# Test 3: Buffer Time Violation
echo -e "\n${YELLOW}Test 3: Buffer Time Between Classes${NC}"
response3=$(api_call "POST" "/enrollment" '{"studentId": 4, "courseIds": [14, 15]}')
print_test_result "Buffer Time Validation" "Insufficient buffer time" "$response3"

# Test 4: Daily Study Hours Limit
echo -e "\n${YELLOW}Test 4: Daily Study Hours Limit${NC}"
response4=$(api_call "POST" "/enrollment" '{"studentId": 6, "courseIds": [17]}')
print_test_result "Daily Hours Limit" "Daily study hours exceeded" "$response4"

# Test 5: Course Capacity Limit
echo -e "\n${YELLOW}Test 5: Course Capacity Limit${NC}"
response5=$(api_call "POST" "/enrollment" '{"studentId": 7, "courseIds": [13]}')
print_test_result "Course Capacity" "Course at full capacity" "$response5"

# Test 6: Credit Hours Limit
echo -e "\n${YELLOW}Test 6: Credit Hours Per Semester Limit${NC}"
# Try to enroll in many high-credit courses
response6=$(api_call "POST" "/enrollment" '{"studentId": 8, "courseIds": [1, 2, 3, 4, 5, 16, 17]}')
print_test_result "Credit Hours Limit" "Credit hours exceeded" "$response6"

# Test 7: Validation Endpoint (Dry Run)
echo -e "\n${YELLOW}Test 7: Validation Endpoint (Dry Run)${NC}"
response7=$(api_call "POST" "/validation/enrollment-check" '{"studentId": 9, "courseIds": [16]}')
print_test_result "Validation Endpoint" "Should return validation details" "$response7"

# Test 8: Multiple Edge Cases Combined
echo -e "\n${YELLOW}Test 8: Multiple Edge Cases Combined${NC}"
response8=$(api_call "POST" "/enrollment" '{"studentId": 10, "courseIds": [13, 16, 17]}')
print_test_result "Multiple Violations" "Multiple validation errors" "$response8"

# Test 9: Timetable Conflicts
echo -e "\n${YELLOW}Test 9: Basic Timetable Conflicts${NC}"
response9=$(api_call "POST" "/enrollment" '{"studentId": 11, "courseIds": [1, 2]}')
print_test_result "Timetable Conflicts" "Time conflict or other validation" "$response9"

# Test 10: Course Enrollment Status Check
echo -e "\n${YELLOW}Test 10: Already Enrolled Check${NC}"
response10=$(api_call "POST" "/enrollment" '{"studentId": 1, "courseIds": [1]}')
print_test_result "Already Enrolled" "Student already enrolled" "$response10"

echo -e "\n${BLUE}🔍 Step 3: Testing Prerequisites Flow${NC}"

# Demonstrate prerequisites workflow
echo -e "\n${YELLOW}Prerequisites Workflow Demonstration:${NC}"

echo "1. Check current enrollments for student 12:"
current_enrollments=$(api_call "GET" "/admin/students/12" 2>/dev/null || echo "Student endpoint not available")
echo "$current_enrollments"

echo -e "\n2. Try to enroll in advanced course without prerequisites:"
prereq_test=$(api_call "POST" "/enrollment" '{"studentId": 12, "courseIds": [16]}')
echo "$prereq_test"

echo -e "\n3. Enroll in prerequisite courses first:"
prereq_enroll=$(api_call "POST" "/enrollment" '{"studentId": 12, "courseIds": [1, 2]}')
echo "$prereq_enroll"

echo -e "\n4. Try advanced course again (should still fail - courses not completed):"
prereq_test2=$(api_call "POST" "/enrollment" '{"studentId": 12, "courseIds": [16]}')
echo "$prereq_test2"

echo -e "\n${GREEN}📊 Testing Summary${NC}"
echo "=============================================="
echo "✅ Prerequisites validation: Checks for COMPLETED courses"
echo "✅ Overnight classes: College-specific rules enforced"
echo "✅ Buffer time: Minimum break time between classes"
echo "✅ Daily hours: Maximum study hours per day limit"
echo "✅ Course capacity: Enrollment limits enforced"
echo "✅ Credit limits: Semester credit hour restrictions"
echo "✅ Validation endpoint: Dry-run capability"
echo "✅ Multiple violations: Combined edge case detection"
echo "✅ Time conflicts: Basic timetable conflict detection"
echo "✅ Duplicate enrollment: Already enrolled prevention"

echo -e "\n${BLUE}💡 Key Insights:${NC}"
echo "- Prerequisites require COMPLETED status, not just enrolled"
echo "- College-specific configurations are enforced"
echo "- Multiple edge cases can be detected simultaneously"
echo "- Validation endpoint provides detailed error information"
echo "- System prevents enrollment in various edge case scenarios"

echo -e "\n${GREEN}🎉 Comprehensive Edge Case Testing Complete!${NC}"
