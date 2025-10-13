// Mock for lucide-react to avoid ESM import issues in Jest
const React = require('react');

const createMockIcon = (name) => {
  return function MockIcon(props) {
    return React.createElement('div', {
      'data-testid': `${name.toLowerCase()}-icon`,
      ...props
    }, name);
  };
};

module.exports = {
  Bell: createMockIcon('Bell'),
  Menu: createMockIcon('Menu'),
  Home: createMockIcon('Home'),
  Settings: createMockIcon('Settings'),
  Fingerprint: createMockIcon('Fingerprint'),
  // Add other commonly used icons as needed
};




const createMockIcon = (name) => {
  return function MockIcon(props) {
    return React.createElement('div', {
      'data-testid': `${name.toLowerCase()}-icon`,
      ...props
    }, name);
  };
};

module.exports = {
  Bell: createMockIcon('Bell'),
  Menu: createMockIcon('Menu'),
  Home: createMockIcon('Home'),
  Settings: createMockIcon('Settings'),
  Fingerprint: createMockIcon('Fingerprint'),
  // Add other commonly used icons as needed
};
