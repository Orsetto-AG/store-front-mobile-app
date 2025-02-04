import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    SafeAreaView,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Switch,
    useColorScheme,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import CompleteProfileModal from '../CompleteProfile';
import { logout } from '../../../redux/slices/authSlice.ts';
import { useDispatch } from 'react-redux';

const TABS = {
    KONTO: 0,
    SICHERHEIT: 1,
    PRAEFERENZEN: 2,
    COMPANY: 3, // Sadece isCompany true iken görünecek
};

const languageOptions = [
    { label: 'German (de)', value: 'de' },
    { label: 'English (en)', value: 'en' },
    { label: 'Italian (it)', value: 'it' },
    { label: 'French (fr)', value: 'fr' },
];

const phoneCountryCodes = [
    { label: 'Switzerland (+41)', value: '+41' },
    { label: 'Germany (+49)', value: '+49' },
    { label: 'Italy (+39)', value: '+39' },
    { label: 'United Kingdom (+44)', value: '+44' },
    { label: 'France (+33)', value: '+33' },
];

const AccountDetails = () => {
    const navigation = useNavigation();
    const dispatch = useDispatch();
    const theme = useColorScheme();

    const backgroundColor = theme === 'dark' ? '#222' : '#fff';
    const textColor = theme === 'dark' ? '#fff' : '#000';
    const [activeTab, setActiveTab] = useState(TABS.KONTO);

    // Email & Phone
    const [email, setEmail] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    // Membership Info
    const [username, setUsername] = useState('');
    // Not editable from the UI (read-only):
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');

    // languageCode editable => “Präferenzen” sekmesinde gösterilecek
    const [languageCode, setLanguageCode] = useState('');

    // 2FA toggles
    const [authenticatorAppEnabled, setAuthenticatorAppEnabled] = useState(false);
    const [smsAuthEnabled, setSmsAuthEnabled] = useState(false);

    // Password
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    // Main Address
    const [street, setStreet] = useState('');
    const [streetNumber, setStreetNumber] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [isCompletedAddressVerification, setIsCompletedAddressVerification] = useState(false);
    const [addressError, setAddressError] = useState('');

    // Billing Address
    const [showBilling, setShowBilling] = useState(false);
    const [billingStreet, setBillingStreet] = useState('');
    const [billingStreetNumber, setBillingStreetNumber] = useState('');
    const [billingZipCode, setBillingZipCode] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingCountry, setBillingCountry] = useState('');
    const [billingError, setBillingError] = useState('');

    // Profile incomplete banner
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [phoneOnlyMissing, setPhoneOnlyMissing] = useState(false);

    // Edit & Verify Modal (username, languageCode, email, phone)
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editField, setEditField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [editPassword, setEditPassword] = useState<string>('');
    const [needOtpStep, setNeedOtpStep] = useState(false);
    const [otpValue, setOtpValue] = useState<string>('');
    const [pendingFieldToVerify, setPendingFieldToVerify] = useState<'email' | 'phone' | null>(null);
    const [pendingNewValue, setPendingNewValue] = useState<string>('');

    // For Address OTP
    const [addressOtpSent, setAddressOtpSent] = useState(false);
    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [addressOtp, setAddressOtp] = useState('');

    // For "Complete Phone" Flow
    const [completePhoneModalVisible, setCompletePhoneModalVisible] = useState(false);
    const [completePhoneStep, setCompletePhoneStep] = useState<0 | 1>(0);
    const [tempPhone, setTempPhone] = useState('');
    const [tempPhoneCountryCode, setTempPhoneCountryCode] = useState('+49');
    const [tempOtp, setTempOtp] = useState('');

    const [isModalVisible, setModalVisible] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    // Şirket ile ilgili state
    const [isCompany, setIsCompany] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [isTradeRegistered, setIsTradeRegistered] = useState(false);
    const [tradeRegisteredNumber, setTradeRegisteredNumber] = useState('');
    const [isRegisterOwner, setIsRegisterOwner] = useState(false);
    const [registerPersonName, setRegisterPersonName] = useState('');
    const [registerPersonSurname, setRegisterPersonSurname] = useState('');
    const [registerPersonSex, setRegisterPersonSex] = useState<'male' | 'female' | 'other' | ''>('');

    // Hesap silme onayı
    const confirmDeleteAccount = () => {
        Alert.alert(
            'Konto löschen?',
            'Diese Aktion kann nicht rückgängig gemacht werden. Fortfahren?',
            [
                { text: 'Abbrechen', style: 'cancel' },
                { text: 'Ja, löschen', style: 'destructive', onPress: handleDeleteAccount },
            ],
            { cancelable: true },
        );
    };

    const handleDeleteAccount = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('https://api.orsetto.ch/api/customer/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
            });
            if (!response.ok) {
                throw new Error('Account deletion failed.');
            }
            Alert.alert('Success', 'Your account has been deleted!');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('addressOtpSent');
            dispatch(logout());
            navigation.navigate('AuthScreen');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Kullanıcı verilerini çek
    const fetchUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('https://api.orsetto.ch/api/customer/me', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch user data.');
            }
            const data = await response.json();
            const user = data.data.user;
            setProfileData(user);

            // Şirket bilgileri
            if (user.isCompany) {
                setIsCompany(true);
                setCompanyName(user.companyName || '');
                setIsTradeRegistered(!!user.isTradeRegistered);
                setTradeRegisteredNumber(user.tradeRegisteredNumber || '');
                setIsRegisterOwner(!!user.isRegisterOwner);
                setRegisterPersonName(user.registerPersonName || '');
                setRegisterPersonSurname(user.registerPersonSurname || '');
                setRegisterPersonSex(user.registerPersonSex || '');
            } else {
                setIsCompany(false);
                setCompanyName('');
                setIsTradeRegistered(false);
                setTradeRegisteredNumber('');
                setIsRegisterOwner(false);
                setRegisterPersonName('');
                setRegisterPersonSurname('');
                setRegisterPersonSex('');
            }

            // Email & Phone
            setEmail(user.email || '');
            setIsEmailVerified(!!user.isCompletedEmailOtpVerification);
            setPhoneNumber(user.mobileNo || '');
            setIsPhoneVerified(!!user.isCompletedPhoneOtpVerification);

            // Membership
            setUsername(user.username || '');
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            setBirthday(user.birthday ? moment(user.birthday).format('DD.MM.YYYY') : '');
            setGender(user.gender || '');
            setLanguageCode(user.languageCode || '');

            // 2FA toggles (dummy, gerçek API henüz yoksa bile state olarak saklayabiliriz)
            // Bunu gerçek verilerle doldurmak isterseniz backend yanıtını set edebilirsiniz.
            // Örneğin: setAuthenticatorAppEnabled(!!user.authenticatorAppEnabled);
            // setSmsAuthEnabled(!!user.smsAuthEnabled);

            // Main Address
            setStreet(user.street || '');
            setStreetNumber(user.streetNumber || '');
            setZipCode(user.zipCode || '');
            setCity(user.city || '');
            setCountry(user.country || '');
            setIsCompletedAddressVerification(!!user.isCompletedAddressVerification);

            // Address OTP memory
            if (!user.isCompletedAddressVerification) {
                const stored = await AsyncStorage.getItem('addressOtpSent');
                setAddressOtpSent(stored === 'true');
            } else {
                setAddressOtpSent(false);
                await AsyncStorage.removeItem('addressOtpSent');
            }

            // Billing
            setBillingStreet(user.billingStreet || '');
            setBillingStreetNumber(user.billingStreetNumber || '');
            setBillingZipCode(user.billingZipCode || '');
            setBillingCity(user.billingCity || '');
            setBillingCountry(user.billingCountry || '');
            const isBillingAddressFilled =
                !!(
                    user.billingStreet ||
                    user.billingStreetNumber ||
                    user.billingZipCode ||
                    user.billingCity ||
                    user.billingCountry
                );
            if (isBillingAddressFilled) {
                setShowBilling(true);
            } else {
                setShowBilling(false);
            }

            // Profilin tamamlanmamış olması
            const isPhoneMissing = !user.isCompletedPhoneOtpVerification;
            const isAddressMissing = !user.firstName || !user.isCompletedEmailOtpVerification;
            if (isPhoneMissing && isAddressMissing) {
                setProfileIncomplete(true);
                setPhoneOnlyMissing(false);
            } else if (isPhoneMissing && !isAddressMissing) {
                setProfileIncomplete(true);
                setPhoneOnlyMissing(true);
            } else {
                setProfileIncomplete(false);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    // isCompany false olduğunda firma sekmesi aktif olmamalı
    useEffect(() => {
        if (!isCompany && activeTab === TABS.COMPANY) {
            setActiveTab(TABS.KONTO);
        }
    }, [isCompany, activeTab]);

    // Password değiştir
    const handleChangePassword = async () => {
        setPasswordError('');
        if (!oldPassword || !newPassword) {
            setPasswordError('Lütfen tüm şifre alanlarını doldurunuz.');
            return;
        }
        if (!/\d/.test(newPassword) || !/[^\w\s]/.test(newPassword)) {
            setPasswordError('Yeni şifre en az bir rakam ve bir noktalama işareti içermelidir.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('Yeni şifre en az 8 karakter olmalıdır.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            const body = { oldPassword, newPassword };
            const response = await fetch('https://api.orsetto.ch/api/customer/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error('Password change failed.');
            }
            Alert.alert('Success', 'Your password has been changed!');
            setOldPassword('');
            setNewPassword('');
            setShowPasswordModal(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Adresi kaydet
    const handleChangeAddress = async () => {
        setAddressError('');
        if (!zipCode || !city || !street || !streetNumber || !country) {
            setAddressError('Lütfen tüm zorunlu adres alanlarını doldurunuz.');
            return;
        }
        try {
            const token = await AsyncStorage.getItem('token');
            const body = { street, streetNumber, zipCode, city, country };
            const response = await fetch('https://api.orsetto.ch/api/customer/change-address', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error('Address update failed.');
            }
            Alert.alert('Success', 'Address updated!');
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Fatura adresini kaydet
    const handleChangeBillingAddress = async () => {
        setBillingError('');
        if (!billingZipCode || !billingCity || !billingStreet || !billingStreetNumber || !billingCountry) {
            setBillingError('Lütfen tüm faturalama adres alanlarını doldurunuz.');
            return;
        }
        try {
            const token = await AsyncStorage.getItem('token');
            const body = {
                street: billingStreet,
                streetNumber: billingStreetNumber,
                zipCode: billingZipCode,
                city: billingCity,
                country: billingCountry,
            };
            const response = await fetch('https://api.orsetto.ch/api/customer/change-billing-address', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error('Billing address update failed.');
            }
            Alert.alert('Success', 'Billing address updated!');
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Edit & Verify Modal
    const openEditModal = (field: string, currentValue: string) => {
        setEditField(field);
        setEditValue(currentValue);
        setEditPassword('');
        setNeedOtpStep(false);
        setOtpValue('');
        setPendingFieldToVerify(null);
        setPendingNewValue('');
        setEditModalVisible(true);
    };

    const closeEditModal = () => {
        setEditModalVisible(false);
        setEditField(null);
        setEditValue('');
        setEditPassword('');
        setNeedOtpStep(false);
        setOtpValue('');
        setPendingFieldToVerify(null);
        setPendingNewValue('');
    };

    const handleSaveValue = async () => {
        if (!editField) {return;}

        try {
            const token = await AsyncStorage.getItem('token');
            let endpoint = '';
            let method = 'PUT';
            let bodyObj: any = {};

            if (editField === 'username') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-username';
                bodyObj = { username: editValue };
            } else if (editField === 'languageCode') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-language';
                bodyObj = { languageCode: editValue };
            } else if (editField === 'email') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-email';
                bodyObj = { newEmailId: editValue, password: editPassword };
            } else if (editField === 'phone') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-phone-number';
                bodyObj = { newPhoneNumber: editValue, password: editPassword };
            }

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(bodyObj),
            });
            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Update failed.');
            }

            Alert.alert('Success', `${editField} changed. Please verify if needed.`);

            // Email/Phone => OTP step
            if (editField === 'email') {
                setPendingFieldToVerify('email');
                setPendingNewValue(editValue);
                setIsEmailVerified(false);
                setNeedOtpStep(true);
            } else if (editField === 'phone') {
                setPendingFieldToVerify('phone');
                setPendingNewValue(editValue);
                setIsPhoneVerified(false);
                setNeedOtpStep(true);
            } else {
                closeEditModal();
                fetchUserData();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleVerifyOtp = async () => {
        if (!pendingFieldToVerify || !pendingNewValue) {return;}
        try {
            const token = await AsyncStorage.getItem('token');
            let endpoint = '';
            let bodyObj: any = {};

            if (pendingFieldToVerify === 'email') {
                endpoint = 'https://api.orsetto.ch/api/customer/verify-email-change';
                bodyObj = {
                    newEmailId: pendingNewValue,
                    otp: parseInt(otpValue, 10),
                };
            } else if (pendingFieldToVerify === 'phone') {
                endpoint = 'https://api.orsetto.ch/api/customer/verify-phone-number-change';
                bodyObj = {
                    newPhoneNumber: pendingNewValue,
                    otp: parseInt(otpValue, 10),
                };
            }

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(bodyObj),
            });
            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Verification failed.');
            }

            Alert.alert('Success', 'Verification completed.');
            if (pendingFieldToVerify === 'email') {
                setIsEmailVerified(true);
            } else {
                setIsPhoneVerified(true);
            }
            closeEditModal();
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Adres OTP
    const openAddressModal = () => {
        setAddressOtp('');
        setAddressModalVisible(true);
    };
    const closeAddressModal = () => {
        setAddressOtp('');
        setAddressModalVisible(false);
    };
    const handleSendAddressOtp = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch('https://api.orsetto.ch/api/customer/send-otp-address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
            });
            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Address OTP failed to send.');
            }
            Alert.alert('Success', 'OTP was sent to your address by post.');
            setAddressOtpSent(true);
            await AsyncStorage.setItem('addressOtpSent', 'true');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };
    const handleValidateAddressOtp = async () => {
        try {
            if (!addressOtp) {
                Alert.alert('Error', 'Please enter the OTP code.');
                return;
            }
            const token = await AsyncStorage.getItem('token');
            const body = { otp: addressOtp };
            const response = await fetch('https://api.orsetto.ch/api/customer/otp-validation-address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Address validation failed.');
            }

            Alert.alert('Success', 'Your address has been verified!');
            setIsCompletedAddressVerification(true);
            setAddressOtpSent(false);
            await AsyncStorage.removeItem('addressOtpSent');

            closeAddressModal();
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Telefon tamamlama
    const openCompletePhoneModal = () => {
        setCompletePhoneModalVisible(true);
        setCompletePhoneStep(0);
        setTempPhone('');
        setTempPhoneCountryCode('+49');
        setTempOtp('');
    };
    const closeCompletePhoneModal = () => {
        setCompletePhoneModalVisible(false);
        setCompletePhoneStep(0);
        setTempPhone('');
        setTempPhoneCountryCode('+49');
        setTempOtp('');
    };
    const handleSendSmsOtp = async () => {
        try {
            if (!tempPhone) {
                Alert.alert('Hata', 'Lütfen telefon numarasını giriniz.');
                return;
            }
            const token = await AsyncStorage.getItem('token');
            const fullNumber = tempPhoneCountryCode + tempPhone;
            const body = { mobileNo: fullNumber };
            const response = await fetch('https://api.orsetto.ch/api/customer/send-otp-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Could not send OTP.');
            }

            Alert.alert('Başarılı', `OTP ${fullNumber} numarasına gönderildi.`);
            setCompletePhoneStep(1);
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        }
    };
    const handleValidateSmsOtp = async () => {
        try {
            if (!tempOtp) {
                Alert.alert('Hata', 'Lütfen OTP kodunu giriniz.');
                return;
            }
            const token = await AsyncStorage.getItem('token');
            const body = { otp: parseInt(tempOtp, 10) };
            const response = await fetch('https://api.orsetto.ch/api/customer/otp-validation-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Phone validation failed.');
            }

            Alert.alert('Success', 'Your phone has been verified!');
            closeCompletePhoneModal();
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Şirket sekmesi
    const handleSaveCompanyInfo = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!isCompany) {
                // Firma kapalıysa datayı sıfırla
                const removeBody = {
                    companyName: '',
                    isTradeRegistered: false,
                    tradeRegisteredNumber: '',
                    isRegisterOwner: false,
                    registerPersonName: '',
                    registerPersonSurname: '',
                    registerPersonSex: '',
                };
                const resp = await fetch('https://api.orsetto.ch/api/customer/edit-company-info', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token || ''}`,
                    },
                    body: JSON.stringify(removeBody),
                });
                if (!resp.ok) {
                    const err = await resp.text();
                    throw new Error(err || 'Failed to remove company info.');
                }
                Alert.alert('Success', 'Company info removed.');
            } else {
                const requestBody = {
                    isCompany: true,
                    companyName,
                    isTradeRegistered,
                    tradeRegisteredNumber,
                    isRegisterOwner,
                    registerPersonName,
                    registerPersonSurname,
                    registerPersonSex,
                };
                const resp = await fetch('https://api.orsetto.ch/api/customer/edit-company-info', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token || ''}`,
                    },
                    body: JSON.stringify(requestBody),
                });
                if (!resp.ok) {
                    const err = await resp.text();
                    throw new Error(err || 'Failed to update company info.');
                }
                Alert.alert('Success', 'Company info saved successfully!');
            }
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Profil tamamla
    const handleCompleteProfile = () => {
        if (phoneOnlyMissing) {
            openCompletePhoneModal();
        } else {
            setModalVisible(true);
        }
    };

    // Sekme render fonksiyonları
    const renderTabBar = () => (
        <View style={styles.topTabsContainer}>
            <TouchableOpacity
                style={[
                    styles.topTab,
                    activeTab === TABS.KONTO && styles.topTabActive,
                ]}
                onPress={() => setActiveTab(TABS.KONTO)}
            >
                <Text
                    style={[
                        styles.topTabText,
                        activeTab === TABS.KONTO && styles.topTabTextActive,
                    ]}
                >
                    Konto
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.topTab,
                    activeTab === TABS.SICHERHEIT && styles.topTabActive,
                ]}
                onPress={() => setActiveTab(TABS.SICHERHEIT)}
            >
                <Text
                    style={[
                        styles.topTabText,
                        activeTab === TABS.SICHERHEIT && styles.topTabTextActive,
                    ]}
                >
                    Sicherheit
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[
                    styles.topTab,
                    activeTab === TABS.PRAEFERENZEN && styles.topTabActive,
                ]}
                onPress={() => setActiveTab(TABS.PRAEFERENZEN)}
            >
                <Text
                    style={[
                        styles.topTabText,
                        activeTab === TABS.PRAEFERENZEN && styles.topTabTextActive,
                    ]}
                >
                    Präferenzen
                </Text>
            </TouchableOpacity>
            {isCompany && (
                <TouchableOpacity
                    style={[
                        styles.topTab,
                        activeTab === TABS.COMPANY && styles.topTabActive,
                    ]}
                    onPress={() => setActiveTab(TABS.COMPANY)}
                >
                    <Text
                        style={[
                            styles.topTabText,
                            activeTab === TABS.COMPANY && styles.topTabTextActive,
                        ]}
                    >
                        Firma
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // KONTO TAB => Kullanıcı bilgileri, adresler, bildirimler, hesap silme
    const renderKontoTab = () => (
        <ScrollView style={styles.tabContent} keyboardShouldPersistTaps="handled">
            {/* Benutzerkonto-Daten Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Benutzerkonto-Daten</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Benutzername</Text>
                    <View style={styles.infoValueContainer}>
                        <Text style={styles.infoValue}>{username}</Text>
                        <TouchableOpacity
                            onPress={() => openEditModal('username', username)}
                            style={styles.infoEditButton}
                        >
                            <Text style={styles.infoEditButtonText}>Bearbeiten</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>E-Mail</Text>
                    <View style={styles.infoValueContainer}>
                        <Text style={styles.infoValue}>
                            {email}
                            {isEmailVerified ? ' (Verifiziert)' : ' (Nicht verifiziert)'}
                        </Text>
                        <TouchableOpacity
                            onPress={() => openEditModal('email', email)}
                            style={styles.infoEditButton}
                        >
                            <Text style={styles.infoEditButtonText}>Bearbeiten</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Geburtsdatum</Text>
                    <Text style={styles.infoValue}>{birthday || 'Nicht angegeben'}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Telefonnummer</Text>
                    <View style={styles.infoValueContainer}>
                        <Text style={styles.infoValue}>
                            {phoneNumber
                                ? `${phoneNumber} ${
                                    isPhoneVerified ? '(Verifiziert)' : '(Nicht verifiziert)'
                                }`
                                : 'Nicht angegeben'}
                        </Text>
                        {phoneNumber  ?  <TouchableOpacity
                            onPress={() =>
                                phoneNumber
                                    ? openEditModal('phone', phoneNumber)
                                    : openEditModal('phone', '')
                            }
                            style={styles.infoEditButton}
                        >
                            <Text style={styles.infoEditButtonText}>Bearbeiten</Text>
                        </TouchableOpacity> : null}

                    </View>
                </View>
            </View>

            {/* Adresse Card */}
            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <Text style={styles.cardTitle}>Adresse</Text>
                    {!isCompletedAddressVerification && (
                        <Text style={styles.addressVerify}>
                            Adresse verifizieren
                        </Text>
                    )}
                </View>
                <Text style={styles.subInfo}>{`Strasse: ${street} ${streetNumber || ''}`}</Text>
                <Text style={styles.subInfo}>{`PLZ/Ort: ${zipCode} ${city}`}</Text>
                <Text style={styles.subInfo}>{`Land: ${country}`}</Text>

                {!isCompletedAddressVerification && (
                    <View style={{ marginTop: 10 }}>
                        {!addressOtpSent ? (
                            <TouchableOpacity
                                style={styles.verifyAddressButton}
                                onPress={handleSendAddressOtp}
                            >
                                <Text style={styles.verifyAddressButtonText}>
                                    Adresse jetzt verifizieren
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={styles.verifyAddressButton}
                                onPress={openAddressModal}
                            >
                                <Text style={styles.verifyAddressButtonText}>Code eingeben</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={styles.editAddressBtn}
                    onPress={() => setActiveTab(TABS.KONTO)} // Tab'tan çıkmıyoruz, modal yok
                >
                    <Text style={styles.editAddressBtnText}>Bearbeiten</Text>
                </TouchableOpacity>

                {addressError ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{addressError}</Text>
                    </View>
                ) : null}

                {/* Adresi düzenleme alanları */}
                <View style={styles.editAddressContainer}>
                    <View style={styles.inputRow}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>PLZ</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={zipCode}
                                onChangeText={setZipCode}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Ort</Text>
                            <TextInput
                                style={styles.input}
                                value={city}
                                onChangeText={setCity}
                            />
                        </View>
                    </View>
                    <View style={styles.inputRow}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Strasse</Text>
                            <TextInput
                                style={styles.input}
                                value={street}
                                onChangeText={setStreet}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>Nr.</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={streetNumber}
                                onChangeText={setStreetNumber}
                            />
                        </View>
                    </View>
                    <Text style={{ marginTop: 10 }}>Land</Text>
                    <TextInput
                        style={styles.input}
                        value={country}
                        onChangeText={setCountry}
                    />

                    <TouchableOpacity
                        style={styles.saveAddressBtn}
                        onPress={handleChangeAddress}
                    >
                        <Text style={styles.saveAddressBtnText}>Adresse speichern</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Rechnungsadresse Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Rechnungsadresse</Text>
                <Text style={styles.subInfo}>
                    {`Strasse: ${billingStreet} ${billingStreetNumber || ''}`}
                </Text>
                <Text style={styles.subInfo}>{`PLZ/Ort: ${billingZipCode} ${billingCity}`}</Text>
                <Text style={styles.subInfo}>{`Land: ${billingCountry}`}
                </Text>

                <TouchableOpacity
                    style={styles.editAddressBtn}
                    onPress={() => setShowBilling(!showBilling)}
                >
                    <Text style={styles.editAddressBtnText}>
                        {showBilling ? 'Schließen' : 'Bearbeiten'}
                    </Text>
                </TouchableOpacity>

                {showBilling && (
                    <>
                        {billingError ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{billingError}</Text>
                            </View>
                        ) : null}

                        <View style={styles.editAddressContainer}>
                            <View style={styles.inputRow}>
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <Text>PLZ</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="number-pad"
                                        value={billingZipCode}
                                        onChangeText={setBillingZipCode}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <Text>Ort</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={billingCity}
                                        onChangeText={setBillingCity}
                                    />
                                </View>
                            </View>
                            <View style={styles.inputRow}>
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <Text>Strasse</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={billingStreet}
                                        onChangeText={setBillingStreet}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <Text>Nr.</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="number-pad"
                                        value={billingStreetNumber}
                                        onChangeText={setBillingStreetNumber}
                                    />
                                </View>
                            </View>
                            <Text style={{ marginTop: 10 }}>Land</Text>
                            <TextInput
                                style={styles.input}
                                value={billingCountry}
                                onChangeText={setBillingCountry}
                            />

                            <TouchableOpacity
                                style={styles.saveAddressBtn}
                                onPress={handleChangeBillingAddress}
                            >
                                <Text style={styles.saveAddressBtnText}>Rechnungsadresse speichern</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Benachrichtigungen Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Benachrichtigungen</Text>
                {/* Örnek toggle: E-Mail */}
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>E-Mail-Benachrichtigungen</Text>
                    <Switch
                        // Burada state ve setState ekleyebilirsiniz
                        value={false}
                        onValueChange={() => {}}
                    />
                </View>
                {/* Örnek toggle: Push */}
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Push-Benachrichtigungen</Text>
                    <Switch
                        // Burada state ve setState ekleyebilirsiniz
                        value={false}
                        onValueChange={() => {}}
                    />
                </View>
            </View>

            {/* Konto löschen */}
            <View style={styles.card}>
                <Text style={styles.deleteAccountTitle}>Konto löschen</Text>
                <Text style={styles.deleteAccountDesc}>
                    Diese Aktion kann nicht rückgängig gemacht werden.
                </Text>
                <TouchableOpacity
                    style={styles.deleteAccountBtn}
                    onPress={confirmDeleteAccount}
                >
                    <Text style={styles.deleteAccountBtnText}>Löschung Bearbeiten</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // SICHERHEIT TAB => 2FA, Password
    const renderSicherheitTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Zwei-Faktor-Authentifizierung</Text>

                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Authenticator-App</Text>
                    <Switch
                        value={authenticatorAppEnabled}
                        onValueChange={(val) => setAuthenticatorAppEnabled(val)}
                    />
                </View>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>SMS-Authentifizierung</Text>
                    <Switch
                        value={smsAuthEnabled}
                        onValueChange={(val) => setSmsAuthEnabled(val)}
                    />
                </View>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Passwort & Sicherheit</Text>
                <TouchableOpacity
                    style={styles.changePasswordBtn}
                    onPress={() => setShowPasswordModal(true)}
                >
                    <Text style={styles.changePasswordBtnText}>Passwort ändern</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // PRÄFERENZEN TAB => Sprache, Zahlungseinstellungen
    const renderPraeferenzenTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Sprache</Text>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Aktuelle Sprache</Text>
                    <View style={styles.infoValueContainer}>
                        <Text style={styles.infoValue}>{languageCode || 'Unbekannt'}</Text>
                        <TouchableOpacity
                            onPress={() => openEditModal('languageCode', languageCode)}
                            style={styles.infoEditButton}
                        >
                            <Text style={styles.infoEditButtonText}>Ändern</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Zahlungseinstellungen</Text>
                <Text style={[styles.subInfo, { marginBottom: 5 }]}>
                    Standardzahlungsmethode
                </Text>
                <Text style={styles.infoValue}>TWINT</Text>
                <TouchableOpacity style={styles.managePaymentBtn}>
                    <Text style={styles.managePaymentBtnText}>Verwalten</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // COMPANY TAB (Firma)
    const renderCompanyTab = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Firma / Gewerbe</Text>
                <View style={styles.toggleRow}>
                    <Text style={styles.toggleLabel}>Ist ein Unternehmen?</Text>
                    <Switch
                        value={isCompany}
                        onValueChange={(val) => setIsCompany(val)}
                    />
                </View>
                {isCompany && (
                    <>
                        <Text style={styles.label}>Firmenname</Text>
                        <TextInput
                            style={styles.input}
                            value={companyName}
                            onChangeText={setCompanyName}
                            placeholder="z.B. Muster GmbH"
                        />
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Handelsregister?</Text>
                            <Switch
                                value={isTradeRegistered}
                                onValueChange={val => setIsTradeRegistered(val)}
                            />
                        </View>
                        {isTradeRegistered && (
                            <>
                                <Text style={styles.label}>Handelsregister Nr.</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tradeRegisteredNumber}
                                    onChangeText={setTradeRegisteredNumber}
                                    placeholder="CH-ZH-xxxxx"
                                />
                            </>
                        )}
                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleLabel}>Zeichnungsberechtigt?</Text>
                            <Switch
                                value={!isRegisterOwner}
                                onValueChange={() => setIsRegisterOwner((prev) => !prev)}
                            />
                        </View>
                        {!isRegisterOwner && (
                            <>
                                <Text style={styles.label}>Vorname</Text>
                                <TextInput
                                    style={styles.input}
                                    value={registerPersonName}
                                    onChangeText={setRegisterPersonName}
                                />
                                <Text style={styles.label}>Nachname</Text>
                                <TextInput
                                    style={styles.input}
                                    value={registerPersonSurname}
                                    onChangeText={setRegisterPersonSurname}
                                />
                                <Text style={styles.label}>Geschlecht</Text>
                                <View style={styles.genderContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.genderOption,
                                            registerPersonSex === 'female' &&
                                            styles.genderOptionSelected,
                                        ]}
                                        onPress={() => setRegisterPersonSex('female')}
                                    >
                                        <Text>Weiblich</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.genderOption,
                                            registerPersonSex === 'male' &&
                                            styles.genderOptionSelected,
                                        ]}
                                        onPress={() => setRegisterPersonSex('male')}
                                    >
                                        <Text>Männlich</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.genderOption,
                                            registerPersonSex === 'other' &&
                                            styles.genderOptionSelected,
                                        ]}
                                        onPress={() => setRegisterPersonSex('other')}
                                    >
                                        <Text>Andere</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        <TouchableOpacity
                            style={styles.saveAddressBtn}
                            onPress={handleSaveCompanyInfo}
                        >
                            <Text style={styles.saveAddressBtnText}>Speichern</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </ScrollView>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaView style={styles.container}>
                {/* Profil tamamlama banner */}
                {profileIncomplete && (
                    <View style={styles.profileBanner}>
                        <Text style={styles.profileBannerTitle}>
                            {phoneOnlyMissing
                                ? 'Telefonnummer vervollständigen'
                                : 'Profil vervollständigen'}
                        </Text>
                        <Text style={styles.profileBannerDesc}>
                            Um alle Funktionen nutzen zu können, vervollständige bitte dein Profil.
                        </Text>
                        <TouchableOpacity
                            style={styles.profileBannerButton}
                            onPress={handleCompleteProfile}
                        >
                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                {phoneOnlyMissing ? 'JETZT TELEFONNUMMER' : 'JETZT VERVOLLSTÄNDIGEN'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Tab menüsü */}
                {renderTabBar()}

                {/* Sekme içeriği */}
                {activeTab === TABS.KONTO && renderKontoTab()}
                {activeTab === TABS.SICHERHEIT && renderSicherheitTab()}
                {activeTab === TABS.PRAEFERENZEN && renderPraeferenzenTab()}
                {isCompany && activeTab === TABS.COMPANY && renderCompanyTab()}

                {/* EDIT & VERIFY MODAL (username, languageCode, email, phone) */}
                <Modal
                    visible={editModalVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={closeEditModal}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>
                                {editField === 'email' || editField === 'phone'
                                    ? `Änderung & Verifizierung (${editField})`
                                    : `Bearbeiten (${editField})`}
                            </Text>

                            {!needOtpStep && (
                                <>
                                    {editField === 'username' && (
                                        <>
                                            <Text style={styles.label}>Neuer Benutzername</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                placeholder="Neuer Benutzername"
                                                placeholderTextColor="#999"
                                            />
                                        </>
                                    )}

                                    {editField === 'languageCode' && (
                                        <>
                                            <Text style={styles.label}>Sprache wählen</Text>
                                            <Picker
                                                selectedValue={editValue}
                                                style={[
                                                    styles.picker,
                                                    { backgroundColor, color: textColor },
                                                ]}
                                                onValueChange={(val) => setEditValue(val)}
                                            >
                                                {languageOptions.map((opt) => (
                                                    <Picker.Item
                                                        key={opt.value}
                                                        label={opt.label}
                                                        value={opt.value}
                                                        color={textColor}
                                                    />
                                                ))}
                                            </Picker>
                                        </>
                                    )}

                                    {editField === 'email' && (
                                        <>
                                            <Text style={styles.label}>Neue E-Mail</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                placeholder="E-Mail eingeben"
                                                placeholderTextColor="#999"
                                            />
                                            <Text style={styles.label}>Passwort (erforderlich)</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                secureTextEntry
                                                value={editPassword}
                                                onChangeText={setEditPassword}
                                                placeholder="Passwort eingeben"
                                                placeholderTextColor="#999"
                                            />
                                        </>
                                    )}

                                    {editField === 'phone' && (
                                        <>
                                            <Text style={styles.label}>Landesvorwahl</Text>
                                            <Picker
                                                selectedValue={tempPhoneCountryCode}
                                                style={[
                                                    styles.picker,
                                                    { backgroundColor, color: textColor },
                                                ]}
                                                onValueChange={(value) =>
                                                    setTempPhoneCountryCode(value)
                                                }
                                            >
                                                {phoneCountryCodes.map((opt) => (
                                                    <Picker.Item
                                                        label={opt.label}
                                                        value={opt.value}
                                                        key={opt.value}
                                                        color={textColor}
                                                    />
                                                ))}
                                            </Picker>
                                            <Text style={styles.label}>Neue Telefonnummer</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                keyboardType="number-pad"
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                placeholder="z.B. 123456789"
                                                placeholderTextColor="#999"
                                            />
                                            <Text style={styles.label}>Passwort (erforderlich)</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                secureTextEntry
                                                value={editPassword}
                                                onChangeText={setEditPassword}
                                                placeholder="Passwort eingeben"
                                                placeholderTextColor="#999"
                                            />
                                        </>
                                    )}

                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                            onPress={closeEditModal}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                Abbrechen
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#FF6200' }]}
                                            onPress={handleSaveValue}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                Speichern
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            {needOtpStep && (
                                <>
                                    <Text style={styles.sectionDesc}>
                                        Bitte den OTP-Code eingeben, den wir gesendet haben.
                                    </Text>
                                    <Text style={styles.label}>OTP-Code</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={otpValue}
                                        onChangeText={setOtpValue}
                                        keyboardType="number-pad"
                                        placeholder="OTP eingeben"
                                        placeholderTextColor="#999"
                                    />
                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                            onPress={closeEditModal}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                Abbrechen
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.modalButton,
                                                { backgroundColor: otpValue ? '#FF6200' : '#ccc' },
                                            ]}
                                            onPress={otpValue ? handleVerifyOtp : undefined}
                                            disabled={!otpValue}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                Verifizieren
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* ADDRESS OTP MODAL */}
                <Modal
                    visible={addressModalVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={closeAddressModal}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Adresse OTP eingeben</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={addressOtp}
                                onChangeText={setAddressOtp}
                                keyboardType="number-pad"
                                placeholder="OTP-Code"
                                placeholderTextColor="#999"
                            />
                            <View style={styles.modalButtonRow}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                    onPress={closeAddressModal}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Abbrechen</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        { backgroundColor: addressOtp ? '#FF6200' : '#ccc' },
                                    ]}
                                    disabled={!addressOtp}
                                    onPress={handleValidateAddressOtp}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Validieren</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* COMPLETE PHONE MODAL */}
                <Modal
                    visible={completePhoneModalVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={closeCompletePhoneModal}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalCard}>
                            {completePhoneStep === 0 ? (
                                <>
                                    <Text style={styles.modalTitle}>
                                        Telefonnummer eingeben
                                    </Text>
                                    <Text style={styles.label}>Landesvorwahl</Text>
                                    <Picker
                                        selectedValue={tempPhoneCountryCode}
                                        style={[styles.picker, { backgroundColor, color: textColor }]}
                                        onValueChange={(value) => setTempPhoneCountryCode(value)}
                                    >
                                        {phoneCountryCodes.map((opt) => (
                                            <Picker.Item
                                                label={opt.label}
                                                value={opt.value}
                                                key={opt.value}
                                                color={textColor}
                                            />
                                        ))}
                                    </Picker>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={tempPhone}
                                        onChangeText={setTempPhone}
                                        keyboardType="number-pad"
                                        placeholder="Telefonnummer"
                                        placeholderTextColor="#999"
                                    />
                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                            onPress={closeCompletePhoneModal}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Abbrechen</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#FF6200' }]}
                                            onPress={handleSendSmsOtp}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                OTP senden
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.modalTitle}>OTP-Code eingeben</Text>
                                    <Text style={{ marginBottom: 10 }}>
                                        Wir haben eine SMS gesendet an {tempPhoneCountryCode}
                                        {tempPhone}
                                    </Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={tempOtp}
                                        onChangeText={setTempOtp}
                                        keyboardType="number-pad"
                                        placeholder="OTP-Code"
                                        placeholderTextColor="#999"
                                    />
                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                            onPress={closeCompletePhoneModal}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Abbrechen</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.modalButton,
                                                { backgroundColor: tempOtp ? '#FF6200' : '#ccc' },
                                            ]}
                                            disabled={!tempOtp}
                                            onPress={handleValidateSmsOtp}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                                Verifizieren
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* PASSWORD CHANGE MODAL */}
                <Modal
                    visible={showPasswordModal}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowPasswordModal(false)}
                >
                    <View style={styles.modalBackground}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Passwort ändern</Text>
                            {passwordError ? (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>{passwordError}</Text>
                                </View>
                            ) : null}

                            <Text style={styles.label}>Altes Passwort</Text>
                            <View style={styles.passwordRow}>
                                <TextInput
                                    style={[styles.modalInput, { flex: 1 }]}
                                    secureTextEntry={!showOldPass}
                                    value={oldPassword}
                                    onChangeText={setOldPassword}
                                    placeholder="Altes Passwort"
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity
                                    style={styles.eyeBtn}
                                    onPress={() => setShowOldPass(!showOldPass)}
                                >
                                    <Text>{showOldPass ? 'Verstecken' : 'Zeigen'}</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Neues Passwort</Text>
                            <View style={styles.passwordRow}>
                                <TextInput
                                    style={[styles.modalInput, { flex: 1 }]}
                                    secureTextEntry={!showNewPass}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Neues Passwort"
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity
                                    style={styles.eyeBtn}
                                    onPress={() => setShowNewPass(!showNewPass)}
                                >
                                    <Text>{showNewPass ? 'Verstecken' : 'Zeigen'}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalButtonRow}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                    onPress={() => setShowPasswordModal(false)}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Abbrechen</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: '#FF6200' }]}
                                    onPress={handleChangePassword}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Speichern</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Tam profil doldurma modalı */}
                <CompleteProfileModal
                    isVisible={isModalVisible}
                    onClose={() => setModalVisible(false)}
                    onProfileUpdate={() => {
                        fetchUserData();
                        setModalVisible(false);
                    }}
                    profileData={profileData}
                />
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

