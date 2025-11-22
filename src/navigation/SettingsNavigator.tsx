import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SettingsScreen from '../screens/SettingsScreen';
import ManageAccountScreen from '../screens/ManageAccountScreen';
import ChangeEmailScreen from '../screens/ChangeEmailScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import PhoneNumberScreen from '../screens/PhoneNumberScreen';
import DownloadDataScreen from '../screens/DownloadDataScreen';
import DeactivateAccountScreen from '../screens/DeactivateAccountScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';

export type SettingsStackParamList = {
  Settings: undefined;
  ManageAccount: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  PhoneNumber: undefined;
  DownloadData: undefined;
  DeactivateAccount: undefined;
  DeleteAccount: undefined;
};

const Stack = createNativeStackNavigator<SettingsStackParamList>();

export default function SettingsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#020202',
        },
        headerTintColor: '#F9FAFB',
        headerTitleStyle: {
          fontWeight: '700',
        },
        contentStyle: {
          backgroundColor: '#020202',
        },
      }}
    >
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ManageAccount"
        component={ManageAccountScreen}
        options={{
          title: 'Manage Account',
        }}
      />
      <Stack.Screen
        name="ChangeEmail"
        component={ChangeEmailScreen}
        options={{
          title: 'Change Email',
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          title: 'Change Password',
        }}
      />
      <Stack.Screen
        name="PhoneNumber"
        component={PhoneNumberScreen}
        options={{
          title: 'Phone Number',
        }}
      />
      <Stack.Screen
        name="DownloadData"
        component={DownloadDataScreen}
        options={{
          title: 'Download My Data',
        }}
      />
      <Stack.Screen
        name="DeactivateAccount"
        component={DeactivateAccountScreen}
        options={{
          title: 'Deactivate Account',
        }}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{
          title: 'Delete Account',
        }}
      />
    </Stack.Navigator>
  );
}

