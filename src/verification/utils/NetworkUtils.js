const http = require('http');
const https = require('https');
const { URL } = require('url');
const net = require('net');

/**
 * NetworkUtils - HTTP and network utility functions
 */
class NetworkUtils {
  /**
   * Make an HTTP/HTTPS request
   * @param {string} url - URL to request
   * @param {object} options - Request options
   * @returns {Promise<object>} Response with status, body, headers
   */
  static async httpRequest(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      body = null,
      timeout = 5000,
      followRedirects = true,
      maxRedirects = 5
    } = options;

    return new Promise((resolve, reject) => {
      let parsedUrl;
      try {
        parsedUrl = new URL(url);
      } catch (error) {
        return reject(new Error(`Invalid URL: ${url}`));
      }

      const isHttps = parsedUrl.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const requestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers: {
          'User-Agent': 'Jetpack-CLI-Verification/1.0',
          ...headers
        },
        timeout
      };

      const req = httpModule.request(requestOptions, (res) => {
        let responseBody = '';

        res.on('data', (chunk) => {
          responseBody += chunk.toString();
        });

        res.on('end', () => {
          // Handle redirects
          if (followRedirects && [301, 302, 303, 307, 308].includes(res.statusCode)) {
            if (maxRedirects <= 0) {
              return reject(new Error('Too many redirects'));
            }

            const redirectUrl = res.headers.location;
            if (!redirectUrl) {
              return reject(new Error('Redirect without location header'));
            }

            return NetworkUtils.httpRequest(redirectUrl, {
              ...options,
              maxRedirects: maxRedirects - 1
            }).then(resolve).catch(reject);
          }

          // Parse JSON if content-type indicates it
          let parsedBody = responseBody;
          const contentType = res.headers['content-type'] || '';
          if (contentType.includes('application/json')) {
            try {
              parsedBody = JSON.parse(responseBody);
            } catch (e) {
              // Keep as string if JSON parsing fails
            }
          }

          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: res.headers,
            body: parsedBody,
            rawBody: responseBody
          });
        });
      });

      req.on('error', (error) => {
        reject(new Error(`HTTP request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`HTTP request timed out after ${timeout}ms`));
      });

      // Send body if present
      if (body) {
        if (typeof body === 'object') {
          req.write(JSON.stringify(body));
        } else {
          req.write(body);
        }
      }

      req.end();
    });
  }

  /**
   * Test TCP port connectivity
   * @param {string} host - Hostname or IP
   * @param {number} port - Port number
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>}
   */
  static async testPort(host, port, timeout = 3000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
        }
      };

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        cleanup();
        resolve(true);
      });

      socket.on('timeout', () => {
        cleanup();
        resolve(false);
      });

      socket.on('error', () => {
        cleanup();
        resolve(false);
      });

      try {
        socket.connect(port, host);
      } catch (error) {
        cleanup();
        resolve(false);
      }
    });
  }

  /**
   * Parse URL safely
   * @param {string} url - URL string
   * @returns {URL|null}
   */
  static parseUrl(url) {
    try {
      return new URL(url);
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate port number
   * @param {number} port - Port number
   * @returns {boolean}
   */
  static isValidPort(port) {
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }
}

module.exports = NetworkUtils;
