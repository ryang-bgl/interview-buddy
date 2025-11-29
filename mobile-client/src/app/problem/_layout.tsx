import React from "react";
import { Stack } from "expo-router";

import BackHeaderButton from "@/components/BackHeaderButton";

export default function ProblemLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: "#1D4ED8",
        headerTitle: "Problem Detail",
        headerLeft: () => <BackHeaderButton />,
        headerStyle: {},
        headerTitleStyle: {
          fontSize: 16,
        },
      }}
    />
  );
}
