import { State } from './interfaces';
import {create} from 'zustand'
import { createJSONStorage, persist, redux } from "zustand/middleware"
import reducer from './reducer'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialState } from './initialState';

export const authStore = create(persist(
  redux(reducer, initialState),
  {
    name: 'auth-store',
    storage: createJSONStorage(() => AsyncStorage)
  }
))