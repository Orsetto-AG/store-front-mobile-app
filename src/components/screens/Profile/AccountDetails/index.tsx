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
    useColorScheme
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';
import CompleteProfileModal from '../CompleteProfile';
import { logout } from '../../../redux/slices/authSlice.ts';
import { useDispatch } from 'react-redux';

const TABS = {
    MEMBERSHIP: 0,
    PASSWORD: 1,
    ADDRESS: 2,
    COMPANY: 3,
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
    const [activeTab, setActiveTab] = useState(TABS.MEMBERSHIP);

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

    // Sadece languageCode editable
    const [languageCode, setLanguageCode] = useState('');

    // Password
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPasswordFields, setShowPasswordFields] = useState(false);
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

    // Edit & Verify Modal (sadece username, languageCode, email, phone için kullanacağız)
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

    // Şirket ile ilgili state'ler:
    const [isCompany, setIsCompany] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [isTradeRegistered, setIsTradeRegistered] = useState(false);
    const [tradeRegisteredNumber, setTradeRegisteredNumber] = useState('');
    const [isRegisterOwner, setIsRegisterOwner] = useState(false);
    const [registerPersonName, setRegisterPersonName] = useState('');
    const [registerPersonSurname, setRegisterPersonSurname] = useState('');
    const [registerPersonSex, setRegisterPersonSex] = useState<'male' | 'female' | 'other' | ''>('');

    // Delete account confirmation
    const confirmDeleteAccount = () => {
        Alert.alert(
            'Hesabı silmek istiyor musunuz?',
            'Bu işlemi onaylıyor musunuz?',
            [
                { text: 'Hayır', style: 'cancel' },
                { text: 'Evet', style: 'destructive', onPress: handleDeleteAccount },
            ],
            { cancelable: true },
        );
    };

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
            setBirthday(user.birthday ? moment(user.birthday).format('DD-MM-YYYY') : '');
            setGender(user.gender || '');
            setLanguageCode(user.languageCode || '');

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
            // # Burada billing doldurulmuşsa direkt aç:
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
            // Profile incomplete
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

    // Şirket tabından çıkma
    useEffect(() => {
        if (!isCompany && activeTab === TABS.COMPANY) {
            setActiveTab(TABS.MEMBERSHIP);
        }
    }, [isCompany, activeTab]);

    // =============== COMPLETE PHONE FLOW ===============
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

    // 1) Send phone OTP
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

    // 2) Validate phone OTP
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

    // Delete account
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
            dispatch(logout());
            navigation.navigate('AuthScreen');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Change password
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
            setShowPasswordFields(false);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Save main address
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

    // Save billing address
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

    // Edit & Verify Modal (only for username, languageCode, email, phone)
    const openEditModal = (field: string, currentValue: string) => {
        setEditField(field);
        setEditValue(currentValue);
        setEditPassword('');
        setNeedOtpStep(false);
        setOtpValue('');
        setPendingFieldToVerify(null);
        setPendingNewValue('');

        // Örnek: phone
        if (field === 'phone') {
            // Bu noktada istersek "ülke kodu + local" parse edebiliriz vs.
        }

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
        if (!editField) return;

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
                // Username, language => no OTP
                closeEditModal();
                fetchUserData();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleVerifyOtp = async () => {
        if (!pendingFieldToVerify || !pendingNewValue) return;
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

    // Address OTP
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

    // Şirket sekmesi
    const handleSaveCompanyInfo = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!isCompany) {
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

    const handleCompleteProfile = () => {
        if (phoneOnlyMissing) {
            openCompletePhoneModal();
        } else {
            setModalVisible(true);
        }
    };

    // Tab bar
    const renderTabBar = () => (
        <View style={styles.tabBar}>
            <TouchableOpacity
                style={[styles.tabItem, activeTab === TABS.MEMBERSHIP && styles.tabItemActive]}
                onPress={() => setActiveTab(TABS.MEMBERSHIP)}
            >
                <Text style={[styles.tabText, activeTab === TABS.MEMBERSHIP && styles.tabTextActive]}>
                    Membership Info
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabItem, activeTab === TABS.PASSWORD && styles.tabItemActive]}
                onPress={() => setActiveTab(TABS.PASSWORD)}
            >
                <Text style={[styles.tabText, activeTab === TABS.PASSWORD && styles.tabTextActive]}>
                    Password Change
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabItem, activeTab === TABS.ADDRESS && styles.tabItemActive]}
                onPress={() => setActiveTab(TABS.ADDRESS)}
            >
                <Text style={[styles.tabText, activeTab === TABS.ADDRESS && styles.tabTextActive]}>
                    Edit Address
                </Text>
            </TouchableOpacity>

            {isCompany && (
                <TouchableOpacity
                    style={[styles.tabItem, activeTab === TABS.COMPANY && styles.tabItemActive]}
                    onPress={() => setActiveTab(TABS.COMPANY)}
                >
                    <Text style={[styles.tabText, activeTab === TABS.COMPANY && styles.tabTextActive]}>
                        Company
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // MEMBERSHIP TAB
    const renderMembershipTab = () => (
        <ScrollView style={{ flex: 1, padding: 15 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle}>Profile details</Text>
            <Text style={styles.sectionDesc}>Here you can see your profile information.</Text>

            {/* firstName & lastName read-only */}
            <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text>Name & Surname</Text>
                    <TextInput
                        style={styles.input}
                        value={(firstName + ' ' + lastName).trim()}
                        editable={false}
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text>Username</Text>
                    {/* username editable */}
                    <View>
                        <TextInput
                            style={styles.input}
                            value={username}
                            editable={false}
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity
                            style={styles.editBtn}
                            onPress={() => openEditModal('username', username)}
                        >
                            <Text style={styles.editBtnText}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* birthday read-only */}
            <Text style={{ marginTop: 10 }}>Birthday</Text>
            <TextInput style={styles.input} value={birthday} editable={false} placeholderTextColor="#999" />

            {/* gender read-only */}
            <Text style={{ marginTop: 10 }}>Gender</Text>
            <View style={styles.genderContainer}>
                <TouchableOpacity
                    style={[styles.genderOption, gender === 'female' && styles.genderOptionSelected]}
                    disabled
                >
                    <Text>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.genderOption, gender === 'male' && styles.genderOptionSelected]}
                    disabled
                >
                    <Text>Male</Text>
                </TouchableOpacity>
            </View>

            {/* Language code => editable */}
            <Text style={styles.label}>Language Code</Text>
            <TextInput
                style={styles.input}
                value={languageCode}
                editable={false}
                placeholderTextColor="#999"
            />
            <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal('languageCode', languageCode)}
            >
                <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Contact information</Text>

            {/* EMAIL => editable */}
            <Text>
                Email{' '}
                {isEmailVerified ? (
                    <Text style={{ color: 'green' }}>(Verified ✅)</Text>
                ) : (
                    <Text style={{ color: 'red' }}>(Not Verified ❌)</Text>
                )}
            </Text>
            <TextInput
                style={styles.input}
                value={email}
                editable={false}
                placeholder="Email"
                placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('email', email)}>
                <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            {/* PHONE => editable */}
            {phoneNumber.length > 0 ? (
                <>
                    <Text style={{ marginTop: 10 }}>
                        Phone{' '}
                        {isPhoneVerified ? (
                            <Text style={{ color: 'green' }}>(Verified ✅)</Text>
                        ) : (
                            <Text style={{ color: 'red' }}>(Not Verified ❌)</Text>
                        )}
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={phoneNumber}
                        editable={false}
                        keyboardType="number-pad"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => openEditModal('phone', phoneNumber)}
                    >
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <Text style={{ color: 'gray', marginTop: 10 }}>No phone number yet.</Text>
            )}

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: 'red', marginTop: 20 }]}
                onPress={confirmDeleteAccount}
            >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Delete Account</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // PASSWORD TAB
    const renderPasswordTab = () => (
        <ScrollView style={{ flex: 1, padding: 15 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Text style={styles.sectionDesc}>
                Your password must include a digit and a punctuation mark, and be at least 8 chars.
            </Text>

            {!showPasswordFields && (
                <TouchableOpacity
                    style={[styles.updateButton, { backgroundColor: '#FF6200', marginTop: 10 }]}
                    onPress={() => setShowPasswordFields(true)}
                >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>
                        Şifreyi Değiştir / Hesap Güvenliği
                    </Text>
                </TouchableOpacity>
            )}

            {showPasswordFields && (
                <>
                    {passwordError ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{passwordError}</Text>
                        </View>
                    ) : null}

                    <Text>Current Password</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            secureTextEntry={!showOldPass}
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            placeholder="Current password"
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity
                            onPress={() => setShowOldPass(!showOldPass)}
                            style={styles.eyeBtn}
                        >
                            <Text>{showOldPass ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text>New Password</Text>
                    <View style={styles.passwordRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            secureTextEntry={!showNewPass}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="New password"
                            placeholderTextColor="#999"
                        />
                        <TouchableOpacity
                            onPress={() => setShowNewPass(!showNewPass)}
                            style={styles.eyeBtn}
                        >
                            <Text>{showNewPass ? 'Hide' : 'Show'}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.updateButton, { backgroundColor: '#FF6200' }]}
                        onPress={handleChangePassword}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Change</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );

    // ADDRESS TAB
    const renderAddressTab = () => (
        <ScrollView style={{ flex: 1, padding: 15 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>Main Address </Text>
                {isCompletedAddressVerification ? (
                    <Text style={{ color: 'green', marginTop: 10 }}> (Verified ✅)</Text>
                ) : (
                    <Text style={{ color: 'red', marginTop: 10 }}> (Not Verified ❌)</Text>
                )}
            </View>

            {!isCompletedAddressVerification && (
                <>
                    <Text style={styles.verifyInfoText}>
                        This code will be delivered to your address by post.
                    </Text>

                    {!addressOtpSent ? (
                        <TouchableOpacity
                            style={[styles.verifyButton, { backgroundColor: '#FF6200' }]}
                            onPress={handleSendAddressOtp}
                        >
                            <Text style={styles.verifyButtonText}>Verify Now</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.verifyButton, { backgroundColor: '#FF6200' }]}
                            onPress={openAddressModal}
                        >
                            <Text style={styles.verifyButtonText}>Enter Code</Text>
                        </TouchableOpacity>
                    )}
                </>
            )}

            {addressError ? (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{addressError}</Text>
                </View>
            ) : null}

            <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text>Postcode</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        value={zipCode}
                        onChangeText={setZipCode}
                        placeholder="Zip code"
                        placeholderTextColor="#999"
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text>City</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        placeholderTextColor="#999"
                    />
                </View>
            </View>

            <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text>Street name</Text>
                    <TextInput
                        style={styles.input}
                        value={street}
                        onChangeText={setStreet}
                        placeholder="Street name"
                        placeholderTextColor="#999"
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text>House no</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="number-pad"
                        value={streetNumber}
                        onChangeText={setStreetNumber}
                        placeholder="House no."
                        placeholderTextColor="#999"
                    />
                </View>
            </View>

            <Text style={{ marginTop: 10 }}>Country</Text>
            <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
                placeholderTextColor="#999"
            />

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#FF6200', marginTop: 10 }]}
                onPress={handleChangeAddress}
            >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save Main Address</Text>
            </TouchableOpacity>

            <View style={[styles.billingHeader, { marginTop: 30 }]}>
                <Text style={styles.sectionTitle}>Billing Address</Text>
                <TouchableOpacity onPress={() => setShowBilling(!showBilling)}>
                    <Text style={{ color: '#FF6200' }}>
                        {showBilling
                            ? 'Hide'
                            : (billingStreet ||
                                billingStreetNumber ||
                                billingZipCode ||
                                billingCity ||
                                billingCountry)
                                ? 'Show Billing Address'
                                : '+ Add Billing Address'}
                    </Text>
                </TouchableOpacity>
            </View>

            {showBilling && (
                <>
                    {billingError ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{billingError}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputRow}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Postcode</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={billingZipCode}
                                onChangeText={setBillingZipCode}
                                placeholder="Zip code"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>City</Text>
                            <TextInput
                                style={styles.input}
                                value={billingCity}
                                onChangeText={setBillingCity}
                                placeholder="City"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Street name</Text>
                            <TextInput
                                style={styles.input}
                                value={billingStreet}
                                onChangeText={setBillingStreet}
                                placeholder="Street name"
                                placeholderTextColor="#999"
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>House no</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={billingStreetNumber}
                                onChangeText={setBillingStreetNumber}
                                placeholder="House no."
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <Text style={{ marginTop: 10 }}>Country</Text>
                    <TextInput
                        style={styles.input}
                        value={billingCountry}
                        onChangeText={setBillingCountry}
                        placeholder="Country"
                        placeholderTextColor="#999"
                    />

                    <TouchableOpacity
                        style={[styles.updateButton, { backgroundColor: '#FF6200', marginTop: 10 }]}
                        onPress={handleChangeBillingAddress}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Save Billing Address</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );

    // COMPANY TAB
    const renderCompanyTab = () => (
        <ScrollView style={{ flex: 1, padding: 15 }}>
            <Text style={styles.sectionTitle}>Gewerbe</Text>
            {isCompany && (
                <>
                    <Text style={{ marginTop: 10 }}>Company Name</Text>
                    <TextInput
                        style={styles.input}
                        value={companyName}
                        onChangeText={setCompanyName}
                        placeholder="Company Name"
                        placeholderTextColor="#999"
                    />

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <Text style={{ flex: 1 }}>Handelsregister?</Text>
                        <Switch
                            value={isTradeRegistered}
                            onValueChange={(val) => setIsTradeRegistered(val)}
                        />
                    </View>

                    {isTradeRegistered && (
                        <>
                            <Text style={{ marginTop: 10 }}>Handelsregister Nr.</Text>
                            <TextInput
                                style={styles.input}
                                value={tradeRegisteredNumber}
                                onChangeText={setTradeRegisteredNumber}
                                placeholder="CH-ZH-xxxxx"
                                placeholderTextColor="#999"
                            />
                        </>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                        <Text style={{ flex: 1 }}>Zeichnungsberechtigt?</Text>
                        <Switch
                            value={!isRegisterOwner}
                            onValueChange={() => setIsRegisterOwner((prev) => !prev)}
                        />
                    </View>

                    {!isRegisterOwner && (
                        <>
                            <Text style={{ marginTop: 10 }}>Zeichnungsberechtigte/r Vorname</Text>
                            <TextInput
                                style={styles.input}
                                value={registerPersonName}
                                onChangeText={setRegisterPersonName}
                                placeholder="Name"
                                placeholderTextColor="#999"
                            />

                            <Text style={{ marginTop: 10 }}>Zeichnungsberechtigte/r Nachname</Text>
                            <TextInput
                                style={styles.input}
                                value={registerPersonSurname}
                                onChangeText={setRegisterPersonSurname}
                                placeholder="Surname"
                                placeholderTextColor="#999"
                            />

                            <Text style={{ marginTop: 10 }}>Geschlecht</Text>
                            <View style={{ flexDirection: 'row', marginVertical: 5 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.genderOption,
                                        registerPersonSex === 'female' && styles.genderOptionSelected,
                                    ]}
                                    onPress={() => setRegisterPersonSex('female')}
                                >
                                    <Text>Female</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.genderOption,
                                        registerPersonSex === 'male' && styles.genderOptionSelected,
                                    ]}
                                    onPress={() => setRegisterPersonSex('male')}
                                >
                                    <Text>Male</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.genderOption,
                                        registerPersonSex === 'other' && styles.genderOptionSelected,
                                    ]}
                                    onPress={() => setRegisterPersonSex('other')}
                                >
                                    <Text>Other</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </>
            )}

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#FF6200', marginTop: 20 }]}
                onPress={handleSaveCompanyInfo}
            >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaView style={styles.container}>
                {profileIncomplete && (
                    <View style={styles.profileBanner}>
                        <Text style={styles.profileBannerTitle}>
                            {phoneOnlyMissing ? 'Complete your phone number' : 'Complete your profile'}
                        </Text>
                        <Text style={styles.profileBannerDesc}>
                            To get full access to features, please complete your profile.
                        </Text>
                        <TouchableOpacity style={styles.profileBannerButton} onPress={handleCompleteProfile}>
                            <Text style={{ color: '#fff', fontWeight: '600' }}>
                                {phoneOnlyMissing ? 'COMPLETE PHONE NUMBER' : 'COMPLETE NOW'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {renderTabBar()}

                {activeTab === TABS.MEMBERSHIP && renderMembershipTab()}
                {activeTab === TABS.PASSWORD && renderPasswordTab()}
                {activeTab === TABS.ADDRESS && renderAddressTab()}
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
                                    ? `Change & Verify ${editField}`
                                    : `Edit ${editField}`}
                            </Text>

                            {!needOtpStep && (
                                <>
                                    {editField === 'username' && (
                                        <>
                                            <Text style={styles.label}>New Username</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                placeholder="Enter new username"
                                                placeholderTextColor="#999"
                                            />
                                        </>
                                    )}

                                    {editField === 'languageCode' && (
                                        <>
                                            <Text style={styles.label}>Language</Text>
                                            <Picker
                                                selectedValue={editValue}
                                                style={[
                                                    styles.picker,
                                                    {
                                                        backgroundColor,
                                                        color: textColor,
                                                    }
                                                ]}
                                                onValueChange={(val) => setEditValue(val)}
                                                itemStyle={{
                                                    color: textColor,
                                                }}
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
                                            <Text style={styles.label}>New Email</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                placeholder="Enter new email"
                                                placeholderTextColor="#999"
                                            />
                                            <Text style={styles.label}>Password (required)</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                secureTextEntry
                                                value={editPassword}
                                                onChangeText={setEditPassword}
                                                placeholder="Enter your password"
                                                placeholderTextColor="#999"
                                            />
                                        </>
                                    )}

                                    {editField === 'phone' && (
                                        <>
                                            <Text style={styles.label}>Country Code</Text>
                                            <Picker
                                                selectedValue={tempPhoneCountryCode}
                                                style={[
                                                    styles.picker,
                                                    {
                                                        backgroundColor,
                                                        color: textColor,
                                                    }
                                                ]}
                                                onValueChange={(value) => {
                                                    setTempPhoneCountryCode(value);
                                                }}
                                                itemStyle={{
                                                    color: textColor,
                                                }}
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
                                            <Text style={styles.label}>New Phone (local part)</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                keyboardType="number-pad"
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                placeholder="Enter local part"
                                                placeholderTextColor="#999"
                                            />
                                            <Text style={styles.label}>Password (required)</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                secureTextEntry
                                                value={editPassword}
                                                onChangeText={setEditPassword}
                                                placeholder="Enter your password"
                                                placeholderTextColor="#999"
                                            />
                                        </>
                                    )}

                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                            onPress={closeEditModal}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#FF6200' }]}
                                            onPress={handleSaveValue}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}

                            {needOtpStep && (
                                <>
                                    <Text style={styles.sectionDesc}>
                                        Please enter the OTP code we sent to verify your change.
                                    </Text>
                                    <Text style={styles.label}>OTP Code</Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={otpValue}
                                        onChangeText={setOtpValue}
                                        keyboardType="number-pad"
                                        placeholderTextColor="#999"
                                        placeholder="Enter OTP"
                                    />
                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                            onPress={closeEditModal}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.modalButton,
                                                { backgroundColor: otpValue ? '#FF6200' : '#ccc' },
                                            ]}
                                            onPress={otpValue ? handleVerifyOtp : undefined}
                                            disabled={!otpValue}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Verify</Text>
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
                            <Text style={styles.modalTitle}>Enter Address OTP</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={addressOtp}
                                onChangeText={setAddressOtp}
                                keyboardType="number-pad"
                                placeholderTextColor="#999"
                                placeholder="OTP Code"
                            />
                            <View style={styles.modalButtonRow}>
                                <TouchableOpacity
                                    style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                    onPress={closeAddressModal}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.modalButton,
                                        { backgroundColor: addressOtp ? '#FF6200' : '#ccc' },
                                    ]}
                                    disabled={!addressOtp}
                                    onPress={handleValidateAddressOtp}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '600' }}>Validate</Text>
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
                                    <Text style={styles.modalTitle}>Enter your phone number</Text>
                                    <Text style={styles.label}>Country Code</Text>
                                    <Picker
                                        selectedValue={tempPhoneCountryCode}
                                        style={[
                                            styles.picker,
                                            {
                                                backgroundColor,
                                                color: textColor,
                                            }
                                        ]}
                                        itemStyle={{
                                            color: textColor,
                                        }}
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
                                        placeholder="Phone number"
                                        placeholderTextColor="#999"
                                    />
                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                            onPress={closeCompletePhoneModal}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#FF6200' }]}
                                            onPress={handleSendSmsOtp}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Send OTP</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.modalTitle}>Enter OTP Code</Text>
                                    <Text style={{ marginBottom: 10 }}>
                                        We sent an SMS to {tempPhoneCountryCode}
                                        {tempPhone}
                                    </Text>
                                    <TextInput
                                        style={styles.modalInput}
                                        value={tempOtp}
                                        onChangeText={setTempOtp}
                                        keyboardType="number-pad"
                                        placeholder="OTP code"
                                        placeholderTextColor="#999"
                                    />
                                    <View style={styles.modalButtonRow}>
                                        <TouchableOpacity
                                            style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                                            onPress={closeCompletePhoneModal}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.modalButton,
                                                { backgroundColor: tempOtp ? '#FF6200' : '#ccc' },
                                            ]}
                                            disabled={!tempOtp}
                                            onPress={handleValidateSmsOtp}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '600' }}>Verify</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>

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

    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    tabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabItemActive: {
        borderBottomWidth: 3,
        borderBottomColor: '#FF6200',
    },
    tabText: {
        fontSize: 14,
        color: '#666',
    },
    tabTextActive: {
        color: '#FF6200',
        fontWeight: '600',
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
    },
    sectionDesc: {
        fontSize: 13,
        color: '#666',
        marginBottom: 10,
    },
    label: {
        marginTop: 10,
        fontWeight: '600',
        marginBottom: 5,
    },

    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginVertical: 5,
    },
    inputRow: {
        flexDirection: 'row',
        marginTop: 10,
    },

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

    updateButton: {
        marginTop: 15,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },

    editBtn: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        borderRadius: 4,
        marginBottom: 10,
        marginTop: 5,
        backgroundColor: '#e0e0e0',
    },
    editBtnText: {
        color: '#333',
        fontWeight: '600',
    },

    billingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    verifyInfoText: {
        fontSize: 13,
        color: '#666',
        marginVertical: 5,
    },
    verifyButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 5,
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginTop: 5,
    },
    verifyButtonText: {
        color: '#fff',
        fontWeight: '600',
    },

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
});
