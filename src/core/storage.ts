import Dexie, { type Table } from 'dexie';

export interface StorageAdapter {
  getItem<T>(key: string): Promise<T | undefined>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface AppDB extends Dexie {
  settings: Table<{ key: string; value: unknown }, string>;
  utilityData: Table<{ utilityId: string; data: unknown }, string>;
}

class AppDatabase extends Dexie implements AppDB {
  settings!: Table<{ key: string; value: unknown }, string>;
  utilityData!: Table<{ utilityId: string; data: unknown }, string>;

  constructor() {
    super('AIOUtilDB');
    this.version(1).stores({
      settings: 'key',
      utilityData: 'utilityId',
    });
  }
}

export const db = new AppDatabase();

export const dexieAdapter: StorageAdapter = {
  async getItem<T>(key: string): Promise<T | undefined> {
    const entry = await db.utilityData.get(key);
    return entry?.data as T;
  },
  async setItem<T>(key: string, value: T): Promise<void> {
    await db.utilityData.put({ utilityId: key, data: value });
  },
  async removeItem(key: string): Promise<void> {
    await db.utilityData.delete(key);
  },
};
