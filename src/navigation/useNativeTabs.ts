import Constants, { ExecutionEnvironment } from "expo-constants";

/** NativeTabs требует dev build + screens 4.25+. В Expo Go — JS Tabs. */
export function canUseNativeTabs(): boolean {
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}
