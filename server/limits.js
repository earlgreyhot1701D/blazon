'use strict';
// limits.js: rate limits, daily caps (total and per visitor), size caps.
// Pure logic. No network, no globals except the counters passed in. Easy to test.

// A motto request is { word <= 40, blazon <= 120 } plus JSON wrapper. 2 KB is generous.
const MAX_BODY_BYTES = 2 * 1024;

const DEFAULTS = {
  windowMs: 60 * 1000,
  perIpPerWindow: 6,
  perDevicePerWindow: 4,
  dailyCap: parseInt(process.env.DAILY_CAP || '50', 10) || 50, // total motto calls per day, all visitors
  perIpPerDay: parseInt(process.env.IP_DAILY_CAP || '10', 10) || 10, // so one visitor can't use them all
  dayMs: 24 * 60 * 60 * 1000
};

// Fixed-window counter keyed by string. Memory only; resets on restart, which is fine for a demo.
function createLimiter(options) {
  const cfg = Object.assign({}, DEFAULTS, options || {});
  const windows = new Map(); // key -> { start, count }
  const ipDay = new Map(); // ip -> { start, count }
  let day = { start: 0, count: 0 };

  function hit(key, max, now) {
    const w = windows.get(key);
    if (!w || now - w.start >= cfg.windowMs) {
      windows.set(key, { start: now, count: 1 });
      return true;
    }
    if (w.count >= max) return false;
    w.count += 1;
    return true;
  }

  function sweep(now) {
    for (const [k, w] of windows) {
      if (now - w.start >= cfg.windowMs) windows.delete(k);
    }
  }

  // Returns { ok: true } or { ok: false, reason: 'rate' | 'daily' | 'ip_daily', retryAfterSec }
  function check({ ip, deviceId, now }) {
    const t = typeof now === 'number' ? now : Date.now();
    if (windows.size > 5000) sweep(t);
    if (ipDay.size > 5000) { for (const [k, v] of ipDay) if (t - v.start >= cfg.dayMs) ipDay.delete(k); }

    if (t - day.start >= cfg.dayMs) day = { start: t, count: 0 };
    if (day.count >= cfg.dailyCap) {
      const retry = Math.ceil((day.start + cfg.dayMs - t) / 1000);
      return { ok: false, reason: 'daily', retryAfterSec: Math.max(retry, 1) };
    }

    const ipKey = String(ip || 'unknown');
    const d = ipDay.get(ipKey);
    if (!d || t - d.start >= cfg.dayMs) ipDay.set(ipKey, { start: t, count: 0 });
    if (ipDay.get(ipKey).count >= cfg.perIpPerDay) {
      const retry = Math.ceil((ipDay.get(ipKey).start + cfg.dayMs - t) / 1000);
      return { ok: false, reason: 'ip_daily', retryAfterSec: Math.max(retry, 1) };
    }

    const ipOk = hit('ip:' + String(ip || 'unknown'), cfg.perIpPerWindow, t);
    const devOk = deviceId ? hit('dev:' + String(deviceId).slice(0, 64), cfg.perDevicePerWindow, t) : true;
    if (!ipOk || !devOk) {
      return { ok: false, reason: 'rate', retryAfterSec: Math.ceil(cfg.windowMs / 1000) };
    }
    day.count += 1;
    ipDay.get(ipKey).count += 1;
    return { ok: true };
  }

  return { check };
}

// Body shape checks live in validate.js.
module.exports = { MAX_BODY_BYTES, DEFAULTS, createLimiter };
