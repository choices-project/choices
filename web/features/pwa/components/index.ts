/**
 * PWA Components Barrel Export
 * 
 * This module re-exports all PWA components.
 */

// Import the components for the object
import NotificationSettingsComponent from './NotificationSettings';
import PWAInstallerComponent from './PWAInstaller';
import { PWAUserProfile } from './PWAUserProfile';
import { PWAVotingInterface } from './PWAVotingInterface';

export { default as PWAInstaller } from './PWAInstaller';
export { default as NotificationSettings } from './NotificationSettings';
export { PWAVotingInterface } from './PWAVotingInterface';
export { PWAUserProfile } from './PWAUserProfile';

export const PWAComponents = {
  PWAInstaller: PWAInstallerComponent,
  NotificationSettings: NotificationSettingsComponent,
  PWAVotingInterface,
  PWAUserProfile,
};








