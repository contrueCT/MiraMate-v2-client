export const isBrowser = typeof window !== 'undefined'
export const isElectron = isBrowser && !!(window as any).electronAPI
export const isCapacitor =
  isBrowser && !!(window as any).Capacitor && (window as any).Capacitor.isNativePlatform
export const isMobileRuntime =
  isCapacitor || (typeof __MOBILE__ !== 'undefined' && __MOBILE__ === true)
