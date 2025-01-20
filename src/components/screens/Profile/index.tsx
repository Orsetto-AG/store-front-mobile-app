import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    const handleLogout = async () => {
        // Token'ı AsyncStorage'dan temizler
        await AsyncStorage.removeItem('token');

        // Redux state'i sıfırlar
        dispatch(logout());

        // Kullanıcıyı LoginStack'e yönlendirir
        navigation.reset({
            index: 0,
            routes: [{ name: 'LoginStack' }],
        });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Profile</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    logoutButton: {
        backgroundColor: '#FF6200',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Profile;
