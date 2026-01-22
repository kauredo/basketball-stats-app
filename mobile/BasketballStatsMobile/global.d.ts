// Type declarations for React Native global object
declare const global: {
  ErrorUtils?: {
    getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
    setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
  };
};
