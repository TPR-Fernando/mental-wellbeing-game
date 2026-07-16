export type DeviceType = 'mobile' | 'desktop';

const MOBILE_BREAKPOINT_PX = 768;

// Coarse only, per COPILOT_BUILD_GUIDE.md Section 8.5 — never collect full user-agent strings.
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  return window.innerWidth < MOBILE_BREAKPOINT_PX ? 'mobile' : 'desktop';
}
