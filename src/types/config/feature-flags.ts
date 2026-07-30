/**
 * Feature flags to control capability rollouts and access bounds across the application.
 */
export const FEATURE_FLAGS = {
  /**
   * If true, enables OCR receipt scanning and Claude Vision ingestion.
   */
  ocrEnabled: true,

  /**
   * If true, activates Claude AI co-pilot chat routes.
   */
  aiChatEnabled: true,

  /**
   * If true, activates next-themes and layout transitions.
   */
  themeSwitchesEnabled: true,

  /**
   * If true, enables service worker service configurations for PWAs.
   */
  pwaSupportEnabled: false,

  /**
   * If true, activates background notifications check and email triggers.
   */
  notificationsEnabled: true,
} as const;

export type FeatureFlags = typeof FEATURE_FLAGS;
