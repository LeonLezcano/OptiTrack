/**
 * OptiTrack Offline Cache & Sincronización Local
 * Regla Inquebrantable #14: Invariante Anti-Siembras Fantasma
 */
const PURGE_FLAG = 'optitrack_demo_purged';
const STORAGE_KEY_ORDERS = 'optitrack_orders_v1';
const STORAGE_KEY_OUTBOX = 'optitrack_outbox_v1';

const memoryStore = new Map();

function getStorageItem(key) {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStore.get(key) || null;
}

function setStorageItem(key, val) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, val);
  } else {
    memoryStore.set(key, val);
  }
}

function removeStorageItem(key) {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  } else {
    memoryStore.delete(key);
  }
}

export class OptiTrackCacheService {
  static isPurged() {
    return getStorageItem(PURGE_FLAG) === 'true';
  }

  static purgeData() {
    setStorageItem(PURGE_FLAG, 'true');
    removeStorageItem(STORAGE_KEY_ORDERS);
    removeStorageItem(STORAGE_KEY_OUTBOX);
  }

  static resetPurgeForTesting() {
    removeStorageItem(PURGE_FLAG);
  }

  static saveOrders(orders = []) {
    setStorageItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
  }

  static getOrders() {
    if (this.isPurged()) return [];
    const raw = getStorageItem(STORAGE_KEY_ORDERS);
    return raw ? JSON.parse(raw) : [];
  }

  static enqueueOutbox(action) {
    const raw = getStorageItem(STORAGE_KEY_OUTBOX);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({
      id: `OUT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      action,
      enqueuedAt: new Date().toISOString()
    });
    setStorageItem(STORAGE_KEY_OUTBOX, JSON.stringify(queue));
  }

  static getOutbox() {
    const raw = getStorageItem(STORAGE_KEY_OUTBOX);
    return raw ? JSON.parse(raw) : [];
  }

  static clearOutbox() {
    removeStorageItem(STORAGE_KEY_OUTBOX);
  }
}
