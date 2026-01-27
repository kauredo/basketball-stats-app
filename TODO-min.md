# TODO-min

This is a minimum, user-managed TODO. As an agent, you should read this file, and update TODO.md with a more detailed version of these TODOs. The user will read TODO.md.

## Examples

### Example (Unfinished)

- [ ] Add push notifications to the app

### Example (Finished)

- [x] Add push notifications to the app

## TODO

- [ ] Cleanup TODO.md TODOs
- [ ] Mobile app game export button and modal have very weird styling
- [ ] ERROR in mobile app:

```
expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53. Use a development build instead of Expo Go. Read more at https://docs.expo.dev/develop/development-builds/introduction/.
 WARN  `expo-notifications` functionality is not fully supported in Expo Go:
We recommend you instead use a development build to avoid limitations. Learn more: https://expo.fyi/dev-client.
 WARN  Unauthorized error detected in ErrorBoundary, clearing credentials...
 WARN  `removeNotificationSubscription` is deprecated. Call `subscription.remove()` instead.
 WARN  `removeNotificationSubscription` is deprecated. Call `subscription.remove()` instead.
Error: ENOENT: no such file or directory, open '/Users/pixelmatters/code/personal/basketball-stats-app/mobile/convex/games.ts'
    at Object.readFileSync (node:fs:442:20)
    at getCodeFrame (/Users/pixelmatters/code/personal/basketball-stats-app/node_modules/metro/src/Server.js:997:18)
    at Server._symbolicate (/Users/pixelmatters/code/personal/basketball-stats-app/node_modules/metro/src/Server.js:1079:22)
    at processTicksAndRejections (node:internal/process/task_queues:105:5)
    at Server._processRequest (/Users/pixelmatters/code/personal/basketball-stats-app/node_modules/metro/src/Server.js:460:7) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/pixelmatters/code/personal/basketball-stats-app/mobile/convex/games.ts'
}
 ERROR  Warning: Error: [CONVEX Q(games:list)] [Request ID: 38878f20cc929195] Server Error
Uncaught Error: Unauthorized

  31 |
  32 | export default function HomeScreen() {
> 33 |   const navigation = useNavigation<HomeScreenNavigationProp>();
     |                                   ^
  34 |   const { token, selectedLeague } = useAuth();
  35 |   const [refreshing, setRefreshing] = React.useState(false);
  36 |

Call Stack
  handler (mobile/convex/games.ts:26:44)
  HomeScreen (mobile/BasketballStatsMobile/src/screens/HomeScreen.tsx:33:35)
  RNSScreenContainer (<anonymous>)
  TabNavigator (mobile/BasketballStatsMobile/src/navigation/AppNavigator.tsx:74:37)
  ScreenContentWrapper (<anonymous>)
  RNSScreenStack (<anonymous>)
  RNCSafeAreaProvider (<anonymous>)
  AppContent (mobile/BasketballStatsMobile/src/navigation/AppNavigator.tsx:192:65)
  AppNavigator (<anonymous>)
  NotificationProvider (mobile/BasketballStatsMobile/src/contexts/NotificationContext.tsx:80:48)
  DeepLinkProvider (mobile/BasketballStatsMobile/src/contexts/DeepLinkContext.tsx:50:44)
  AuthProvider (mobile/BasketballStatsMobile/src/contexts/AuthContext.tsx:76:40)
  ThemeProvider (mobile/BasketballStatsMobile/src/contexts/ThemeContext.tsx:27:41)
  constructor (mobile/BasketballStatsMobile/src/components/AuthErrorBoundary.tsx:23:29)
  RNGestureHandlerRootView (<anonymous>)
  App (mobile/BasketballStatsMobile/App.tsx:47:12)
 ERROR  Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.

  43 |
  44 | export default function CreatePlayerScreen() {
> 45 |   const navigation = useNavigation();
     |                                   ^
  46 |   const route = useRoute<RouteProp<CreatePlayerRouteParams, "CreatePlayer">>();
  47 |   const { token, selectedLeague } = useAuth();
  48 |

Call Stack
  CreatePlayerScreen (mobile/BasketballStatsMobile/src/screens/CreatePlayerScreen.tsx:45:35)
  ScreenContentWrapper (<anonymous>)
  RNSScreenStack (<anonymous>)
  RNCSafeAreaProvider (<anonymous>)
  AppContent (mobile/BasketballStatsMobile/src/navigation/AppNavigator.tsx:192:65)
  AppNavigator (<anonymous>)
  NotificationProvider (mobile/BasketballStatsMobile/src/contexts/NotificationContext.tsx:80:48)
  DeepLinkProvider (mobile/BasketballStatsMobile/src/contexts/DeepLinkContext.tsx:50:44)
  AuthProvider (mobile/BasketballStatsMobile/src/contexts/AuthContext.tsx:76:40)
  ThemeProvider (mobile/BasketballStatsMobile/src/contexts/ThemeContext.tsx:27:41)
  constructor (mobile/BasketballStatsMobile/src/components/AuthErrorBoundary.tsx:23:29)
  RNGestureHandlerRootView (<anonymous>)
  App (mobile/BasketballStatsMobile/App.tsx:47:12)
```

- [ ] Lists with users or teams, or game cards (even scheduled games) should be clickable. This should work across the app, in both web and mobile.
