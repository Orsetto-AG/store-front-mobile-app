import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Profile = () => {

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Profile</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 'auto',
        textAlign: 'center',
        marginTop: 'auto',
        color: '#007bff',
    },
});

export default Profile;
