import { State } from './interfaces';

export const initialState: State = {
  fields: {
    email: '',
    password: '',
  },
  registerFields: {
    name: '',
    email: '',
    password: '',
    password_confirmation: ''
  },
  isLoading: false,
  isCreating: false,
  data: {
    token: null
  },
  errors: null,
};