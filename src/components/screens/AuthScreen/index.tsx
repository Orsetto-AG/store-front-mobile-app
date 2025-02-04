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

// Parola kurallarını kontrol eden örnek fonksiyon
const checkPasswordRequirements = (password: string) => {
    const lengthRequirement = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);

    // Kaç kuralın sağlandığını hesaplayalım:
    const requirementsMetCount = [
        lengthRequirement,
        hasNumber && hasSpecial,
        hasUpper,
        hasLower,
    ].filter(Boolean).length;

    let level = 'Sehr Schwach';
    if (requirementsMetCount === 1) level = 'Schwach';
    if (requirementsMetCount === 2) level = 'Mittel';
    if (requirementsMetCount === 3) level = 'Stark';
    if (requirementsMetCount === 4) level = 'Sehr Stark';

    return {
        lengthRequirement,
        hasNumber,
        hasSpecial,
        hasUpper,
        hasLower,
        requirementsMetCount,
        level,
    };
};

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

    // Parola görünürlüğü
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
            setEmailError('E-Mail und Passwort sind erforderlich.');
            return;
        }
        if (!validateEmail(email)) {
            setEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            return;
        }

        try {
            const resultAction = await dispatch(login({ emailId: email, password }));
            if (resultAction.type === 'auth/login/fulfilled') {
                navigation.navigate('Tabbar' as never);
            } else {
                const errorMessage = getErrorMessage(resultAction.payload);
                Alert.alert('Login Fehlgeschlagen', errorMessage);
            }
        } catch (err: any) {
            Alert.alert('Login Error', getErrorMessage(err));
        }
    };

    // Register Function
    const handleRegister = async () => {
        setSignUpEmailError('');

        if (!signUpEmail || !signUpPassword) {
            setSignUpEmailError('E-Mail und Passwort sind erforderlich.');
            return;
        }
        if (!validateEmail(signUpEmail)) {
            setSignUpEmailError('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            return;
        }
        // Şifre gereksinimleri karşılanıyor mu?
        const {
            lengthRequirement,
            hasNumber,
            hasSpecial,
            hasUpper,
            hasLower,
        } = checkPasswordRequirements(signUpPassword);

        const allMet =
            lengthRequirement && hasNumber && hasSpecial && hasUpper && hasLower;
        if (!allMet) {
            setSignUpEmailError('Bitte beachten Sie die Passwortanforderungen unten.');
            return;
        }

        if (!isAcceptedTerms) {
            setSignUpEmailError('Bitte akzeptieren Sie die AGB.');
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
                // Alert.alert('Registration Failed', errorMessage);
            }
        } catch (err: any) {
            Alert.alert('Registrierungsfehler', getErrorMessage(err));
        }
    };

    // Şifre kurallarını her karakter girilişinde kontrol edelim
    const passwordCheck = checkPasswordRequirements(signUpPassword);

    // "Registrieren" butonu disable mı?
    const canRegister =
        !loading &&
        passwordCheck.lengthRequirement &&
        passwordCheck.hasNumber &&
        passwordCheck.hasSpecial &&
        passwordCheck.hasUpper &&
        passwordCheck.hasLower &&
        isAcceptedTerms;

    return (
        <View style={styles.container}>
            {/* Markamız */}
            <Text style={styles.brandName}>Orsetto</Text>

            {/* Tablar (Anmelden / Registrieren) */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => setActiveTab(0)}
                >
                    <Text style={[styles.tabText, activeTab === 0 && styles.activeTabText]}>
                        Anmelden
                    </Text>
                    {activeTab === 0 && <View style={styles.activeLine} />}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.tabButton}
                    onPress={() => setActiveTab(1)}
                >
                    <Text style={[styles.tabText, activeTab === 1 && styles.activeTabText]}>
                        Registrieren
                    </Text>
                    {activeTab === 1 && <View style={styles.activeLine} />}
                </TouchableOpacity>
            </View>

            {activeTab === 0 ? (
                // ------------------ LOGIN SCREEN (Anmelden) ----------------------
                <View style={styles.loginCard}>
                    <Text style={styles.loginTitle}>Anmelden</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>E-Mail</Text>
                        <TextInput
                            placeholder="z.B. user@example.com"
                            placeholderTextColor="#999"
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

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Passwort</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="********"
                                placeholderTextColor="#999"
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
                    </View>

                    {loading && <ActivityIndicator size="large" color="#FF6200" style={{ marginVertical: 10 }} />}

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.loginButtonText}>Anmelden</Text>
                    </TouchableOpacity>

                    <View style={styles.bottomLinksContainer}>
                        <Text style={styles.bottomText}>
                            Sie haben noch kein Konto?{' '}
                            <Text
                                style={styles.registerLink}
                                onPress={() => setActiveTab(1)}
                            >
                                Registrieren
                            </Text>
                        </Text>

                        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                            <Text style={styles.forgotPasswordLink}>Passwort vergessen?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                // ------------------ SIGN UP SCREEN (Konto erstellen) ----------------------
                <View style={styles.registerCard}>
                    <Text style={styles.loginTitle}>Konto erstellen</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>E-Mail</Text>
                        <TextInput
                            placeholder="z.B. user@example.com"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.input}
                            value={signUpEmail}
                            onChangeText={(value) => {
                                setSignUpEmail(value);
                                setSignUpEmailError('');
                            }}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Passwort</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="********"
                                placeholderTextColor="#999"
                                secureTextEntry={!isPasswordVisible}
                                style={[styles.input, styles.passwordInput]}
                                value={signUpPassword}
                                onChangeText={(value) => {
                                    setSignUpPassword(value);
                                    setSignUpEmailError('');
                                }}
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
                    </View>

                    {/* Parola Gücü ve Kurallar Kartı */}
                    {!!signUpPassword && (
                        <View style={styles.passwordRulesCard}>
                            <Text style={styles.levelText}>
                                Niveau: {passwordCheck.level}
                            </Text>
                            <View style={styles.strengthBarContainer}>
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.strengthBar,
                                            index < passwordCheck.requirementsMetCount
                                                ? { backgroundColor: '#FF6200' }
                                                : { backgroundColor: '#ddd' }
                                        ]}
                                    />
                                ))}
                            </View>

                            <View style={{ marginTop: 10 }}>
                                <Text
                                    style={[
                                        styles.ruleText,
                                        passwordCheck.lengthRequirement
                                            ? styles.ruleTextOK
                                            : styles.ruleTextNotOK
                                    ]}
                                >
                                    ✓ Mindestens 8 Zeichen
                                </Text>
                                <Text
                                    style={[
                                        styles.ruleText,
                                        (passwordCheck.hasNumber && passwordCheck.hasSpecial)
                                            ? styles.ruleTextOK
                                            : styles.ruleTextNotOK
                                    ]}
                                >
                                    ✓ Mindestens eine Zahl und ein Sonderzeichen
                                </Text>
                                <Text
                                    style={[
                                        styles.ruleText,
                                        passwordCheck.hasUpper
                                            ? styles.ruleTextOK
                                            : styles.ruleTextNotOK
                                    ]}
                                >
                                    ✓ Mindestens ein Großbuchstabe
                                </Text>
                                <Text
                                    style={[
                                        styles.ruleText,
                                        passwordCheck.hasLower
                                            ? styles.ruleTextOK
                                            : styles.ruleTextNotOK
                                    ]}
                                >
                                    ✓ Mindestens ein Kleinbuchstabe
                                </Text>
                            </View>
                        </View>
                    )}

                    {signUpEmailError ? (
                        <Text style={styles.errorText}>{signUpEmailError}</Text>
                    ) : null}

                    {/* AGB checkbox */}
                    <View style={styles.agbContainer}>
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
                        <Text style={styles.agbText}>
                            Ich erkläre, die{' '}
                            <Text style={styles.linkText}>AGB</Text> akzeptiert und die{' '}
                            <Text style={styles.linkText}>Datenschutzerklärung</Text> von Orsetto
                            zur Kenntnis genommen zu haben.
                        </Text>
                    </View>

                    {signUpEmailError ? (
                        <Text style={styles.errorText}>{signUpEmailError}</Text>
                    ) : null}

                    {loading && <ActivityIndicator size="large" color="#FF6200" style={{ marginVertical: 10 }} />}

                    <TouchableOpacity
                        style={[styles.registerButton, !canRegister && styles.disabledButton]}
                        onPress={handleRegister}
                        disabled={!canRegister}
                    >
                        <Text style={styles.registerButtonText}>Registrieren</Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: 20, alignItems: 'center' }}>
                        <Text style={styles.bottomText}>
                            Sie haben bereits ein Konto?{' '}
                            <Text
                                style={styles.registerLink}
                                onPress={() => setActiveTab(0)}
                            >
                                Anmelden
                            </Text>
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Ana ekran
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingTop: 40,
    },
    brandName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6200',
        marginBottom: 20,
        marginTop: 20
    },

    // Üstteki tab container
    tabContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '90%',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 25,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        position: 'relative',
    },
    tabText: {
        fontSize: 16,
        color: '#888',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#FF6200',
    },
    activeLine: {
        position: 'absolute',
        bottom: -2,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#FF6200',
    },

    // Login/Register kartları
    loginCard: {
        width: '90%',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 20,
    },
    registerCard: {
        width: '90%',
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 20,
    },
    loginTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        alignSelf: 'flex-start',
    },

    // Inputlar
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#000',
        backgroundColor: '#fff',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
        fontWeight: 'bold',
    },
    passwordContainer: {
        position: 'relative',
        width: '100%',
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

    // Login / Register butonları
    loginButton: {
        width: '100%',
        backgroundColor: '#FF6200',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    registerButton: {
        width: '100%',
        backgroundColor: '#FF6200',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledButton: {
        opacity: 0.4,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    // Alt linkler (Login kartında)
    bottomLinksContainer: {
        width: '100%',
        marginTop: 20,
        alignItems: 'center',
    },
    bottomText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    registerLink: {
        fontWeight: 'bold',
        color: '#FF6200',
    },
    forgotPasswordLink: {
        color: '#FF6200',
        fontSize: 14,
        marginTop: 4,
        textDecorationLine: 'underline',
    },

    // Şifre Gücü
    passwordRulesCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginTop: -5,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#eee',
    },
    levelText: {
        fontWeight: '600',
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    strengthBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        marginRight: 4,
    },
    ruleText: {
        fontSize: 14,
        marginBottom: 4,
    },
    ruleTextOK: {
        color: '#009900',
    },
    ruleTextNotOK: {
        color: '#cc0000',
    },

    // AGB Checkbox
    agbContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 10,
        marginBottom: 15,
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
        marginTop: 2,
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
    agbText: {
        flex: 1,
        fontSize: 13,
        color: '#444',
        lineHeight: 18,
    },
    linkText: {
        color: '#FF6200',
        textDecorationLine: 'underline',
    },
});

export default AuthScreen;
