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
  X: createMockIcon('X'),
  Shield: createMockIcon('Shield'),
  User: createMockIcon('User'),
  LogOut: createMockIcon('LogOut'),
  Vote: createMockIcon('Vote'),
  BarChart3: createMockIcon('BarChart3'),
  // Add other commonly used icons as needed
};


