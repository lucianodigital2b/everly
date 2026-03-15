/**
 * Generate API URL for the current environment
 * @param {string} path - The API path (e.g., '/api/chat')
 * @returns {string} - The complete API URL
 */
export const generateAPIUrl = (path) => {
  // For Expo development, we need to use the local development server
  // In production, this would be your deployed API URL
  const baseUrl = __DEV__
    ? "https://8578-2804-56c-a5bc-cf00-9ceb-606f-17c0-cc02.ngrok-free.app"
    : "https://your-production-api.com";

  return `${baseUrl}${path}`;
};

/**
 * Alternative function that works with Expo's bundler
 * Uses relative paths which work better in Expo environment
 */
export const getApiPath = (path) => {
  return path.startsWith("/") ? path : `/${path}`;
};
