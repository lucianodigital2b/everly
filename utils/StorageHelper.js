import AsyncStorage from '@react-native-async-storage/async-storage';


const STORAGE_KEY_PREFIX = 'Dive';

export const setItem = (key, content) =>
  new Promise((resolve, reject) => {
    AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}:${key}`, JSON.stringify(content))
      .then(() => resolve())
      .catch((err) => reject(err));
  });

/**
 * Writes several prefixed entries at once. Takes `[key, value]` pairs to match
 * the other helpers' call style; AsyncStorage v3 wants a plain object, so the
 * pairs are folded into one here rather than mutating the caller's array.
 */
export const multiSet = (content) =>
  new Promise((resolve, reject) => {
    const entries = content.reduce((acc, [key, value]) => {
      acc[`${STORAGE_KEY_PREFIX}:${key}`] =
        typeof value === 'string' ? value : JSON.stringify(value);
      return acc;
    }, {});

    AsyncStorage.setMany(entries)
      .then(() => resolve())
      .catch((err) => reject(err));
  });

export const getItem = (key) =>
  new Promise((resolve, reject) => {
    AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}:${key}`)
      .then((value) => resolve(value))
      .catch((err) => reject(err));
  });

export const removeItem = (key) =>
  new Promise((resolve, reject) => {
    AsyncStorage.removeItem(`${STORAGE_KEY_PREFIX}:${key}`)
      .then(() => resolve())
      .catch((err) => reject(err));
  });

export const clear = () =>
  new Promise((resolve, reject) => {
    AsyncStorage.clear()
      .then(() => resolve())
      .catch((err) => reject(err));
  });

export const getAccessToken = async () => JSON.parse(await getItem('token'));
export const saveAccessToken = async (token) => setItem('token', token);