export default AccountDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // Üstteki tab menüsü
    topTabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    topTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    topTabActive: {
        borderBottomWidth: 3,
        borderBottomColor: '#FF6200',
    },
    topTabText: {
        fontSize: 14,
        color: '#666',
    },
    topTabTextActive: {
        color: '#FF6200',
        fontWeight: '600',
    },
    // Sekme içeriği
    tabContent: {
        flex: 1,
        padding: 15,
    },
    // Kart
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,

        elevation: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    addressVerify: {
        color: '#FF6200',
        fontWeight: '600',
    },
    // Bilgi satırı
    infoRow: {
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },
    infoValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
    },
    infoEditButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#eee',
        borderRadius: 4,
        marginLeft: 10,
    },
    infoEditButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },
    // Address
    subInfo: {
        color: '#555',
        marginBottom: 3,
    },
    verifyAddressButton: {
        padding: 10,
        backgroundColor: '#FF6200',
        borderRadius: 5,
        alignItems: 'center',
    },
    verifyAddressButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    editAddressBtn: {
        marginTop: 10,
        padding: 8,
        alignSelf: 'flex-start',
        backgroundColor: '#eee',
        borderRadius: 4,
    },
    editAddressBtnText: {
        fontWeight: '600',
        fontSize: 12,
        color: '#333',
    },
    editAddressContainer: {
        marginTop: 10,
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 6,
    },
    inputRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginTop: 5,
        color: '#000',
    },
    saveAddressBtn: {
        marginTop: 12,
        paddingVertical: 10,
        borderRadius: 6,
        backgroundColor: '#FF6200',
        alignItems: 'center',
    },
    saveAddressBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Hata kutusu
    errorBox: {
        backgroundColor: '#fdd',
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#faa',
    },
    errorText: {
        color: '#900',
        fontWeight: '600',
    },
    // Bildirim toggles
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
    },
    toggleLabel: {
        fontSize: 14,
        color: '#333',
    },
    // Konto löschen
    deleteAccountTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#c00',
    },
    deleteAccountDesc: {
        color: '#555',
        marginBottom: 10,
    },
    deleteAccountBtn: {
        backgroundColor: '#FF6200',
        paddingVertical: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    deleteAccountBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Sicherheit => Passwort
    changePasswordBtn: {
        paddingVertical: 10,
        backgroundColor: '#FF6200',
        borderRadius: 6,
        alignItems: 'center',
    },
    changePasswordBtnText: {
        color: '#fff',
        fontWeight: '600',
    },
    // Präferenzen
    managePaymentBtn: {
        marginTop: 10,
        backgroundColor: '#eee',
        padding: 8,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    managePaymentBtnText: {
        fontWeight: '600',
        fontSize: 12,
        color: '#333',
    },
    // Profil Banner
    profileBanner: {
        backgroundColor: '#fff3e0',
        padding: 15,
        margin: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ffb84d',
    },
    profileBannerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6200',
        marginBottom: 5,
    },
    profileBannerDesc: {
        color: '#333',
        marginBottom: 10,
    },
    profileBannerButton: {
        backgroundColor: '#FF6200',
        paddingVertical: 8,
        borderRadius: 5,
        alignItems: 'center',
    },
    // Company
    genderContainer: {
        flexDirection: 'row',
        marginVertical: 5,
    },
    genderOption: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        borderRadius: 5,
        marginRight: 10,
    },
    genderOptionSelected: {
        borderColor: '#FF6200',
        backgroundColor: '#ffe6d9',
    },
    // Modals
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginVertical: 5,
        color: '#000',
    },
    modalButtonRow: {
        flexDirection: 'row',
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginVertical: 5,
    },
    sectionDesc: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
    },
    // Password modal
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    eyeBtn: {
        marginLeft: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    label: {
        fontWeight: '600',
        marginTop: 10,
    },
});
