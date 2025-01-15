import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import Tabbar from './bottomTab';
import {navigationRef} from './navigationServices';

const Stack = createStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: {backgroundColor: 'white'},
      }}>
      <Stack.Screen name="Tabbar" component={Tabbar} />
    </Stack.Navigator>
  );
};

const AppNavigationContainer = () => {
  return (
    <NavigationContainer ref={navigationRef}>
      <HomeStack />
    </NavigationContainer>
  );
};

export default AppNavigationContainer;
