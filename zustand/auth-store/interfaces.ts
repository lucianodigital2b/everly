export interface State {
  isLoading: boolean;
  data: any;
  errors: Record<string, string[]> | null;
}
