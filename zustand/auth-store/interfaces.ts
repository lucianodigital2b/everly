export interface AuthFields {
  email: string;
  password: string;
}

export interface RegisterFields {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface State {
  fields: AuthFields;
  registerFields: RegisterFields;
  isLoading: boolean;
  isCreating: boolean;
  data: any;
  errors: Record<string, string[]> | null;
}