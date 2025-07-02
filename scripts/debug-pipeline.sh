#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# ─── CONFIG ────────────────────────────────────────────────────────────────────
# Figma API (optional) for icon export
FIGMA_TOKEN="${FIGMA_TOKEN:-}"           # Your personal access token
FIGMA_FILE_ID="YOUR_FIGMA_FILE_KEY"      # Figma file key
FIGMA_ICON_NODE_ID="SOUNDSWITCH_ICONS"   # Node ID or Page name in Figma

# Local SVG source fallback
ICON_SRC_DIR="assets/icon-sources"       # directory with .svg masters
ICON_OUT_DIR="icons"                     # output directory

# SonarQube
SONAR_PROJECT_KEY="SoundSwitch"
SONAR_HOST_URL="${SONAR_HOST_URL:-http://localhost:9000}"
SONAR_LOGIN="${SONAR_LOGIN:-}"           # your Sonar token

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── UTILITY FUNCTIONS ─────────────────────────────────────────────────────────
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed or not in PATH"
        return 1
    fi
}

# ─── STEP 1: ICON GENERATION ─────────────────────────────────────────────────
generate_icons() {
    log_info "Generating icons..."
    mkdir -p "${ICON_OUT_DIR}"

    if [[ -n "${FIGMA_TOKEN}" ]]; then
        if check_command "figma-export"; then
            # Export from Figma as SVG + PNG at multiple scales
            figma-export export \
                --token "${FIGMA_TOKEN}" \
                --file "${FIGMA_FILE_ID}" \
                --ids "${FIGMA_ICON_NODE_ID}" \
                --format svg,png \
                --output "${ICON_OUT_DIR}"
            log_success "Icons exported from Figma"
        else
            log_warning "figma-export not found, skipping Figma export"
        fi
    else
        log_warning "FIGMA_TOKEN not set, using fallback method"
    fi

    # Fallback: batch-convert all SVGs with Inkscape into multi-density PNG
    if [[ -d "${ICON_SRC_DIR}" ]] && check_command "inkscape"; then
        for svg in "${ICON_SRC_DIR}"/*.svg; do
            if [[ -f "$svg" ]]; then
                name=$(basename "${svg%.*}")
                for size in 16 32 48 64 128 256; do
                    inkscape "${svg}" \
                        --export-filename="${ICON_OUT_DIR}/icon-${size}.png" \
                        --export-width="${size}" --export-height="${size}"
                done
                log_success "Generated icons for ${name}"
            fi
        done
    else
        log_warning "Inkscape not found or icon source directory missing"
    fi
}

# ─── STEP 2: STATIC ANALYSIS ──────────────────────────────────────────────────
run_static_analysis() {
    log_info "Running static analysis..."
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci
    fi

    # Linting
    log_info "Running linters..."
    if npm run lint:check; then
        log_success "Linting passed"
    else
        log_error "Linting failed"
        return 1
    fi

    # Type checking
    log_info "Running type check..."
    if npm run type-check; then
        log_success "Type checking passed"
    else
        log_error "Type checking failed"
        return 1
    fi

    # SonarQube scan
    if check_command "sonar-scanner"; then
        log_info "Running SonarQube analysis..."
        sonar-scanner \
            -Dsonar.projectKey="${SONAR_PROJECT_KEY}" \
            -Dsonar.sources=. \
            -Dsonar.host.url="${SONAR_HOST_URL}" \
            -Dsonar.login="${SONAR_LOGIN}" \
            -Dsonar.exclusions="node_modules/**,dist/**,coverage/**,docs/**,icons/**"
        log_success "SonarQube analysis complete"
    else
        log_warning "sonar-scanner not found, skipping SonarQube"
    fi
}

# ─── STEP 3: UNIT & INTEGRATION TESTS ─────────────────────────────────────────
run_tests() {
    log_info "Running unit tests with coverage..."
    if npm run coverage; then
        log_success "Unit tests passed"
    else
        log_error "Unit tests failed"
        return 1
    fi

    log_info "Running integration tests..."
    if npm run test:integration; then
        log_success "Integration tests passed"
    else
        log_warning "Integration tests failed or not configured"
    fi
}

# ─── STEP 4: END-TO-END TESTS ───────────────────────────────────────────────────
run_e2e_tests() {
    log_info "Running end-to-end (E2E) tests..."
    if check_command "npx"; then
        if npx playwright test; then
            log_success "E2E tests passed"
        else
            log_warning "E2E tests failed or not configured"
        fi
    else
        log_warning "npx not available, skipping E2E tests"
    fi
}

# ─── STEP 5: BUILD & SMOKE ─────────────────────────────────────────────────────
build_and_smoke() {
    log_info "Building project..."
    if npm run build; then
        log_success "Build completed"
    else
        log_error "Build failed"
        return 1
    fi

    log_info "Performing smoke tests..."
    if [[ -f "scripts/smoke-test.js" ]]; then
        if node scripts/smoke-test.js; then
            log_success "Smoke tests passed"
        else
            log_error "Smoke tests failed"
            return 1
        fi
    else
        log_warning "Smoke test script not found, skipping"
    fi
}

# ─── STEP 6: REPORT & EXIT ─────────────────────────────────────────────────────
generate_reports() {
    log_info "Generating coverage report..."
    if npm run coverage:report; then
        log_success "Coverage report generated"
    else
        log_warning "Coverage report generation failed"
    fi
}

# ─── MAIN EXECUTION ───────────────────────────────────────────────────────────
main() {
    log_info "🚀 Starting SoundSwitch debug pipeline..."
    
    # Check prerequisites
    check_command "npm" || exit 1
    check_command "node" || exit 1

    # Run pipeline steps
    generate_icons
    run_static_analysis || exit 1
    run_tests || exit 1
    run_e2e_tests
    build_and_smoke || exit 1
    generate_reports

    log_success "🎉 Debug pipeline completed successfully!"
}

# Run main function
main "$@" 