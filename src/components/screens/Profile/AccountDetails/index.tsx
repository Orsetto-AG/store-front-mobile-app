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
    Platform,
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

    const [email, setEmail] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);

    const [phoneNumber, setPhoneNumber] = useState('');
    const [isPhoneVerified, setIsPhoneVerified] = useState(false);

    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [birthday, setBirthday] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [languageCode, setLanguageCode] = useState('');

    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [street, setStreet] = useState('');
    const [streetNumber, setStreetNumber] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');

    const [showBilling, setShowBilling] = useState(false);
    const [billingStreet, setBillingStreet] = useState('');
    const [billingStreetNumber, setBillingStreetNumber] = useState('');
    const [billingZipCode, setBillingZipCode] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingCountry, setBillingCountry] = useState('');

    const [profileIncomplete, setProfileIncomplete] = useState(false);
    const [phoneOnlyMissing, setPhoneOnlyMissing] = useState(false);

    // Modal (Edit & Verify)
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editField, setEditField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [editPassword, setEditPassword] = useState<string>('');

    const [needOtpStep, setNeedOtpStep] = useState(false);
    const [otpValue, setOtpValue] = useState<string>('');

    const [pendingFieldToVerify, setPendingFieldToVerify] = useState<'email' | 'phone' | null>(null);
    const [pendingNewValue, setPendingNewValue] = useState<string>('');

    useEffect(() => {
        fetchUserData();
    }, []);

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
                throw new Error('Kullanıcı bilgisi alınamadı.');
            }
            const data = await response.json();
            const user = data.data.user;

            setEmail(user.email || '');
            setIsEmailVerified(!!user.isCompletedEmailOtpVerification);

            setPhoneNumber(user.phone || '');
            setIsPhoneVerified(!!user.isCompletedPhoneOtpVerification);

            setUsername(user.username || '');
            setName(user.firstName || '');
            setBirthday(user.birthday ? moment(user.birthday).format('DD-MM-YYYY') : '');
            setGender(user.gender || '');
            setLanguageCode(user.languageCode || '');

            setStreet(user.street || '');
            setStreetNumber(user.streetNumber || '');
            setZipCode(user.zipCode || '');
            setCity(user.city || '');
            setCountry(user.country || '');

            if (user.billingAddress) {
                setShowBilling(true);
                setBillingStreet(user.billingAddress?.street || '');
                setBillingStreetNumber(user.billingAddress?.streetNumber || '');
                setBillingZipCode(user.billingAddress?.zipCode || '');
                setBillingCity(user.billingAddress?.city || '');
                setBillingCountry(user.billingAddress?.country || '');
            }

            const isPhoneMissing = !user.isCompletedPhoneOtpVerification;
            const isAddressMissing = !user.isCompletedAddressVerification;
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
            Alert.alert('Hata', error.message);
        }
    };

    // Modal Aç / Kapa
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

    // Değer Kaydet
    const handleSaveValue = async () => {
        if (!editField) return;
        try {
            const token = await AsyncStorage.getItem('token');
            let endpoint = '';
            let method = 'PUT';
            let bodyObj: any = {};

            if (editField === 'email') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-email';
                bodyObj = {
                    newEmailId: editValue,
                    password: editPassword,
                };
            } else if (editField === 'phone') {
                endpoint = 'https://api.orsetto.ch/api/customer/change-phone-number';
                bodyObj = {
                    newPhoneNumber: editValue,
                    password: editPassword,
                };
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
                throw new Error(errMsg || 'Güncelleme başarısız');
            }

            Alert.alert('Başarılı', `${editField} değiştirildi. Lütfen doğrulayın (gerekirse).`);

            // Eger email/phone ise OTP step
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
                // OTP gerekmeyen alanlar: modal kapat
                closeEditModal();
                fetchUserData();
            }
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        }
    };

    // OTP Verify
    const handleVerifyOtp = async () => {
        if (!pendingFieldToVerify || !pendingNewValue) {
            return;
        }
        try {
            const token = await AsyncStorage.getItem('token');
            let endpoint = 'PUT';
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
                throw new Error(errMsg || 'Doğrulama hatası');
            }

            // Başarılı
            Alert.alert('Başarılı', 'Doğrulama tamamlandı.');
            if (pendingFieldToVerify === 'email') {
                setIsEmailVerified(true);
            } else {
                setIsPhoneVerified(true);
            }

            closeEditModal();
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        }
    };

    // Hesap Sil
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
                throw new Error('Hesap silinirken hata oluştu');
            }
            Alert.alert('Başarılı', 'Hesabınız silinmiştir!');
            // logout() veya başka işlem
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        }
    };

    // Şifre Değişikliği
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
                throw new Error('Şifre değiştirilemedi.');
            }
            Alert.alert('Başarılı', 'Şifreniz güncellendi!');
            setOldPassword('');
            setNewPassword('');
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        }
    };

    // Adres
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
                throw new Error('Adres güncelleme başarısız.');
            }
            Alert.alert('Başarılı', 'Adres güncellendi!');
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        }
    };

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
                throw new Error('Billing adres güncelleme başarısız.');
            }
            Alert.alert('Başarılı', 'Billing adres güncellendi!');
            fetchUserData();
        } catch (error: any) {
            Alert.alert('Hata', error.message);
        }
    };

    // Profil Tamamlama
    const handleCompleteProfile = () => {
        if (phoneOnlyMissing) {
            Alert.alert('Bilgi', 'Sadece telefon bilgisini güncellemelisiniz.');
        } else {
            Alert.alert('Bilgi', 'Profilin eksik kısımlarını doldurmalısınız.');
        }
    };

    // Sekme Barı
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
        <ScrollView style={{ flex: 1, padding: 15 }}>
            <Text style={styles.sectionTitle}>Profil bilgileri</Text>
            <Text style={styles.sectionDesc}>
                Burada kullanıcı bilgilerini düzenleyebilirsiniz.
            </Text>

            {/* Ad & Soyad (username) */}
            <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text>Ad</Text>
                    <TextInput style={styles.input} value={name} editable={false} />
                </View>

                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text>Username</Text>
                    <TextInput style={styles.input} value={username} editable={false} />
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('username', username)}>
                        <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Doğum Tarihi */}
            <Text style={{ marginTop: 10 }}>Doğum tarihi</Text>
            <TextInput style={styles.input} value={birthday} editable={false} />

            {/* Cinsiyet */}
            <Text style={{ marginTop: 10 }}>Cinsiyet</Text>
            <View style={styles.genderContainer}>
                <TouchableOpacity
                    style={[
                        styles.genderOption,
                        gender === 'female' && styles.genderOptionSelected,
                    ]}
                    disabled
                >
                    <Text>Kadın</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.genderOption,
                        gender === 'male' && styles.genderOptionSelected,
                    ]}
                    disabled
                >
                    <Text>Erkek</Text>
                </TouchableOpacity>
            </View>

            {/* languageCode */}
            <Text style={styles.label}>Dil (languageCode)</Text>
            <TextInput style={styles.input} value={languageCode} editable={false} />
            <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal('languageCode', languageCode)}
            >
                <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>İletişim bilgileri</Text>

            {/* EMAIL */}
            <Text>
                Email{' '}
                {isEmailVerified ? (
                    <Text style={{ color: 'green' }}>(Verified ✅)</Text>
                ) : (
                    <Text style={{ color: 'red' }}>(Not Verified ❌)</Text>
                )}
            </Text>
            <TextInput style={styles.input} value={email} editable={false} />
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('email', email)}>
                <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            {/* PHONE */}
            <Text style={{ marginTop: 10 }}>
                Telefon{' '}
                {isPhoneVerified ? (
                    <Text style={{ color: 'green' }}>(Verified ✅)</Text>
                ) : (
                    <Text style={{ color: 'red' }}>(Not Verified ❌)</Text>
                )}
            </Text>
            <TextInput style={styles.input} value={phoneNumber} editable={false} />
            <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal('phone', phoneNumber)}>
                <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: 'red', marginTop: 20 }]}
                onPress={handleDeleteAccount}
            >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Hesabımı Sil</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    // PASSWORD TAB
    const renderPasswordTab = () => (
        <View style={{ flex: 1, padding: 15 }}>
            <Text style={styles.sectionTitle}>Şifre Değişikliği</Text>
            <Text style={styles.sectionDesc}>
                Şifreniz en az bir harf, rakam veya özel karakter içermeli.
                Ayrıca en az 8 karakterden oluşmalı.
            </Text>

            <Text>Mevcut Şifre</Text>
            <TextInput
                style={styles.input}
                secureTextEntry
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Mevcut şifre"
            />

            <Text>Yeni Şifre</Text>
            <TextInput
                style={styles.input}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Yeni şifre"
            />

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#FF6200' }]}
                onPress={handleChangePassword}
            >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Güncelle</Text>
            </TouchableOpacity>
        </View>
    );

    // ADDRESS TAB
    const renderAddressTab = () => (
        <ScrollView style={{ flex: 1, padding: 15 }}>
            <Text style={styles.sectionTitle}>Main Address</Text>
            <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text>Postcode</Text>
                    <TextInput
                        style={styles.input}
                        value={zipCode}
                        onChangeText={setZipCode}
                        placeholder="Zip code"
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text>City</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
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
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text>House no</Text>
                    <TextInput
                        style={styles.input}
                        value={streetNumber}
                        onChangeText={setStreetNumber}
                        placeholder="House no."
                    />
                </View>
            </View>

            <Text style={{ marginTop: 10 }}>Country</Text>
            <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder="Country"
            />

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#FF6200', marginTop: 10 }]}
                onPress={handleChangeAddress}
            >
                <Text style={{ color: '#fff', fontWeight: '600' }}>SAVE Main Address</Text>
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
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>City</Text>
                            <TextInput
                                style={styles.input}
                                value={billingCity}
                                onChangeText={setBillingCity}
                                placeholder="City"
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
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 5 }}>
                            <Text>House no</Text>
                            <TextInput
                                style={styles.input}
                                value={billingStreetNumber}
                                onChangeText={setBillingStreetNumber}
                                placeholder="House no."
                            />
                        </View>
                    </View>

                    <Text style={{ marginTop: 10 }}>Country</Text>
                    <TextInput
                        style={styles.input}
                        value={billingCountry}
                        onChangeText={setBillingCountry}
                        placeholder="Country"
                    />

                    <TouchableOpacity
                        style={[styles.updateButton, { backgroundColor: '#FF6200', marginTop: 10 }]}
                        onPress={handleChangeBillingAddress}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>SAVE Billing Address</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );

    // Render
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={{ fontSize: 20 }}>{'<'} </Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Account details</Text>
                <TouchableOpacity onPress={fetchUserData} style={styles.refreshButton}>
                    <Text style={{ color: '#FF6200', fontWeight: 'bold' }}>⟳</Text>
                </TouchableOpacity>
            </View>

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

            <View style={{ flex: 1 }}>
                {activeTab === TABS.MEMBERSHIP && renderMembershipTab()}
                {activeTab === TABS.PASSWORD && renderPasswordTab()}
                {activeTab === TABS.ADDRESS && renderAddressTab()}
            </View>

            {/* Modal */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent
                onRequestClose={closeEditModal}
            >
                {/* Yarı saydam arkaplan */}
                <View style={styles.modalBackground}>
                    {/* Kart benzeri container */}
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
                                        />
                                        <Text style={styles.label}>Password (required)</Text>
                                        <TextInput
                                            style={styles.modalInput}
                                            secureTextEntry
                                            value={editPassword}
                                            onChangeText={setEditPassword}
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

                        {/* OTP Step */}
                        {needOtpStep && (
                            <>
                                <Text style={styles.sectionDesc}>
                                    Lütfen değişikliğinizi doğrulamak için OTP kodunu girin.
                                </Text>
                                <Text style={styles.label}>OTP Code</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={otpValue}
                                    onChangeText={setOtpValue}
                                    keyboardType="number-pad"
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
        </SafeAreaView>
    );
};

export default AccountDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    /* HEADER */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        paddingHorizontal: 10,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    backButton: {
        width: 40,
        justifyContent: 'center',
    },
    refreshButton: {
        width: 40,
        alignItems: 'flex-end',
    },

    /* BANNER */
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

    /* TAB BAR */
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

    /* SECTIONS */
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

    /* INPUT */
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
    label: {
        marginTop: 10,
        fontWeight: '600',
        marginBottom: 5,
    },

    /* GENDER */
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

    /* UPDATE BUTTON */
    updateButton: {
        marginTop: 15,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },

    /* EDIT BUTTON (membership tab) */
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

    /* BILLING */
    billingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    /* MODAL BACKGROUND */
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)', // Yarı saydam koyu arkaplan
        justifyContent: 'center',
        alignItems: 'center',
    },
    /* MODAL CARD */
    modalCard: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        // Gölge efekti (iOS & Android)
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
});
