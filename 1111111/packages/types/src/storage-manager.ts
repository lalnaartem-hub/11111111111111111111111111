/**
 * Storage Manager Interfaces
 * 
 * Defines persistent storage using IndexedDB with efficient caching.
 */

/**
 * Storage quota information
 */
export interface StorageQuota {
  /** Current storage usage in bytes */
  usage: number;
  /** Total storage quota in bytes */
  quota: number;
  /** Available storage in bytes */
  available: number;
}

/**
 * Storage Manager interface - handles persistent storage
 * 
 * **Validates: Requirements 1.2**
 */
export interface IStorageManager {
  // Storage operations
  /** Store a value by key */
  set(key: string, value: any): Promise<void>;
  /** Retrieve a value by key */
  get(key: string): Promise<any>;
  /** Delete a value by key */
  delete(key: string): Promise<void>;
  /** Clear all stored data */
  clear(): Promise<void>;
  
  // Batch operations
  /** Store multiple key-value pairs */
  setBatch(entries: [string, any][]): Promise<void>;
  /** Retrieve multiple values by keys */
  getBatch(keys: string[]): Promise<any[]>;
  
  // Quota
  /** Get current storage quota information */
  getQuota(): Promise<StorageQuota>;
  
  // Persistence
  /** Request persistent storage (prevents browser from clearing data) */
  persist(): Promise<boolean>;
}
