/**
 * Lucide React Mock for Jest
 * 
 * Mocks all Lucide React icons to prevent ESM import issues
 * 
 * Created: January 27, 2025
 * Status: ✅ PRODUCTION READY
 */

const React = require('react');

// Mock all Lucide React icons
const createMockIcon = (name) => {
  return function MockIcon(props) {
    return React.createElement('svg', {
      ...props,
      'data-testid': `lucide-${name}`,
      'aria-label': name,
      role: 'img'
    }, React.createElement('path', {
      d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
    }));
  };
};

// Common icons used in the app
const commonIcons = [
  'Bell', 'Fingerprint', 'Shield', 'Lock', 'Unlock', 'Eye', 'EyeOff',
  'User', 'Mail', 'Key', 'Check', 'X', 'Plus', 'Minus', 'Edit',
  'Trash', 'Save', 'Download', 'Upload', 'Search', 'Filter',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ChevronLeft',
  'ChevronRight', 'ChevronUp', 'ChevronDown', 'Menu', 'Close',
  'Home', 'Settings', 'Help', 'Info', 'Alert', 'Warning', 'Error',
  'Success', 'Loading', 'Refresh', 'Play', 'Pause', 'Stop',
  'Vote', 'BarChart3', 'LogOut', 'CheckCircle', 'AlertCircle'
];

// Create mocks for all common icons
const iconMocks = {};
commonIcons.forEach(iconName => {
  iconMocks[iconName] = createMockIcon(iconName);
});

// Export all mocked icons
// eslint-disable-next-line no-undef
module.exports = {
  ...iconMocks,
  // Default export for dynamic imports
  default: createMockIcon('Icon')
};