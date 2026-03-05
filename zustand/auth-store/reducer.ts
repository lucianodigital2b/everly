import { Types } from './types';
import { initialState } from './initialState';

const reducer = (state: any, { type, payload }: any) => {
  switch (type) {
    case Types.AUTH_CHANGE_FIELDS:

      console.log(payload);
      
      return {
        ...state,
        fields: {
          ...state.fields,
          [payload.key]: payload.value
        }
      }
    case Types.AUTH_CHANGE_REGISTER_FIELDS:
      return {
        ...state,
        registerFields: {
          ...state.registerFields,
          [payload.key]: payload.value
        }
      }
    case Types.AUTH_LOGIN_REQUEST:
      return {
        ...state,
        isLoading: true,
      }

    case Types.AUTH_LOGIN_FULFILLED:
      return {
        ...state,
        isLoading: false,
        data: payload,
        errors: null
      }

    case Types.AUTH_LOGIN_REJECTED:
      return {
        ...state,
        isLoading: false,
      }

    case Types.AUTH_REGISTER_REQUEST:
      return {
        ...state,
        isCreating: true,
      }

    case Types.AUTH_REGISTER_FULFILLED:
      return {
        ...state,
        isCreating: false,
        data: payload,
        errors: null
      }

    case Types.AUTH_REGISTER_REJECTED:
      return {
        ...state,
        isCreating: false,
      }
    case Types.AUTH_SET_ERRORS:
      return {
        ...state,
        errors: payload
      }

    case Types.AUTH_CLEAR_ERRORS:
      return {
        ...state,
        errors: null
      }

    case Types.AUTH_UPDATE_USER:
      return {
        ...state,
        data: {
          ...state.data,
          user: {
            ...state.data?.user,
            ...payload
          }
        }
      }

    case Types.AUTH_LOGOUT:
      return initialState
    case 'RESET_STATE':
      return initialState;
  }


}

export default reducer;