import { State } from './interfaces';
import {create} from 'zustand'
import { persist, redux } from "zustand/middleware"
import AsyncStorage from '@react-native-async-storage/async-storage'
import reducer from './reducer'

export const initialState: State = {
  notifications: [],
  closed: [],
}

export const notificationsStore = create(persist(
  redux(reducer, initialState),
  {
    name: 'notifications-store',
    storage: {
      getItem: async (name) => {
        const value = await AsyncStorage.getItem(name)
        return value ? JSON.parse(value) : null
      },
      setItem: async (name, value) => {
        await AsyncStorage.setItem(name, JSON.stringify(value))
      },
      removeItem: async (name) => {
        await AsyncStorage.removeItem(name)
      },
    },
  }
))