import React from "react";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Feather>["name"];
  color: string;
}) {
  return <Feather size={26} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const activeColor = isDark ? "#FFFFFF" : "#111827";
  const inactiveColor = isDark ? "#9CA3AF" : "#9CA3AF";
  const backgroundColor = isDark ? "#0B1220" : "#FFFFFF";
  const borderColor = isDark ? "#1F2937" : "#E5E7EB";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor,
          borderTopColor: borderColor,
          height: 100,
          paddingBottom: 12,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
          fontWeight: "600",
        },
        headerShown: true,
        headerStyle: { backgroundColor: "#111827", height: 20 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="solutions"
        options={{
          title: "DSA",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="book-open" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: "Review",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="refresh-cw" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="flashcards"
        options={{
          title: "Flashcards",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="layers" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
