import React from 'react';
import { Stack } from 'expo-router';

import BackHeaderButton from '@/components/BackHeaderButton';

export default function ProblemLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitleVisible: false,
        headerTintColor: '#1D4ED8',
        headerTitle: 'Problem Detail',
        headerLeft: () => <BackHeaderButton />,
        headerStyle: {
          height: 56,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 16,
        },
      }}
    />
  );
}
