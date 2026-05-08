import type { PendingCheckin } from '../types/checkin';
import { createUuid } from './uuid';

const DB_NAME = 'unihub-checkin';
const DB_VERSION = 1;
const STORE_NAME = 'pending_checkins';
const DEVICE_ID_KEY = 'unihub-checkin-device-id';

function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = callback(transaction.objectStore(STORE_NAME));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}

export function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = createUuid();
  localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export function addPendingCheckin(qrCode: string, deviceId: string) {
  const record: PendingCheckin = {
    id: createUuid(),
    qrCode,
    checkedInAt: new Date().toISOString(),
    deviceId,
  };

  return withStore('readwrite', (store) => store.add(record)).then(() => record);
}

export function listPendingCheckins() {
  return withStore<PendingCheckin[]>('readonly', (store) => store.getAll());
}

export function removePendingCheckins(ids: string[]) {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        ids.forEach((id) => store.delete(id));

        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}
