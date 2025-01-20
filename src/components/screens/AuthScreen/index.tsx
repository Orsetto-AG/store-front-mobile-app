import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login, register } from '../../redux/slices/authSlice';
import { RootState } from '../../redux/store';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const AuthScreen = () => {
    const dispatch = useDispatch<any>();
    const navigation = useNavigation();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const [activeTab, setActiveTab] = useState(0);

    // Login States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');

    // Register States
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [isAcceptedTerms, setIsAcceptedTerms] = useState(false);
    const [signUpEmailError, setSignUpEmailError] = useState('');

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // Email Validation Function
    const validateEmail = (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    };

    // Get error message from error object
    const getErrorMessage = (error: any): string => {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        if (error?.error?.message) return error.error.message;
        return 'An unexpected error occurred';
    };

    // Login Function
    const handleLogin = async () => {
        setEmailError('');

        if (!email || !password) {
            setEmailError('Email and password are required.');
            return;
        }

        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address.');
            return;
        }

        try {
            const resultAction = await dispatch(login({ emailId: email, password }));
            console.log('Login Response:', resultAction);

            if (resultAction.type === 'auth/login/fulfilled') {
                navigation.navigate('Tabbar' as never);
            } else {
                const errorMessage = getErrorMessage(resultAction.payload);
                Alert.alert('Login Failed', errorMessage);
            }
        } catch (err: any) {
            console.error('Login Error:', err);
            Alert.alert(
                'Login Error',
                getErrorMessage(err)
            );
        }
    };

    // Register Function
    const handleRegister = async () => {
        setSignUpEmailError('');

        if (!signUpEmail || !signUpPassword) {
            setSignUpEmailError('Email and password are required.');
            return;
        }

        if (!validateEmail(signUpEmail)) {
            setSignUpEmailError('Please enter a valid email address.');
            return;
        }

        if (!isAcceptedTerms) {
            setSignUpEmailError('Please accept the terms and conditions.');
            return;
        }

        try {
            const resultAction = await dispatch(
                register({
                    emailId: signUpEmail,
                    password: signUpPassword,
                    isAcceptedTermAndConditions: isAcceptedTerms,
                })
            );

            if (register.fulfilled.match(resultAction)) {
                navigation.navigate('OtpMail' as never);
            } else {
                const errorMessage = getErrorMessage(resultAction.payload);
                Alert.alert('Registration Failed', errorMessage);
                navigation.navigate('OtpMail' as never);
            }
        } catch (err: any) {
            console.error('Register Error:', err);
            navigation.navigate('OtpMail' as never);
            Alert.alert(
                'Registration Error',
                getErrorMessage(err)
            );
        }
    };

    return (
        <View style={styles.container}>
            {/* Tab Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setActiveTab(0)} style={styles.tabContainer}>
                    <Text style={[styles.tab, activeTab === 0 && styles.activeTab]}>Login</Text>
                    {activeTab === 0 && <View style={styles.activeLine} />}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab(1)} style={styles.tabContainer}>
                    <Text style={[styles.tab, activeTab === 1 && styles.activeTab]}>Sign Up</Text>
                    {activeTab === 1 && <View style={styles.activeLine} />}
                </TouchableOpacity>
            </View>

            {/* Content */}
            {activeTab === 0 ? (
                // Login Screen
                <View style={styles.page}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            placeholder="Email address"
                            placeholderTextColor="#ccc"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            value={email}
                            onChangeText={(value) => {
                                setEmail(value);
                                setEmailError('');
                            }}
                        />
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                    </View>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#ccc"
                            secureTextEntry={!isPasswordVisible}
                            style={[styles.input, styles.passwordInput]}
                            value={password}
                            onChangeText={(value) => setPassword(value)}
                        />
                        <TouchableOpacity
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            style={styles.eyeButton}
                        >
                            <Image
                                source={
                                    isPasswordVisible
                                        ? require('../../images/view.png')
                                        : require('../../images/hide.png')
                                }
                                style={styles.eyeIcon}
                            />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.errorText}>I forgot my password</Text>
                    {loading && <ActivityIndicator size="large" color="#FF6200" />}
                  {/*  {error && <Text style={styles.errorText}>{getErrorMessage(error)}</Text>}*/}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // Sign Up Screen
                <View style={styles.page}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            placeholder="Email address"
                            placeholderTextColor="#ccc"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            value={signUpEmail}
                            onChangeText={(value) => {
                                setSignUpEmail(value);
                                setSignUpEmailError('');
                            }}
                        />
                        {signUpEmailError ? (
                            <Text style={styles.errorText}>{signUpEmailError}</Text>
                        ) : null}
                    </View>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder="Password"
                            placeholderTextColor="#ccc"
                            secureTextEntry={!isPasswordVisible}
                            style={[styles.input, styles.passwordInput]}
                            value={signUpPassword}
                            onChangeText={(value) => setSignUpPassword(value)}
                        />
                        <TouchableOpacity
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                            style={styles.eyeButton}
                        >
                            <Image
                                source={
                                    isPasswordVisible
                                        ? require('../../images/view.png')
                                        : require('../../images/hide.png')
                                }
                                style={styles.eyeIcon}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.termsContainer}>
                        <TouchableOpacity
                            onPress={() => setIsAcceptedTerms(!isAcceptedTerms)}
                            style={styles.checkbox}
                        >
                            <View
                                style={[
                                    styles.checkboxInner,
                                    isAcceptedTerms && styles.checkboxChecked,
                                ]}
                            />
                        </TouchableOpacity>
                        <Text style={styles.termsText}>I accept the terms and conditions</Text>
                    </View>
                    {loading && <ActivityIndicator size="large" color="#FF6200" />}
                    {error && <Text style={styles.errorText}>{getErrorMessage(error)}</Text>}
                    <TouchableOpacity
                        style={[styles.button, loading && styles.disabledButton]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>Sign up</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 20,
    },
    tabContainer: {
        flex: 1,
        alignItems: 'center',
    },
    tab: {
        fontSize: 18,
        fontWeight: '600',
        color: '#888',
        paddingVertical: 10,
        textAlign: 'center',
    },
    activeTab: {
        color: '#FF6200',
    },
    activeLine: {
        height: 4,
        backgroundColor: '#FF6200',
        width: '100%',
        borderRadius: 2,
        marginTop: 5,
        alignSelf: 'center',
    },
    page: {
        padding: 20,
    },
    inputContainer: {
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#000',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 'auto',
        fontWeight: 'bold'
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 10,
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeButton: {
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: [{ translateY: -12 }],
    },
    eyeIcon: {
        width: 24,
        height: 24,
        tintColor: '#888',
    },
    button: {
        backgroundColor: '#FF6200',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    disabledButton: {
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    checkboxInner: {
        width: 12,
        height: 12,
        backgroundColor: 'transparent',
        borderRadius: 2,
    },
    checkboxChecked: {
        backgroundColor: '#FF6200',
    },
    termsText: {
        fontSize: 14,
        color: '#444',
    },
});

export default AuthScreen;
