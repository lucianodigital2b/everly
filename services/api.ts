export const api = {
  getEvents: async () => {
    // Mock API call
    return [];
  },
  createEvent: async (data: any) => {
    // Mock API call
    return { id: '123', ...data };
  },
  getEventDetails: async (id: string) => {
    // Mock API call
    return {};
  },
};
