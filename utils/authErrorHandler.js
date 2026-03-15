export const handleAuthError = (error, notificationsShow) => {
  const errorMappings = {
    'SIGN_IN_CANCELLED': 'Sign-in was cancelled',
    'IN_PROGRESS': 'Sign-in is already in progress',
    'PLAY_SERVICES_NOT_AVAILABLE': 'Google Play Services not available',
    'NETWORK_ERROR': 'Network connection failed',
    'INVALID_TOKEN': 'Invalid authentication token'
  };
  
  const message = errorMappings[error.code] || error?.response?.data?.error || 'Authentication failed';
  
  notificationsShow({
    message,
    title: 'Authentication Error',
    type: 'error'
  });
  
  return message;
};