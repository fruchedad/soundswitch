#!/bin/bash

# Package SoundSwitch Extension for Chrome Web Store Submission
set -e

echo "📦 Packaging SoundSwitch for Chrome Web Store..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ${NC}  $1"
}

print_success() {
    echo -e "${GREEN}✓${NC}  $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

print_error() {
    echo -e "${RED}✗${NC}  $1"
}

# Verify we're in the right directory
if [ ! -f "manifest.json" ]; then
    print_error "manifest.json not found. Please run this script from the extension root directory."
    exit 1
fi

# Clean and build the extension
print_status "Building extension..."
npm run build

if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found"
    exit 1
fi

print_success "Build completed successfully"

# Create store-package directory
PACKAGE_DIR="store-package"
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# Verify all required files are present in dist
print_status "Verifying required files..."

REQUIRED_FILES=(
    "manifest.json"
    "background.js"
    "content.js"
    "content.css"
    "popup.html"
    "popup.js"
    "popup.css"
    "icons/icon16.png"
    "icons/icon32.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "dist/$file" ]; then
        print_error "Required file missing: dist/$file"
        exit 1
    fi
    print_success "Found: $file"
done

# Create the submission package
print_status "Creating submission package..."

# Copy all files from dist to store-package
cp -r dist/* "$PACKAGE_DIR/"

# Verify package contents
print_status "Verifying package contents..."
cd "$PACKAGE_DIR"

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Package verification failed: $file missing"
        exit 1
    fi
done

print_success "Package verification passed"

# Create the zip file
cd ..
ZIP_NAME="soundswitch-v$(grep '"version"' manifest.json | cut -d'"' -f4).zip"
print_status "Creating zip file: $ZIP_NAME"

cd "$PACKAGE_DIR"
zip -r "../$ZIP_NAME" . -x "*.DS_Store*" "*.git*"
cd ..

# Verify zip file
print_status "Verifying zip file..."
if [ ! -f "$ZIP_NAME" ]; then
    print_error "Zip file creation failed"
    exit 1
fi

ZIP_SIZE=$(stat -c%s "$ZIP_NAME" 2>/dev/null || stat -f%z "$ZIP_NAME")
print_success "Zip file created: $ZIP_NAME (${ZIP_SIZE} bytes)"

# Test the zip by extracting to a temp directory
TEST_DIR="temp-test-extract"
rm -rf "$TEST_DIR"
mkdir "$TEST_DIR"
cd "$TEST_DIR"
unzip -q "../$ZIP_NAME"

# Verify extracted contents
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Zip verification failed: $file missing after extraction"
        cd ..
        rm -rf "$TEST_DIR"
        exit 1
    fi
done

cd ..
rm -rf "$TEST_DIR"
print_success "Zip file verification passed"

# Final submission checklist
echo ""
echo "🎉 ${GREEN}Package created successfully!${NC}"
echo ""
echo "📋 ${BLUE}Submission Checklist:${NC}"
echo "   ✓ Extension built and packaged"
echo "   ✓ All required files present"
echo "   ✓ Zip file created and verified"
echo "   ✓ Ready for Chrome Web Store upload"
echo ""
echo "📦 ${YELLOW}Package Details:${NC}"
echo "   File: $ZIP_NAME"
echo "   Size: ${ZIP_SIZE} bytes"
echo "   Contents: $(unzip -l "$ZIP_NAME" | wc -l | tr -d ' ') files"
echo ""
echo "🚀 ${BLUE}Next Steps:${NC}"
echo "   1. Upload $ZIP_NAME to Chrome Web Store Developer Dashboard"
echo "   2. Complete store listing with information from store-assets/"
echo "   3. Add screenshots and promotional images"
echo "   4. Submit for review"
echo ""
echo "📚 ${BLUE}Documentation:${NC}"
echo "   Store Listing: store-assets/store-listing.md"
echo "   Privacy Policy: store-assets/privacy-policy.md"
echo "   Submission Guide: store-assets/submission-checklist.md"
echo ""

# Check package size (Chrome Web Store has a 128MB limit)
MAX_SIZE=$((128 * 1024 * 1024))  # 128MB in bytes
if [ "$ZIP_SIZE" -gt "$MAX_SIZE" ]; then
    print_warning "Package size (${ZIP_SIZE} bytes) is large. Chrome Web Store limit is 128MB."
else
    print_success "Package size is within Chrome Web Store limits"
fi

# Clean up temporary directory
rm -rf "$PACKAGE_DIR"

print_success "Packaging complete! 🎉"