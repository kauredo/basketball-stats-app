// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

// Mock expo-audio
jest.mock("expo-audio", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({
        sound: {
          playAsync: jest.fn(),
          unloadAsync: jest.fn(),
          setVolumeAsync: jest.fn(),
        },
        status: { isLoaded: true },
      }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock expo-secure-store
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-notifications
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: "mock-token" }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  addNotificationResponseReceivedListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));

// Mock expo-device
jest.mock("expo-device", () => ({
  isDevice: true,
  deviceType: 1,
  DeviceType: {
    UNKNOWN: 0,
    PHONE: 1,
    TABLET: 2,
    DESKTOP: 3,
    TV: 4,
  },
}));

// Mock expo-linking
jest.mock("expo-linking", () => ({
  openURL: jest.fn(),
  createURL: jest.fn((path) => `exp://localhost/${path}`),
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  documentDirectory: "/mock/documents/",
  cacheDirectory: "/mock/cache/",
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: false }),
}));

// Mock expo-sharing
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn(),
}));

// Mock expo-image-picker
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: true,
    assets: null,
  }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const View = require("react-native/Libraries/Components/View/View");
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn(),
    Directions: {},
    GestureHandlerRootView: View,
  };
});

// Mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const View = require("react-native/Libraries/Components/View/View");
  return {
    default: {
      createAnimatedComponent: () => View,
      call: () => {},
      Value: jest.fn(),
      event: jest.fn(),
      add: jest.fn(),
      eq: jest.fn(),
      set: jest.fn(),
      cond: jest.fn(),
      interpolate: jest.fn(),
      View: View,
      Extrapolate: { CLAMP: jest.fn() },
      Transition: {
        Together: "Together",
        Out: "Out",
        In: "In",
      },
      Easing: {
        linear: jest.fn(),
        ease: jest.fn(),
        quad: jest.fn(),
        cubic: jest.fn(),
      },
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withSequence: jest.fn(),
    withDelay: jest.fn((_, animation) => animation),
    runOnJS: jest.fn((fn) => fn),
    FadeIn: { duration: jest.fn(() => ({})) },
    FadeOut: { duration: jest.fn(() => ({})) },
    SlideInRight: { duration: jest.fn(() => ({})) },
    SlideOutLeft: { duration: jest.fn(() => ({})) },
    Keyframe: jest.fn(),
  };
});

// Mock @react-navigation/native
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
  useIsFocused: () => true,
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Convex
jest.mock("convex/react", () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
  useAction: jest.fn(() => jest.fn()),
  useConvex: jest.fn(),
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("Animated:") || args[0].includes("ReactNative") || args[0].includes("expo-"))
  ) {
    return;
  }
  originalWarn(...args);
};
