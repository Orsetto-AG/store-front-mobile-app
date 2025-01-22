import React, { useState } from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Image} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const navigation = useNavigation();

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        try {
            const response = await axios.put(
                'https://api.orsetto.ch/api/customer/forgot-password-link',
                { emailId: email }
            );

            if (response.status === 200) {
                setIsSuccess(true);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
            Alert.alert('Error', errorMessage);
        }
    };


    if (isSuccess) {
        return (
            <View style={styles.successContainer}>
                <Image
                    source={require('../../../images/send.png')}
                    style={styles.sendMail}
                />
                <Text style={styles.successHeader}>Password Reset Complete</Text>
                <Text style={styles.successMessage}>
                    Please check your email address.
                </Text>
                <TouchableOpacity
                    style={styles.signInButton}
                    onPress={() => navigation.navigate('AuthScreen')}
                >
                    <Text style={styles.signInText}>Sign in</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.header}>Forgot Password</Text>
            <TextInput
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholderTextColor="#ccc"
            />
            <TouchableOpacity style={styles.resetButton} onPress={handleForgotPassword}>
                <Text style={styles.resetButtonText}>Reset Password</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        padding: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#FF6200',
        fontWeight: 'bold'
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
        marginTop: 80,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        fontSize: 16,
        color: '#000',
    },
    sendMail: {
        width: 130,
        height: 130,
        marginRight: 'auto',
        marginLeft: 'auto',
        marginBottom: 30
    },
    resetButton: {
        backgroundColor: '#FF6200', // Yeni turuncu renk
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    successContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
        marginBottom: 10,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: 16,
        textAlign: 'center',
        color: '#333',
        marginBottom: 20,
    },
    signInButton: {
        backgroundColor: '#FF6200', // Yeni turuncu renk
        borderRadius: 8,
        paddingVertical: 15,
        paddingHorizontal: 40,
    },
    signInText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ForgotPassword;
