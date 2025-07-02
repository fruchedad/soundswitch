# Google JavaScript Style Guide Summary

## Key Principles

### 1. Use const and let
```javascript
// Good
const MAX_ITEMS = 100;
let count = 0;

// Avoid
var items = [];
```

### 2. Arrow Functions
```javascript
// Good
const squared = numbers.map(n => n * n);

// Good for multiline
const process = (item) => {
  validate(item);
  return transform(item);
};
```

### 3. Template Literals
```javascript
// Good
const message = `Hello ${name}, you have ${count} items`;

// Avoid
const message = 'Hello ' + name + ', you have ' + count + ' items';
```

### 4. Destructuring
```javascript
// Good
const {name, age} = person;
const [first, second] = array;

// Function parameters
function processUser({name, email}) {
  // ...
}
```

## Naming Conventions

### Variables and Functions
```javascript
// camelCase for variables and functions
const userName = 'John';
function calculateTotal() {}

// CONSTANT_CASE for constants
const MAX_RETRY_COUNT = 3;

// PascalCase for classes
class UserProfile {}
```

### File Names
```
// Use hyphens
my-feature.js
user-profile.js

// Avoid
myFeature.js
user_profile.js
```

## Code Organization

### Module Structure
```javascript
// Imports first
import {helper} from './utils.js';

// Constants
const DEFAULT_TIMEOUT = 5000;

// Main code
export class Feature {
  constructor() {
    // ...
  }
}

// Exports at bottom if needed
export {Feature, DEFAULT_TIMEOUT};
```

### Comments
```javascript
// Single line for brief comments

/**
 * Multi-line for function documentation
 * @param {string} name - User name
 * @return {Object} User object
 */
function getUser(name) {
  // Implementation
}
```

## Best Practices

1. **Prefer async/await over promises**
2. **Use early returns to reduce nesting**
3. **Keep functions small and focused**
4. **Use meaningful variable names**
5. **Add JSDoc comments for public APIs** 