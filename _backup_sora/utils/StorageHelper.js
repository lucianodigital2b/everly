import AsyncStorage from '@react-native-async-storage/async-storage';


const STORAGE_KEY_PREFIX = 'Dive';

export const setItem = (key, content) =>
  new Promise((resolve, reject) => {
    AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}:${key}`, JSON.stringify(content))
      .then(() => resolve())
      .catch((err) => reject(err));
  });

export const multiSet = (content) =>
  new Promise((resolve, reject) => {
    const updatedContent = content.map((item) => {
      item[0] = `${STORAGE_KEY_PREFIX}:${item[0]}`;
      item[1] = typeof item[1] === 'object' ? JSON.stringify(item[1]) : item[1];

      return item;
    });

    AsyncStorage.multiSet(updatedContent)
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
