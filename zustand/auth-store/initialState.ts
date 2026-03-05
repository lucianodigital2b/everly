import { State } from './interfaces';

export const initialState: State = {
  fields: {
    email: '',
    password: '',
  },
  registerFields: {
    name: 'test',
    email: 'test@hotmail.com',
    password: 'merceloki',
    password_confirmation: 'merceloki'
  },
  isLoading: false,
  isCreating: false,
  data: {
    token: null
  },
  errors: null,
};