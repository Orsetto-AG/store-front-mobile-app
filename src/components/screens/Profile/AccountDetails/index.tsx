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
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useNavigation } from '@react-navigation/native';

const TABS = {
    MEMBERSHIP: 0,
    PASSWORD: 1,
    ADDRESS: 2,
};

const AccountDetails = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState(TABS.MEMBERSHIP);

    // Email & Phone
    const [email, setEmail] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    // Membership Info
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [languageCode, setLanguageCode] = useState('');

    // Password
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    // Main Address
    const [street, setStreet] = useState('');
    const [streetNumber, setStreetNumber] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [isCompletedAddressVerification, setIsCompletedAddressVerification] = useState(false);

    // Billing Address
    const [showBilling, setShowBilling] = useState(false);
    const [billingStreet, setBillingStreet] = useState('');
    const [billingStreetNumber, setBillingStreetNumber] = useState('');
    const [billingZipCode, setBillingZipCode] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingCountry, setBillingCountry] = useState('');

    // Profile incomplete banner
    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [phoneOnlyMissing, setPhoneOnlyMissing] = useState(false);

    // Edit & Verify Modal
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
    const [tempOtp, setTempOtp] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    // Fetch user data
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
            console.log('USEEERRR', user)

            // Email & Phone
            setEmail(user.email || '');
            setIsEmailVerified(!!user.isCompletedEmailOtpVerification);
            setPhoneNumber(user.mobileNo || '');
            setIsPhoneVerified(!!user.isCompletedPhoneOtpVerification);

            // Membership
            setUsername(user.username || '');
            setName(user.firstName || '');
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



            // Profile incomplete
            const isPhoneMissing = !user.isCompletedPhoneOtpVerification;
            const isAddressMissing = !user.isCompletedEmailOtpVerification;
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
    // =============== COMPLETE PHONE FLOW ===============
    const openCompletePhoneModal = () => {
        setCompletePhoneModalVisible(true);
        setCompletePhoneStep(0);
        setTempPhone('');
        setTempOtp('');
    };
    const closeCompletePhoneModal = () => {
        setCompletePhoneModalVisible(false);
        setCompletePhoneStep(0);
        setTempPhone('');
        setTempOtp('');
    };
    // 1) Send phone OTP
    const handleSendSmsOtp = async () => {
        try {
            if (!tempPhone) {
                Alert.alert('Error', 'Please enter a phone number.');
                return;
            }
            const token = await AsyncStorage.getItem('token');
            const body = { mobileNo: tempPhone };
            const response = await fetch('https://api.orsetto.ch/api/customer/send-otp-sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token || ''}`,
                },
                body: JSON.stringify(body),
            });
            console.log('BODYYY',body)
            if (!response.ok) {
                const errMsg = await response.text();
                throw new Error(errMsg || 'Could not send OTP.');
            }
            const data = await response.json();
            console.log('DEBUG SMS OTP:', data);
            Alert.alert('Success', 'OTP sent to your phone.');
            setCompletePhoneStep(1); // go to OTP step
        } catch (error: any) {
            Alert.alert('Hah', error.message);
           // setCompletePhoneStep(1);
        }
    };

    // 2) Validate phone OTP
    const handleValidateSmsOtp = async () => {
        try {
            if (!tempOtp) {
                Alert.alert('Error', 'Please enter the OTP code.');
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
            // Now phoneNumber is in backend, re-fetch user data:
            closeCompletePhoneModal();
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };
    // if user taps "Complete phone number" in the banner
    const handleCompleteProfile = () => {
        if (phoneOnlyMissing) {
            // open phone-only modal
            openCompletePhoneModal();
        } else {
            Alert.alert('Info', 'You have some missing profile info. Please update.');
        }
    };

    // Edit Modal
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

    // Save updated value
    const handleSaveValue = async () => {
        if (!editField) return;
        try {
            const token = await AsyncStorage.getItem('token');
            let endpoint = '';
            let method = 'PUT';
            let bodyObj: any = {};

            if (editField === 'email') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-email';
                bodyObj = { newEmailId: editValue, password: editPassword };
            } else if (editField === 'phone') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-phone-number';
                bodyObj = { newPhoneNumber: editValue, password: editPassword };
            } else if (editField === 'username') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-username';
                bodyObj = { username: editValue };
            } else if (editField === 'languageCode') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-language';
                bodyObj = { languageCode: editValue };
            } else if (['name', 'birthday', 'gender'].includes(editField)) {
                endpoint = 'https://api.orsetto.ch/api/customer/complete-profile';
                bodyObj = {
                    personal: {
                        firstName: editField === 'name' ? editValue : name,
                        birthday:
                            editField === 'birthday'
                                ? moment(editValue, 'DD-MM-YYYY').format('YYYY-MM-DD')
                                : moment(birthday, 'DD-MM-YYYY').format('YYYY-MM-DD'),
                        gender: editField === 'gender' ? editValue : gender,
                    },
                };
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

            // If email/phone => OTP step
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
                // No OTP needed
                closeEditModal();
                fetchUserData();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Verify OTP
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

    // 1) Send OTP Address
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
            const data = await response.json();
            console.log('DEBUG OTP', data); // log the OTP or related info

            Alert.alert('Success', 'OTP was sent to your address by post.');
            setAddressOtpSent(true);
            await AsyncStorage.setItem('addressOtpSent', 'true');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // 2) Validate Address OTP
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

            setAddressModalVisible(false);
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
            // logout or navigate
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Change password
    const handleChangePassword = async () => {
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
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    // Save Main Address
    const handleChangeAddress = async () => {
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

    // Save Billing
    const handleChangeBillingAddress = async () => {
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


    // Tab bar
    const renderTabBar = () => (
        <View style={styles.tabBar}>
            <TouchableOpacity
                style={[styles.tabItem, activeTab === TABS.MEMBERSHIP && styles.tabItemActive]}
                onPress={() => setActiveTab(TABS.MEMBERSHIP)}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeTab === TABS.MEMBERSHIP && styles.tabTextActive,
                    ]}
                >
                    My membership information
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabItem, activeTab === TABS.PASSWORD && styles.tabItemActive]}
                onPress={() => setActiveTab(TABS.PASSWORD)}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeTab === TABS.PASSWORD && styles.tabTextActive,
                    ]}
                >
                    Password change
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tabItem, activeTab === TABS.ADDRESS && styles.tabItemActive]}
                onPress={() => setActiveTab(TABS.ADDRESS)}
            >
                <Text
                    style={[
                        styles.tabText,
                        activeTab === TABS.ADDRESS && styles.tabTextActive,
                    ]}
                >
                    Edit Address
                </Text>
            </TouchableOpacity>
        </View>
    );

    // MEMBERSHIP TAB
    const renderMembershipTab = () => (
        <ScrollView
            style={{ flex: 1, padding: 15 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.sectionTitle}>Profile details</Text>
            <Text style={styles.sectionDesc}>
                Here you can update your profile information.
            </Text>

            {/* Name & Username */}
            <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text>Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        editable={false}
                        placeholder="Name"
                        placeholderTextColor="#999"
                    />
                </View>

                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text>Username</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        editable={false}
                        placeholder="Username"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('username', username)}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Birthday */}
            <Text style={{ marginTop: 10 }}>Birthday</Text>
            <TextInput
                style={styles.input}
                value={birthday}
                editable={false}
                placeholder="DD-MM-YYYY"
                placeholderTextColor="#999"
            />

            {/* Gender */}
            <Text style={{ marginTop: 10 }}>Gender</Text>
            <View style={styles.genderContainer}>
                <TouchableOpacity
                    style={[
                        styles.genderOption,
                        gender === 'female' && styles.genderOptionSelected,
                    ]}
                    disabled
                >
                    <Text>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.genderOption,
                        gender === 'male' && styles.genderOptionSelected,
                    ]}
                    disabled
                >
                    <Text>Male</Text>
                </TouchableOpacity>
            </View>

            {/* Language Code */}
            <Text style={styles.label}>Language Code</Text>
            <TextInput
                style={styles.input}
                value={languageCode}
                editable={false}
                placeholder="Language"
                placeholderTextColor="#999"
            />
            <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal('languageCode', languageCode)}
            >
                <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Contact information</Text>

            {/* EMAIL */}
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

            {/* PHONE */}
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
                        placeholder="Phone"
                        placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('phone', phoneNumber)}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </>
            ) : (
                // if phone is empty, we hide this part or show "No phone"
                <Text style={{ color: 'gray', marginTop: 10 }}>No phone number yet.</Text>
            )}

            {/* Delete Account Button */}
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteAccount}
            >
                <Image 
                    source={require('../../../../components/images/trash.png')}
                    style={{ width: 20, height: 20, tintColor: '#FF4D4F' }}
                />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // PASSWORD TAB
    const renderPasswordTab = () => (
        <ScrollView
            style={{ flex: 1, padding: 15 }}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.sectionTitle}>Change Password</Text>
            <Text style={styles.sectionDesc}>
                Your password should include at least one letter, number or special character.
                Also it must be at least 8 characters long.
            </Text>

            <Text>Current Password</Text>
            <TextInput
                style={styles.input}
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Current password"
                placeholderTextColor="#999"
            />

            <Text>New Password</Text>
            <TextInput
                style={styles.input}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor="#999"
            />

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#FF6200' }]}
                onPress={handleChangePassword}
            >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Change</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // ADDRESS TAB
    const renderAddressTab = () => (
        <ScrollView
            style={{ flex: 1, padding: 15 }}
            keyboardShouldPersistTaps="handled"
        >
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
                        This code will be delivered to your address via post.
                        You must enter it here to start selling.
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

            <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text>Postcode</Text>
                    <TextInput
                        style={styles.input}
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
                        {showBilling ? 'Hide' : '+ Add Billing Address'}
                    </Text>
                </TouchableOpacity>
            </View>

            {showBilling && (
                <>
                    <View style={styles.inputRow}>
                        <View style={{ flex: 1, marginRight: 5 }}>
                            <Text>Postcode</Text>
                            <TextInput
                                style={styles.input}
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

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <SafeAreaView style={styles.container}>
                {/* HEADER etc. */}
                {/* BANNER if (profileIncomplete) ... */}
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

                {/* TAB BAR */}
                {renderTabBar()}

                {/* CONTENT */}
                {activeTab === TABS.MEMBERSHIP && renderMembershipTab()}
                {activeTab === TABS.PASSWORD && renderPasswordTab()}
                {activeTab === TABS.ADDRESS && renderAddressTab()}

                {/* EDIT & VERIFY MODAL */}
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
                                    {(editField === 'email' || editField === 'phone') && (
                                        <>
                                            <Text style={styles.label}>New {editField}</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                autoCapitalize="none"
                                                keyboardType={editField === 'phone' ? 'phone-pad' : 'email-address'}
                                                placeholderTextColor="#999"
                                                placeholder={`Enter new ${editField}`}
                                            />
                                            <Text style={styles.label}>Password (required)</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                secureTextEntry
                                                value={editPassword}
                                                onChangeText={setEditPassword}
                                                placeholderTextColor="#999"
                                                placeholder="Enter password"
                                            />
                                        </>
                                    )}

                                    {editField === 'birthday' && (
                                        <>
                                            <Text style={styles.label}>New Birthday (DD-MM-YYYY)</Text>
                                            <TextInput
                                                style={styles.modalInput}
                                                value={editValue}
                                                onChangeText={setEditValue}
                                                placeholderTextColor="#999"
                                                placeholder="DD-MM-YYYY"
                                            />
                                        </>
                                    )}

                                    {['username', 'languageCode', 'name', 'gender'].includes(editField || '') &&
                                        !['email', 'phone', 'birthday'].includes(editField || '') && (
                                            <>
                                                <Text style={styles.label}>New Value</Text>
                                                <TextInput
                                                    style={styles.modalInput}
                                                    value={editValue}
                                                    onChangeText={setEditValue}
                                                    placeholderTextColor="#999"
                                                    placeholder="Enter new value"
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
                                        Please enter the OTP code to verify your change.
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
                                    <TextInput
                                        style={styles.modalInput}
                                        value={tempPhone}
                                        onChangeText={setTempPhone}
                                        keyboardType="phone-pad"
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
                                    <Text style={{ marginBottom: 10 }}>We sent an SMS with a code to {tempPhone}</Text>
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
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
};

export default AccountDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
    },
    /* HEADER */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: Platform.OS === 'ios' ? 84 : 56,
        paddingTop: Platform.OS === 'ios' ? 44 : 0,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.08)',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    headerTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    backButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 18,
    },
    refreshButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
    },

    /* BANNER */
    profileBanner: {
        backgroundColor: '#FFF9F0',
        padding: 20,
        margin: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 102, 0, 0.15)',
        shadowColor: '#FF6600',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    profileBannerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FF6600',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    profileBannerDesc: {
        color: '#666',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
        letterSpacing: -0.2,
    },
    profileBannerButton: {
        backgroundColor: '#FF6600',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        alignSelf: 'flex-start',
        shadowColor: '#FF6600',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
    },

    /* TAB BAR */
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.06)',
        paddingHorizontal: 4,
        height: 44,
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    tabItemActive: {
        borderBottomWidth: 2,
        borderBottomColor: '#FF6600',
    },
    tabText: {
        fontSize: 13,
        color: '#666',
        letterSpacing: -0.2,
    },
    tabTextActive: {
        color: '#FF6600',
        fontWeight: '600',
    },

    /* SECTIONS */
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: 20,
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    sectionDesc: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 16,
        letterSpacing: -0.2,
    },

    /* LABELS */
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4A4A4A',
        marginTop: 12,
        marginBottom: 4,
        letterSpacing: -0.2,
    },

    /* INPUT */
    input: {
        height: 44,
        borderWidth: 1,
        borderColor: '#E5E9EC',
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 14,
        color: '#1A1A1A',
        backgroundColor: '#fff',
        marginVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
        letterSpacing: -0.2,
    },
    inputRow: {
        flexDirection: 'row',
        marginTop: 12,
    },

    /* EDIT BUTTON */
    editBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        alignSelf: 'flex-start',
        borderRadius: 8,
        marginTop: 8,
        backgroundColor: '#F5F7F9',
        flexDirection: 'row',
        alignItems: 'center',
    },
    editBtnText: {
        color: '#4A4A4A',
        fontWeight: '500',
        fontSize: 13,
        letterSpacing: -0.2,
    },

    /* VERIFY BUTTON */
    verifyButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginVertical: 8,
        backgroundColor: '#FF6600',
        shadowColor: '#FF6600',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
    },
    verifyButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
        letterSpacing: -0.2,
    },
    verifyInfoText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginVertical: 8,
        letterSpacing: -0.2,
    },

    /* UPDATE BUTTON */
    updateButton: {
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#FF6600',
        shadowColor: '#FF6600',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },

    /* MODAL */
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 6,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    modalInput: {
        height: 44,
        borderWidth: 1,
        borderColor: '#E5E9EC',
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 14,
        color: '#1A1A1A',
        backgroundColor: '#fff',
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    modalButtonRow: {
        flexDirection: 'row',
        marginTop: 24,
    },
    modalButton: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },

    /* DELETE ACCOUNT */
    deleteButton: {
        marginTop: 32,
        marginBottom: 20,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 10,
        backgroundColor: '#FFF1F0',
        borderWidth: 1,
        borderColor: 'rgba(255, 77, 79, 0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        shadowColor: '#FF4D4F',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    deleteButtonText: {
        color: '#FF4D4F',
        fontWeight: '600',
        fontSize: 13,
        marginLeft: 8,
        letterSpacing: -0.2,
    },

    /* GENDER */
    genderContainer: {
        flexDirection: 'row',
        marginVertical: 12,
    },
    genderOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E9EC',
        padding: 14,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    genderOptionSelected: {
        borderColor: '#FF6600',
        backgroundColor: '#FFF9F0',
    },

    /* BILLING */
    billingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 36,
        marginBottom: 20,
    },
});
