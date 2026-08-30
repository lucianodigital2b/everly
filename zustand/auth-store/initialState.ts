import { State } from './interfaces';

export const initialState: State = {
  isLoading: false,
  data: {
    token: null
  },
  errors: null,
};
