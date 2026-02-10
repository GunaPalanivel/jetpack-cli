const { execSync } = require('child_process');
const cache = require('./manifest-cache');
const logger = require('../ui/logger');

/**
 * Manifest Fetcher
 * 
 * Fetches .onboard.yaml manifests from GitHub repositories
 * Strategy: Try gh CLI first (preserves auth), fallback to raw.githubusercontent.com
 * Supports multiple manifest filenames and caching with TTL
 */

// Manifest filenames to try in order of preference
const MANIFEST_FILENAMES = ['.onboard.yaml', '.onboard.yml', 'onboard.yaml'];

/**
 * Fetch manifest from GitHub repository
 * @param {string} repoUrl - GitHub repository URL (https://github.com/owner/repo)
 * @param {object} options - Fetch options
 * @param {boolean} options.noCache - Skip cache, always fetch fresh
 * @param {string} options.branch - Branch to fetch from (default: repository default branch)
 * @returns {Promise<object>} {content: string, source: string, filename: string, timestamp: Date}
 * @throws {Error} If manifest cannot be fetched
 */
async function fetchFromGitHub(repoUrl, options = {}) {
  const { noCache = false, branch = null } = options;
  const { owner, repo } = parseRepoUrl(repoUrl);

  logger.info(`Fetching manifest from ${owner}/${repo}...`);

  // Step 1: Try cache first (unless --no-cache flag)
  if (!noCache) {
    const cached = cache.read(owner, repo);
    if (cached) {
      logger.success('✓ Manifest loaded from cache');
      return {
        content: cached,
        source: 'cache',
        filename: 'cached',
        timestamp: new Date()
      };
    }
  }

  // Step 2: Determine branch to fetch from
  const targetBranch = branch || await getDefaultBranch(owner, repo);

  // Step 3: Try to fetch from GitHub
  let result = null;

  // Try gh CLI first (authenticates automatically)
  try {
    result = await tryGhCli(owner, repo, targetBranch);
    logger.success('✓ Manifest fetched via gh CLI');
  } catch (error) {
    logger.debug(`gh CLI failed: ${error.message}`);
    logger.info('  → Trying fallback method...');
  }

  // Fallback to raw.githubusercontent.com if gh CLI failed
  if (!result) {
    try {
      result = await tryRawGitHub(owner, repo, targetBranch);
      logger.success('✓ Manifest fetched from raw.githubusercontent.com');
    } catch (error) {
      throw new Error(
        `Failed to fetch manifest from ${owner}/${repo}: No manifest file found. ` +
        `Tried: ${MANIFEST_FILENAMES.join(', ')}`
      );
    }
  }

  // Step 4: Cache the result
  cache.write(owner, repo, result.content);

  // Step 5: Return result with metadata
  return {
    content: result.content,
    source: result.source,
    filename: result.filename,
    timestamp: new Date()
  };
}

/**
 * Get default branch for repository using gh CLI
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @returns {Promise<string>} Default branch name
 * @private
 */
async function getDefaultBranch(owner, repo) {
  try {
    const command = `gh repo view ${owner}/${repo} --json defaultBranchRef --jq .defaultBranchRef.name`;
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const branch = result.trim();
    logger.debug(`Default branch: ${branch}`);
    return branch;
  } catch (error) {
    // Fallback to common default branches
    logger.debug(`Failed to detect default branch, using 'main': ${error.message}`);
    return 'main';
  }
}

/**
 * Try to fetch manifest using gh CLI
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @returns {Promise<object>} {content: string, source: string, filename: string}
 * @throws {Error} If gh CLI fails or manifest not found
 * @private
 */
async function tryGhCli(owner, repo, branch) {
  // Try each manifest filename
  for (const filename of MANIFEST_FILENAMES) {
    try {
      logger.debug(`Trying gh CLI for ${filename}...`);
      
      // Use gh api to get file content
      // Note: GitHub API returns base64-encoded content
      const command = `gh api repos/${owner}/${repo}/contents/${filename}?ref=${branch} --jq .content`;
      const base64Content = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Decode base64 content
      const content = Buffer.from(base64Content.trim(), 'base64').toString('utf8');

      return {
        content,
        source: 'gh-cli',
        filename
      };
    } catch (error) {
      // Try next filename
      logger.debug(`  ${filename} not found via gh CLI`);
    }
  }

  throw new Error('No manifest file found via gh CLI');
}

/**
 * Try to fetch manifest from raw.githubusercontent.com
 * Fallback method when gh CLI is not available or fails
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branch - Branch name
 * @returns {Promise<object>} {content: string, source: string, filename: string}
 * @throws {Error} If fetch fails or manifest not found
 * @private
 */
async function tryRawGitHub(owner, repo, branch) {
  const baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`;

  // Try each manifest filename
  for (const filename of MANIFEST_FILENAMES) {
    try {
      logger.debug(`Trying raw.githubusercontent.com for ${filename}...`);
      
      const url = `${baseUrl}/${filename}`;
      
      // Use curl to fetch (most reliable cross-platform)
      const command = process.platform === 'win32'
        ? `curl -s -f "${url}"`
        : `curl -s -f '${url}'`;

      const content = execSync(command, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Check if content is not empty
      if (content && content.trim().length > 0) {
        return {
          content,
          source: 'raw-github',
          filename
        };
      }
    } catch (error) {
      // Try next filename
      logger.debug(`  ${filename} not found on raw.githubusercontent.com`);
    }
  }

  throw new Error('No manifest file found on raw.githubusercontent.com');
}

/**
 * Parse GitHub repository URL
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - github.com/owner/repo
 * @param {string} url - Repository URL
 * @returns {object} {owner: string, repo: string}
 * @throws {Error} If URL format is invalid
 * @private
 */
function parseRepoUrl(url) {
  // Remove .git suffix if present
  url = url.replace(/\.git$/, '');

  // Extract owner and repo
  const match = url.match(/github\.com[/:]([\w-]+)\/([\w.-]+)/);
  
  if (!match) {
    throw new Error(
      `Invalid GitHub repository URL: ${url}\n` +
      `Expected format: https://github.com/owner/repo`
    );
  }

  return {
    owner: match[1],
    repo: match[2]
  };
}

/**
 * Check if gh CLI is available
 * @returns {Promise<boolean>} True if gh CLI is installed and authenticated
 */
async function isGhCliAvailable() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clear manifest cache
 * @param {string} repoUrl - Optional repository URL to clear specific cache
 */
function clearCache(repoUrl = null) {
  if (repoUrl) {
    const { owner, repo } = parseRepoUrl(repoUrl);
    cache.clear(owner, repo);
    logger.success(`✓ Cache cleared for ${owner}/${repo}`);
  } else {
    cache.clear();
    logger.success('✓ All manifest cache cleared');
  }
}

module.exports = {
  fetchFromGitHub,
  parseRepoUrl,
  isGhCliAvailable,
  clearCache
};
