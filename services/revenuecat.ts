export const revenueCat = {
  initialize: async () => {
    console.log('RevenueCat initialized');
  },
  getOfferings: async () => {
    return [];
  },
  purchasePackage: async (pkg: any) => {
    console.log('Purchase package', pkg);
    return true;
  },
};
