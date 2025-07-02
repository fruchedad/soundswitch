# SoundSwitch Debug Pipeline

A comprehensive development and testing pipeline for the SoundSwitch Chrome extension.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the full debug pipeline
npm run debug:pipeline

# Or run the script directly
./scripts/debug-pipeline.sh
```

## 📋 Pipeline Steps

### 1. Icon Generation
- **Figma Export**: Automatically exports icons from Figma (if `FIGMA_TOKEN` is set)
- **Inkscape Fallback**: Converts SVG sources to multi-density PNG icons
- **Output**: Icons saved to `icons/` directory

### 2. Static Analysis
- **ESLint**: JavaScript/TypeScript linting with strict rules
- **Stylelint**: CSS linting and formatting
- **TypeScript**: Type checking and validation
- **SonarQube**: Code quality analysis (optional)

### 3. Unit & Integration Tests
- **Vitest**: Fast unit testing with coverage
- **Integration Tests**: Component and service integration testing
- **Coverage Reports**: HTML and JSON coverage reports

### 4. End-to-End Tests
- **Playwright**: Cross-browser E2E testing
- **Headless Mode**: Automated browser testing
- **Screenshots**: Failure screenshots for debugging

### 5. Build & Smoke Tests
- **Vite Build**: Production-ready extension build
- **Smoke Tests**: Basic functionality validation
- **Manifest Validation**: Extension manifest verification

### 6. Reports
- **Coverage Reports**: Test coverage analysis
- **Build Artifacts**: Validated extension files

## 🔧 Configuration

### Environment Variables

```bash
# Figma API (optional)
export FIGMA_TOKEN="your_figma_token"
export FIGMA_FILE_ID="your_file_key"
export FIGMA_ICON_NODE_ID="SOUNDSWITCH_ICONS"

# SonarQube (optional)
export SONAR_HOST_URL="http://localhost:9000"
export SONAR_LOGIN="your_sonar_token"
```

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Inkscape** (for icon generation fallback)
- **SonarQube Scanner** (optional, for code quality analysis)

## 📁 Project Structure

```
soundswitch/
├── scripts/
│   ├── debug-pipeline.sh    # Main pipeline script
│   └── smoke-test.js        # Build validation
├── test/
│   ├── setup.ts             # Test setup
│   ├── background.test.ts   # Unit tests
│   ├── integration/
│   │   └── setup.ts         # Integration test setup
│   └── e2e/
│       └── basic.test.ts    # E2E tests
├── assets/
│   └── icon-sources/        # SVG icon sources
├── icons/                   # Generated icons
├── dist/                    # Built extension
└── coverage/                # Test coverage reports
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview built extension

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode tests
npm run test:integration # Integration tests
npm run test:e2e         # E2E tests
npm run coverage         # Generate coverage report

# Code Quality
npm run lint             # Run linters with auto-fix
npm run lint:check       # Check linting without fixing
npm run type-check       # TypeScript type checking
npm run format           # Format code with Prettier

# Pipeline
npm run debug:pipeline   # Run full debug pipeline
```

## 🎯 Best Practices

### Code Quality
- All code must pass ESLint and Stylelint
- TypeScript strict mode enabled
- Consistent code formatting with Prettier
- Import ordering and organization

### Testing
- Unit tests for all business logic
- Integration tests for component interactions
- E2E tests for critical user flows
- Minimum 80% code coverage target

### Build Process
- Automated build validation
- Manifest version 3 compliance
- Optimized bundle sizes
- Source maps for debugging

## 🐛 Troubleshooting

### Common Issues

1. **TypeScript Errors**: Run `npm run type-check` to identify type issues
2. **Linting Failures**: Run `npm run lint` to auto-fix most issues
3. **Test Failures**: Check test setup and mock configurations
4. **Build Failures**: Verify manifest.json and entry points

### Debug Mode

```bash
# Run pipeline with verbose output
DEBUG=1 ./scripts/debug-pipeline.sh

# Skip specific steps
SKIP_ICONS=1 SKIP_SONAR=1 ./scripts/debug-pipeline.sh
```

## 📊 Metrics & Reports

The pipeline generates several reports:

- **Coverage Report**: `coverage/index.html`
- **Test Results**: `test-results/` directory
- **Build Artifacts**: `dist/` directory
- **SonarQube**: Web dashboard (if configured)

## 🔄 CI/CD Integration

The pipeline is designed for CI/CD integration:

```yaml
# Example GitHub Actions workflow
- name: Run Debug Pipeline
  run: npm run debug:pipeline
  env:
    FIGMA_TOKEN: ${{ secrets.FIGMA_TOKEN }}
    SONAR_LOGIN: ${{ secrets.SONAR_LOGIN }}
```

## 📝 Contributing

1. Run the debug pipeline before submitting changes
2. Ensure all tests pass
3. Maintain code coverage above 80%
4. Follow the established code style guidelines 