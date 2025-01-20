import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp } from '../../../redux/slices/authSlice.ts';
import { RootState } from '../../../redux/store';
import { useNavigation } from '@react-navigation/native';

const OtpMail = () => {
    const dispatch = useDispatch<any>();
    const navigation = useNavigation();
    const { loading, error, pendingEmail } = useSelector((state: RootState) => state.auth);

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        if (!pendingEmail) {
            navigation.navigate('Auth' as never);
        } else {
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        }
    }, [pendingEmail]);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length <= 1) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value !== '' && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && index > 0 && otp[index] === '') {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            Alert.alert('Error', 'Please enter the complete verification code');
            return;
        }
        console.log('OTP',otpString)
        if (!pendingEmail) {
            Alert.alert('Error', 'Email information is missing');
            return;
        }

        try {
            const resultAction = await dispatch(
                verifyOtp({
                    emailId: pendingEmail,
                    otp: otpString,
                })
            );

            if (verifyOtp.fulfilled.match(resultAction)) {
                // Başarılı doğrulama sonrası Tabbar'a yönlendir
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Tabbar' as never }],
                });
            } else if (verifyOtp.rejected.match(resultAction)) {
                Alert.alert('Verification Failed', resultAction.payload as string);
            }
        } catch (err) {
            console.error('Verification Error:', err);
            Alert.alert('Error', 'An unexpected error occurred');
        }
    };

    const handleChangeEmail = () => {
        navigation.navigate('Auth' as never);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../../../images/emails.png')}
                    style={styles.icon}
                />

                <Text style={styles.title}>Verify Your Email Address</Text>
                <Text style={styles.description}>
                    Please enter the verification code we sent to your email address
                </Text>

                <View style={styles.otpContainer}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[
                                styles.otpInput,
                                digit ? styles.otpInputFilled : null,
                            ]}
                            value={digit}
                            onChangeText={(value) => handleOtpChange(value, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={1}
                            autoFocus={index === 0}
                        />
                    ))}
                </View>

                <View style={styles.emailChangeContainer}>
                    <Text style={styles.emailChangeText}> </Text>
                    <TouchableOpacity onPress={handleChangeEmail}>
                        <Text style={styles.changeLink}></Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#FF6200" style={styles.loader} />
                ) : (
                    <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
                        <Text style={styles.verifyButtonText}>Verify Email</Text>
                    </TouchableOpacity>
                )}

                {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#000',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    icon: {
        width: 80,
        height: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    otpInput: {
        width: 45,
        height: 45,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginHorizontal: 5,
        textAlign: 'center',
        fontSize: 20,
        backgroundColor: '#F5F5F5',
    },
    otpInputFilled: {
        backgroundColor: '#fff',
        borderColor: '#FF6200',
    },
    emailChangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    emailChangeText: {
        fontSize: 14,
        color: '#666',
    },
    changeLink: {
        fontSize: 14,
        color: '#FF6200',
        textDecorationLine: 'underline',
    },
    verifyButton: {
        backgroundColor: '#FF6200',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '100%',
        marginBottom: 15,
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loader: {
        marginVertical: 20,
    },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    },
});

export default OtpMail;
