import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import Tabbar from './bottomTab';
import AuthScreen from '../../screens/AuthScreen';
import OtpMail from '../../screens/AuthScreen/OtpMail';
import { login } from '../../redux/slices/authSlice';

const Stack = createStackNavigator();

const LoginStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'white' },
        }}
    >
        <Stack.Screen name="AuthScreen" component={AuthScreen} />
        <Stack.Screen name="OtpMail" component={OtpMail} />
        <Stack.Screen name="Tabbar" component={Tabbar} />
    </Stack.Navigator>
);

const HomeStack = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: 'white' },
        }}
    >
        <Stack.Screen name="Tabbar" component={Tabbar} />
    </Stack.Navigator>
);

const AppNavigationContainer = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const isAuthenticated = useSelector((state: RootState) => state.auth.token !== null);

    useEffect(() => {
        const checkToken = async () => {
            const savedToken = await AsyncStorage.getItem('token');
            if (savedToken) {
                dispatch(login.fulfilled({ token: savedToken, user: null }));
            }
            setIsLoading(false);
        };
        checkToken();
    }, [dispatch]);

    if (isLoading) {
        return null; // Yüklenme durumunda boş bir ekran dönebilir
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {isAuthenticated ? (
                    <Stack.Screen name="Home" component={HomeStack} />
                ) : (
                    <Stack.Screen name="AuthScreen" component={LoginStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigationContainer;
