const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Manifest Cache Manager
 * 
 * Manages caching of GitHub manifests in ~/.jetpack/cache/
 * Implements 24-hour TTL (time-to-live) for cached manifests
 */
class ManifestCache {
  constructor() {
    this.cacheDir = path.join(os.homedir(), '.jetpack', 'cache');
    this.ttl = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    this.ensureCacheDir();
  }

  /**
   * Get cache file path for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {string} Absolute path to cache file
   */
  getCachePath(owner, repo) {
    const filename = `${owner}-${repo}.yaml`;
    return path.join(this.cacheDir, filename);
  }

  /**
   * Read manifest from cache
   * Returns null if cache miss, expired, or read error
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {string|null} Cached manifest content or null
   */
  read(owner, repo) {
    const cachePath = this.getCachePath(owner, repo);

    try {
      // Check if cache file exists
      if (!fs.existsSync(cachePath)) {
        return null;
      }

      // Check if cache is expired
      const stats = fs.statSync(cachePath);
      const age = Date.now() - stats.mtime.getTime();
      
      if (age > this.ttl) {
        // Cache expired, delete it
        try {
          fs.unlinkSync(cachePath);
        } catch (err) {
          // Ignore deletion errors
        }
        return null;
      }

      // Read and return cache content
      return fs.readFileSync(cachePath, 'utf8');
    } catch (error) {
      // Return null on any error (file read issues, permissions, etc.)
      return null;
    }
  }

  /**
   * Write manifest to cache
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} content - Manifest YAML content
   */
  write(owner, repo, content) {
    const cachePath = this.getCachePath(owner, repo);

    try {
      fs.writeFileSync(cachePath, content, 'utf8');
    } catch (error) {
      // Silent fail - caching is optional, don't break the flow
      console.error(`Warning: Failed to write cache: ${error.message}`);
    }
  }

  /**
   * Clear cache for specific repository or all
   * @param {string} owner - Optional repository owner
   * @param {string} repo - Optional repository name
   */
  clear(owner = null, repo = null) {
    try {
      if (owner && repo) {
        // Clear specific repository cache
        const cachePath = this.getCachePath(owner, repo);
        if (fs.existsSync(cachePath)) {
          fs.unlinkSync(cachePath);
        }
      } else {
        // Clear all cache
        if (fs.existsSync(this.cacheDir)) {
          const files = fs.readdirSync(this.cacheDir);
          files.forEach(file => {
            fs.unlinkSync(path.join(this.cacheDir, file));
          });
        }
      }
    } catch (error) {
      console.error(`Warning: Failed to clear cache: ${error.message}`);
    }
  }

  /**
   * Ensure cache directory exists
   * @private
   */
  ensureCacheDir() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      // If we can't create cache dir, caching will silently fail
      console.error(`Warning: Failed to create cache directory: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats {files, totalSize, oldestFile, newestFile}
   */
  getStats() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        return { files: 0, totalSize: 0 };
      }

      const files = fs.readdirSync(this.cacheDir);
      let totalSize = 0;
      let oldestTime = Date.now();
      let newestTime = 0;

      files.forEach(file => {
        const filePath = path.join(this.cacheDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        
        if (stats.mtime.getTime() < oldestTime) {
          oldestTime = stats.mtime.getTime();
        }
        if (stats.mtime.getTime() > newestTime) {
          newestTime = stats.mtime.getTime();
        }
      });

      return {
        files: files.length,
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024),
        oldestFile: oldestTime < Date.now() ? new Date(oldestTime) : null,
        newestFile: newestTime > 0 ? new Date(newestTime) : null
      };
    } catch (error) {
      return { files: 0, totalSize: 0, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new ManifestCache();
