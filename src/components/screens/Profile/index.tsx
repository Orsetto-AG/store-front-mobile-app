import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Profile = () => {
    const dispatch = useDispatch();

    const handleLogout = async () => {
        // Token'ı temizle
        await AsyncStorage.removeItem('token');
        // Redux state'den çıkış işlemi
        dispatch(logout());
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Profile</Text>
            <Button title="Çıkış Yap" onPress={handleLogout} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#007bff',
    },
});

export default Profile;
