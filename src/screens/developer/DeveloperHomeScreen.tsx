import React, { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Platform, View } from "react-native";
import { HeaderButton } from "@react-navigation/elements";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../i18n/I18nProvider";
import { nativeStackGlassScreenOptions } from "../../navigation/glassOptions";
import { CatalogSettingsModal } from "../catalog/CatalogSettingsModal";
import { HeaderCatalogButton } from "../../ui/HeaderCatalogButton";
import { registerForPushAndSyncToken } from "../../push/register";
import { useAppTheme } from "../../theme/AppThemeProvider";
import { DeveloperFloorsScreen } from "./DeveloperFloorsScreen";
import { DeveloperFloorEditorScreen } from "./DeveloperFloorEditorScreen";
import { DeveloperLeadsScreen } from "./DeveloperLeadsScreen";
import { DeveloperProfileScreen } from "./DeveloperProfileScreen";
import { DeveloperProjectEditorScreen } from "./DeveloperProjectEditorScreen";
import { DeveloperProjectProgressScreen } from "./DeveloperProjectProgressScreen";
import { DeveloperProjectsScreen } from "./DeveloperProjectsScreen";
import { DeveloperSubscriptionsScreen } from "./DeveloperSubscriptionsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const TabStack = createNativeStackNavigator();

type TabStackProps = {
  component: React.ComponentType;
  title: string;
  onOpenSettings: () => void;
};

function DeveloperTabStack({ component: Screen, title, onOpenSettings }: TabStackProps) {
  const { t } = useI18n();
  const { colors: c, resolvedMode } = useAppTheme();

  return (
    <TabStack.Navigator screenOptions={nativeStackGlassScreenOptions(c, resolvedMode)}>
      <TabStack.Screen
        name="Main"
        component={Screen}
        options={{
          title,
          headerLeft: () => <HeaderCatalogButton />,
          headerRight: () => (
            <HeaderButton
              accessibilityLabel={t("catalog.settings")}
              onPress={onOpenSettings}
            >
              <MaterialCommunityIcons name="cog-outline" size={22} color={c.brand} />
            </HeaderButton>
          ),
        }}
      />
    </TabStack.Navigator>
  );
}

function DeveloperTabs() {
  const { t } = useI18n();
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const icons = useMemo(
    () => ({
      Projects: "office-building-outline",
      Floors: "layers-outline",
      Leads: "clipboard-text-outline",
      Subscriptions: "credit-card-outline",
      Profile: "account-outline",
    }),
    [],
  );

  const openSettings = () => setSettingsOpen(true);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          sceneContainerStyle: { backgroundColor: c.bg },
          tabBarActiveTintColor: c.brand,
          tabBarInactiveTintColor: c.labelSecondary,
          tabBarStyle: {
            borderTopColor: c.separator,
            backgroundColor: c.bgElevated,
            paddingHorizontal: 10,
            paddingTop: 4,
            paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 8,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
            paddingHorizontal: 2,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
            marginTop: -2,
          },
          tabBarIconStyle: { marginTop: 2 },
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name={
                (icons as Record<string, ComponentProps<typeof MaterialCommunityIcons>["name"]>)[
                  route.name
                ] ?? "account"
              }
              color={color}
              size={Math.min(22, size - 2)}
            />
          ),
        })}
      >
        <Tab.Screen name="Projects">
          {() => (
            <DeveloperTabStack
              component={DeveloperProjectsScreen}
              title={t("developer.projects") ?? "Projects"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Floors">
          {() => (
            <DeveloperTabStack
              component={DeveloperFloorsScreen}
              title={t("developer.floors") ?? "Floors"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Leads">
          {() => (
            <DeveloperTabStack
              component={DeveloperLeadsScreen}
              title={t("developer.leads") ?? "Leads"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Subscriptions">
          {() => (
            <DeveloperTabStack
              component={DeveloperSubscriptionsScreen}
              title={t("developer.subscriptions") ?? "Subscriptions"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {() => (
            <DeveloperTabStack
              component={DeveloperProfileScreen}
              title={t("developer.profile") ?? "Profile"}
              onOpenSettings={openSettings}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
      <CatalogSettingsModal
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        showCabinetEntry={false}
      />
    </View>
  );
}

export function DeveloperHomeScreen() {
  const { t } = useI18n();
  const { colors: c, resolvedMode } = useAppTheme();

  useEffect(() => {
    void registerForPushAndSyncToken();
  }, []);

  return (
    <Stack.Navigator screenOptions={nativeStackGlassScreenOptions(c, resolvedMode)}>
      <Stack.Screen
        name="DeveloperTabs"
        component={DeveloperTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DeveloperProjectEditor"
        component={DeveloperProjectEditorScreen}
        options={{ title: t("developer.projectEditorTitle") }}
      />
      <Stack.Screen
        name="DeveloperFloorEditor"
        component={DeveloperFloorEditorScreen}
        options={{ title: t("developer.floors") }}
      />
      <Stack.Screen
        name="DeveloperProjectProgress"
        component={DeveloperProjectProgressScreen}
        options={{ title: t("developer.progressTitle") }}
      />
    </Stack.Navigator>
  );
}
