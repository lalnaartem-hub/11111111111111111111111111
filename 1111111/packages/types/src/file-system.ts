/**
 * File System Interfaces
 * 
 * Defines the virtual file system with POSIX-like hierarchical structure.
 */

/**
 * File permissions structure
 */
export interface FilePermissions {
  /** Read permission */
  read: boolean;
  /** Write permission */
  write: boolean;
  /** Execute permission */
  execute: boolean;
}

/**
 * File or directory entry
 */
export interface FileEntry {
  /** File or directory name */
  name: string;
  /** Full path */
  path: string;
  /** Entry type */
  type: 'file' | 'directory';
  /** Size in bytes */
  size: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  modifiedAt: Date;
  /** File permissions */
  permissions: FilePermissions;
}

/**
 * Detailed file statistics
 */
export interface FileStats {
  /** Size in bytes */
  size: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  modifiedAt: Date;
  /** Last access timestamp */
  accessedAt: Date;
  /** File permissions */
  permissions: FilePermissions;
  /** True if entry is a directory */
  isDirectory: boolean;
  /** True if entry is a file */
  isFile: boolean;
}

/**
 * File watch callback function
 */
export type FileWatchCallback = (event: FileWatchEvent) => void;

/**
 * File watch event
 */
export interface FileWatchEvent {
  /** Event type */
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  /** Path that changed */
  path: string;
  /** New path (for rename events) */
  newPath?: string;
  /** Event timestamp */
  timestamp: number;
}

/**
 * File watch handle for unsubscribing
 */
export interface WatchHandle {
  /** Unique watch identifier */
  id: string;
  /** Path being watched */
  path: string;
}

/**
 * File System interface - provides POSIX-like file operations
 * 
 * **Validates: Requirements 1.2**
 */
export interface IFileSystem {
  // File operations
  /** Read file contents as binary data */
  readFile(path: string): Promise<Uint8Array>;
  /** Write binary data to file */
  writeFile(path: string, data: Uint8Array): Promise<void>;
  /** Delete a file */
  deleteFile(path: string): Promise<void>;
  
  // Directory operations
  /** Read directory contents */
  readDir(path: string): Promise<FileEntry[]>;
  /** Create a directory */
  createDir(path: string): Promise<void>;
  /** Delete a directory */
  deleteDir(path: string, recursive?: boolean): Promise<void>;
  
  // Metadata operations
  /** Get file or directory statistics */
  stat(path: string): Promise<FileStats>;
  /** Change file permissions */
  chmod(path: string, mode: number): Promise<void>;
  
  // Path operations
  /** Check if path exists */
  exists(path: string): Promise<boolean>;
  /** Rename or move a file/directory */
  rename(oldPath: string, newPath: string): Promise<void>;
  /** Copy a file/directory */
  copy(srcPath: string, destPath: string): Promise<void>;
  /** Move a file/directory */
  move(srcPath: string, destPath: string): Promise<void>;
  
  // Import/Export
  /** Import a file from the host system */
  importFile(file: File, destPath: string): Promise<void>;
  /** Export a file to the host system */
  exportFile(path: string): Promise<Blob>;
  
  // Watch
  /** Watch a path for changes */
  watch(path: string, callback: FileWatchCallback): WatchHandle;
  /** Stop watching a path */
  unwatch(handle: WatchHandle): void;
}
