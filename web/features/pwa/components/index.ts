/**
 * PWA Components Barrel Export
 * 
 * This module re-exports all PWA components.
 */

export { default as PWAInstaller } from './PWAInstaller';
export { default as NotificationSettings } from './NotificationSettings';
export { PWAVotingInterface } from './PWAVotingInterface';
export { PWAUserProfile } from './PWAUserProfile';

// Import the components for the object
import PWAInstallerComponent from './PWAInstaller';
import NotificationSettingsComponent from './NotificationSettings';
import { PWAVotingInterface } from './PWAVotingInterface';
import { PWAUserProfile } from './PWAUserProfile';

export const PWAComponents = {
  PWAInstaller: PWAInstallerComponent,
  NotificationSettings: NotificationSettingsComponent,
  PWAVotingInterface,
  PWAUserProfile,
};








