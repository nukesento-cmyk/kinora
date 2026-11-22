/**
 * A short, human description of a session's device from its User-Agent, for the
 * "Where you're signed in" list. Deliberately coarse: browser family and system only.
 */
export interface DeviceDescription {
  browser: string | null;
  os: string | null;
}

const BROWSERS: [RegExp, string][] = [
  [/\bEdg(?:e|A|iOS)?\//, "Edge"],
  [/\bOPR\/|\bOpera\b/, "Opera"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\bFirefox\/|\bFxiOS\//, "Firefox"],
  [/\bCriOS\/|\bChrome\/|\bHeadlessChrome\//, "Chrome"],
  [/\bVersion\/[\d.]+.*\bSafari\//, "Safari"],
];

const SYSTEMS: [RegExp, string][] = [
  [/\bAndroid\b/, "Android"],
  [/\biPhone\b|\biPad\b|\biPod\b/, "iOS"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bWindows\b/, "Windows"],
  [/\bMac OS X\b|\bMacintosh\b/, "macOS"],
  [/\bLinux\b/, "Linux"],
];

export function describeUserAgent(userAgent: string | null | undefined): DeviceDescription {
  if (!userAgent) return { browser: null, os: null };
  const browser = BROWSERS.find(([re]) => re.test(userAgent))?.[1] ?? null;
  const os = SYSTEMS.find(([re]) => re.test(userAgent))?.[1] ?? null;
  return { browser, os };
}
