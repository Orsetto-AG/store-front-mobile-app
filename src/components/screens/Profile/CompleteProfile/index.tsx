import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Switch,
    SafeAreaView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const CompleteProfileModal = ({ navigation }) => {
    // Adım takibi: 0 => Form (Kontodaten), 1 => SMS-Verifizierung
    const [currentStep, setCurrentStep] = useState(0);

    // State: Privat/Gewerbe
    const [isCompany, setIsCompany] = useState(false);

    // Kişisel veri state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthday, setBirthday] = useState<Date | null>(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
    const [languageCode, setLanguageCode] = useState<'de' | 'en' | 'fr' | 'it'>('de');

    // Adres
    const [country, setCountry] = useState('Switzerland');
    const [zipCode, setZipCode] = useState('');
    const [city, setCity] = useState('');
    const [street, setStreet] = useState('');
    const [streetNumber, setStreetNumber] = useState('');
    const [addressDetail, setAddressDetail] = useState(''); // z.B. Etage, Zimmernummer
    const [differentBilling, setDifferentBilling] = useState(false);

    // Billing Adres
    const [billingZipCode, setBillingZipCode] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingStreet, setBillingStreet] = useState('');
    const [billingStreetNumber, setBillingStreetNumber] = useState('');
    const [billingDetail, setBillingDetail] = useState('');

    // Şirket (Gewerbe) veri state
    const [companyName, setCompanyName] = useState('');
    const [isTradeRegistered, setIsTradeRegistered] = useState(false);
    const [tradeRegisteredNumber, setTradeRegisteredNumber] = useState('');
    const [isRegisterOwner, setIsRegisterOwner] = useState(false);

    // Telefon doğrulama (Step 2)
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Kullanıcı me verilerini çek
    const fetchUserData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const resp = await axios.get('https://api.orsetto.ch/api/customer/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const user = resp.data.data.user;

            // Kişisel veriler
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
            if (user.birthday) {
                setBirthday(new Date(user.birthday));
            } else {
                setBirthday(new Date());
            }
            setGender(user.gender || 'male');
            setLanguageCode((user.languageCode as any) || 'de'); // type-cast
            // Adres
            setCountry(user.country || 'Switzerland');
            setZipCode(user.zipCode || '');
            setCity(user.city || '');
            setStreet(user.street || '');
            setStreetNumber(user.streetNumber || '');
            setAddressDetail(user.otherAddressInfo || '');

            // Fatura
            const hasBilling =
                user.billingStreet ||
                user.billingStreetNumber ||
                user.billingZipCode ||
                user.billingCity;
            if (hasBilling) {
                setDifferentBilling(true);
                setBillingStreet(user.billingStreet || '');
                setBillingStreetNumber(user.billingStreetNumber || '');
                setBillingZipCode(user.billingZipCode || '');
                setBillingCity(user.billingCity || '');
                setBillingDetail(user.billingOtherInfo || '');
            }

            // Gewerbe
            if (user.isCompany) {
                setIsCompany(true);
                setCompanyName(user.companyName || '');
                setIsTradeRegistered(!!user.isTradeRegistered);
                setTradeRegisteredNumber(user.tradeRegisteredNumber || '');
                setIsRegisterOwner(!!user.isRegisterOwner);
            } else {
                setIsCompany(false);
            }

            // Telefon
            setPhoneNumber(user.mobileNo || '');
        } catch (error) {
            console.log(error);
            Alert.alert('Fehler', 'Konnte Nutzerdaten nicht abrufen');
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    // ADIM 1 KAYDETME: Bilgileri API'ye gönder
    const handleSaveProfileData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const requestBody = {
                personal: {
                    firstName,
                    lastName,
                    birthday: birthday ? birthday.toISOString().split('T')[0] : null,
                    gender,
                    languageCode,
                    country,
                    zipCode,
                    city,
                    street,
                    streetNumber,
                    otherAddressInfo: addressDetail,
                },
                company: isCompany
                    ? {
                        companyName,
                        isTradeRegistered,
                        tradeRegisteredNumber,
                        isRegisterOwner,
                    }
                    : null,
                billing: differentBilling
                    ? {
                        billingStreet,
                        billingStreetNumber,
                        billingZipCode,
                        billingCity,
                        billingOtherInfo: billingDetail,
                    }
                    : null,
            };

            await axios.put('https://api.orsetto.ch/api/customer/complete-profile', requestBody, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('Profile data saved successfully.');
        } catch (error) {
            console.log(error);
            Alert.alert('Hata', 'Profil kaydedilemedi');
        }
    };

    // Step 1: Form kaydı + step geçişi
    const handleGoToStep2 = async () => {
        await handleSaveProfileData(); // bilgileri API'ye kaydediyoruz
        setCurrentStep(1);
    };

    // Step 2: Telefon doğrulama
    const handleSendOtp = async () => {
        if (!phoneNumber) {
            Alert.alert('Hata', 'Telefon numarası giriniz');
            return;
        }
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                'https://api.orsetto.ch/api/customer/send-otp-sms',
                { mobileNo: phoneNumber },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setOtpSent(true);
            Alert.alert('Başarılı', 'OTP gönderildi');
        } catch (error) {
            console.log(error);
            Alert.alert('Hata', 'OTP gönderilemedi');
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpCode) {
            Alert.alert('Hata', 'Lütfen OTP kodunu giriniz');
            return;
        }
        try {
            const token = await AsyncStorage.getItem('token');
            await axios.post(
                'https://api.orsetto.ch/api/customer/otp-validation-sms',
                { otp: parseInt(otpCode, 10) },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            Alert.alert('Başarılı', 'Telefonunuz doğrulandı!');
            // Dilerseniz handleSaveProfileData() tekrar çağırıp phone'u da update edebilirsiniz.
            navigation.goBack();
        } catch (error) {
            console.log(error);
            Alert.alert('Hata', 'OTP doğrulama başarısız');
        }
    };

    // Step Indicator Top Bar
    const renderStepBar = () => {
        return (
            <View style={styles.stepBar}>
                <View style={styles.stepItem}>
                    <Text
                        style={[
                            styles.stepTitle,
                            currentStep === 0 ? styles.stepActive : styles.stepInactive,
                        ]}
                    >
                        Kontodaten
                    </Text>
                    <Text
                        style={[
                            styles.stepSubtitle,
                            currentStep === 0 ? styles.stepActive : styles.stepInactive,
                        ]}
                    >
                        Erforderliche Informationen
                    </Text>
                </View>
                <View style={styles.stepItem}>
                    <Text
                        style={[
                            styles.stepTitle,
                            currentStep === 1 ? styles.stepActive : styles.stepInactive,
                        ]}
                    >
                        SMS-Verifizierung
                    </Text>
                    <Text
                        style={[
                            styles.stepSubtitle,
                            currentStep === 1 ? styles.stepActive : styles.stepInactive,
                        ]}
                    >
                        Nächste Stufe
                    </Text>
                </View>
            </View>
        );
    };

    // --- Step 1: FORM EKRANI ---
    const renderStep1 = () => (
        <ScrollView style={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.pageTitle}>Account vervollständigen</Text>

            {/* Privatperson / Gewerbe Toggle */}
            <View style={styles.accountTypeRow}>
                <TouchableOpacity
                    style={[
                        styles.accountTypeButton,
                        !isCompany && styles.accountTypeButtonActive,
                    ]}
                    onPress={() => setIsCompany(false)}
                >
                    <Text
                        style={[
                            styles.accountTypeButtonText,
                            !isCompany && styles.accountTypeButtonTextActive,
                        ]}
                    >
                        Privatperson
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.accountTypeButton,
                        isCompany && styles.accountTypeButtonActive,
                    ]}
                    onPress={() => setIsCompany(true)}
                >
                    <Text
                        style={[
                            styles.accountTypeButtonText,
                            isCompany && styles.accountTypeButtonTextActive,
                        ]}
                    >
                        Gewerbe
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionHeader}>Persönliche Informationen</Text>

            {/* Vorname / Nachname */}
            <View style={styles.twoColumns}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text style={styles.label}>Vorname</Text>
                    <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Vorname"
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text style={styles.label}>Nachname</Text>
                    <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Nachname"
                    />
                </View>
            </View>

            {/* Geburtstag / Geschlecht */}
            <View style={styles.twoColumns}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text style={styles.label}>Geburtsdatum</Text>
                    <TouchableOpacity
                        style={[styles.input, { justifyContent: 'center' }]}
                        onPress={() => setIsDatePickerOpen(true)}
                    >
                        <Text>
                            {birthday
                                ? birthday.toLocaleDateString()
                                : 'TT.MM.JJJJ'}
                        </Text>
                    </TouchableOpacity>
                    <DatePicker
                        modal
                        open={isDatePickerOpen}
                        date={birthday || new Date()}
                        mode="date"
                        onConfirm={(date) => {
                            setIsDatePickerOpen(false);
                            setBirthday(date);
                        }}
                        onCancel={() => {
                            setIsDatePickerOpen(false);
                        }}
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text style={styles.label}>Geschlecht</Text>
                    <View style={[styles.pickerContainer, { zIndex: 2 }]}>
                        <Picker
                            selectedValue={gender}
                            onValueChange={(val) => setGender(val)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Männlich" value="male" />
                            <Picker.Item label="Weiblich" value="female" />
                            <Picker.Item label="Andere" value="other" />
                        </Picker>
                    </View>
                </View>
            </View>

            {/* Kontaktsprache */}
            <View>
                <Text style={styles.label}>Kontaktsprache</Text>
                <View style={[styles.pickerContainer, { zIndex: 2 }]}>
                    <Picker
                        selectedValue={languageCode}
                        onValueChange={(val) => setLanguageCode(val)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Deutsch" value="de" />
                        <Picker.Item label="English" value="en" />
                        <Picker.Item label="Français" value="fr" />
                        <Picker.Item label="Italiano" value="it" />
                    </Picker>
                </View>
            </View>

            <Text style={styles.sectionHeader}>Adresse</Text>
            {/* Land */}
            <View>
                <Text style={styles.label}>Land</Text>
                <View style={[styles.pickerContainer, { zIndex: 1 }]}>
                    <Picker
                        selectedValue={country}
                        onValueChange={(val) => setCountry(val)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Land auswählen" value="" />
                        <Picker.Item label="Schweiz" value="Switzerland" />
                        <Picker.Item label="Deutschland" value="Germany" />
                        <Picker.Item label="Österreich" value="Austria" />
                    </Picker>
                </View>
            </View>

            {/* PLZ / Ort */}
            <View style={styles.twoColumns}>
                <View style={{ flex: 1, marginRight: 5 }}>
                    <Text style={styles.label}>PLZ</Text>
                    <TextInput
                        style={styles.input}
                        value={zipCode}
                        onChangeText={setZipCode}
                        placeholder="PLZ"
                    />
                </View>
                <View style={{ flex: 1, marginLeft: 5 }}>
                    <Text style={styles.label}>Ort</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Ort"
                    />
                </View>
            </View>

            {/* Strasse / Nr */}
            <View style={styles.twoColumns}>
                <View style={{ flex: 1.5, marginRight: 5 }}>
                    <Text style={styles.label}>Strasse</Text>
                    <TextInput
                        style={styles.input}
                        value={street}
                        onChangeText={setStreet}
                        placeholder="Strasse"
                    />
                </View>
                <View style={{ flex: 0.8, marginLeft: 5 }}>
                    <Text style={styles.label}>Hausnummer</Text>
                    <TextInput
                        style={styles.input}
                        value={streetNumber}
                        onChangeText={setStreetNumber}
                        placeholder="Nr."
                    />
                </View>
            </View>

            {/* Adresszusatz */}
            <View style={{ marginBottom: 15 }}>
                <Text style={styles.label}>Addresszusatz (Optional)</Text>
                <TextInput
                    style={styles.input}
                    value={addressDetail}
                    onChangeText={setAddressDetail}
                    placeholder="z.B. Etage, Zimmernummer"
                />
            </View>

            {/* Rechnungadresse Toggle */}
            <View style={styles.toggleRow}>
                <Text style={{ flex: 1, fontWeight: '500' }}>
                    Ist die Rechnungsadresse anders als die Hauptadresse?
                </Text>
                <Switch
                    value={differentBilling}
                    onValueChange={(val) => setDifferentBilling(val)}
                />
            </View>

            {/* Fatura adresi alanları */}
            {differentBilling && (
                <View style={{ marginTop: 10, backgroundColor: '#fafafa', padding: 10, borderRadius: 6 }}>
                    <Text style={styles.label}>PLZ</Text>
                    <TextInput
                        style={styles.input}
                        value={billingZipCode}
                        onChangeText={setBillingZipCode}
                        placeholder="PLZ"
                    />
                    <Text style={styles.label}>Ort</Text>
                    <TextInput
                        style={styles.input}
                        value={billingCity}
                        onChangeText={setBillingCity}
                        placeholder="Ort"
                    />
                    <Text style={styles.label}>Strasse</Text>
                    <TextInput
                        style={styles.input}
                        value={billingStreet}
                        onChangeText={setBillingStreet}
                        placeholder="Strasse"
                    />
                    <Text style={styles.label}>Hausnummer</Text>
                    <TextInput
                        style={styles.input}
                        value={billingStreetNumber}
                        onChangeText={setBillingStreetNumber}
                        placeholder="Nr."
                    />
                    <Text style={styles.label}>Addresszusatz (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={billingDetail}
                        onChangeText={setBillingDetail}
                        placeholder="z.B. Etage, Zimmernummer"
                    />
                </View>
            )}

            {/* Gewerbe bilgileri */}
            {isCompany && (
                <>
                    <Text style={styles.sectionHeader}>Geschäftsinformationen</Text>
                    <Text style={styles.label}>Firmenname</Text>
                    <TextInput
                        style={styles.input}
                        value={companyName}
                        onChangeText={setCompanyName}
                        placeholder="Firmenname"
                    />
                    <View style={styles.toggleRow}>
                        <Text style={{ flex: 1 }}>Handelsregister?</Text>
                        <Switch
                            value={isTradeRegistered}
                            onValueChange={(val) => setIsTradeRegistered(val)}
                        />
                    </View>
                    {isTradeRegistered && (
                        <>
                            <Text style={styles.label}>Registernummer</Text>
                            <TextInput
                                style={styles.input}
                                value={tradeRegisteredNumber}
                                onChangeText={setTradeRegisteredNumber}
                                placeholder="CH-ZH-xxxxx"
                            />
                        </>
                    )}
                    <View style={styles.toggleRow}>
                        <Text style={{ flex: 1 }}>Zeichnungsberechtigung?</Text>
                        <Switch
                            value={isRegisterOwner}
                            onValueChange={(val) => setIsRegisterOwner(val)}
                        />
                    </View>
                </>
            )}

            {/* Butonlar */}
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={[styles.cancelButton]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.cancelButtonText}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.confirmButton]}
                    onPress={handleGoToStep2}
                >
                    <Text style={styles.confirmButtonText}>Bestätigen und Weiter</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    // --- Step 2: SMS VERIFIKASYON EKRANI ---
    const renderStep2 = () => (
        <View style={styles.step2Container}>
            <Text style={styles.pageTitle}>SMS-Verifizierung</Text>
            <Text style={styles.helpText}>
                Bitte geben Sie Ihre Telefonnummer ein und fordern Sie einen Code an.
            </Text>
            <Text style={styles.label}>Telefonnummer</Text>
            <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="+41..."
                keyboardType="phone-pad"
            />

            {!otpSent ? (
                <TouchableOpacity style={styles.orangeButton} onPress={handleSendOtp}>
                    <Text style={styles.orangeButtonText}>Code senden</Text>
                </TouchableOpacity>
            ) : (
                <>
                    <Text style={styles.label}>Bestätigungscode</Text>
                    <TextInput
                        style={styles.input}
                        value={otpCode}
                        onChangeText={setOtpCode}
                        placeholder="z.B. 123456"
                        keyboardType="number-pad"
                    />
                    <TouchableOpacity style={styles.orangeButton} onPress={handleVerifyOtp}>
                        <Text style={styles.orangeButtonText}>Code bestätigen</Text>
                    </TouchableOpacity>
                </>
            )}

            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setCurrentStep(0)}
                >
                    <Text style={styles.cancelButtonText}>Zurück</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.confirmButtonOutline}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.confirmButtonText, { color: '#FF6200' }]}>Fertig</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={styles.brandHeader}>
                <Text style={styles.brandText}>Orsetto</Text>
            </View>

            {/* Üst kısım step bar */}
            <View>
                {renderStepBar()}
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {currentStep === 0 ? renderStep1() : renderStep2()}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CompleteProfileModal;

const styles = StyleSheet.create({
    brandHeader: {
        alignItems: 'center',
        marginVertical: 8,
    },
    brandText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF6200',
    },
    stepBar: {
        flexDirection: 'row',
        backgroundColor: '#f7f7f7',
        paddingVertical: 10,
        justifyContent: 'space-around',
    },
    stepItem: {
        alignItems: 'center',
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    stepSubtitle: {
        fontSize: 12,
    },
    stepActive: {
        color: '#FF6200',
    },
    stepInactive: {
        color: '#999',
    },

    scrollContent: {
        flex: 1,
        padding: 20,
    },
    pageTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    accountTypeRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    accountTypeButton: {
        flex: 1,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingVertical: 12,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    accountTypeButtonActive: {
        backgroundColor: '#FF6200',
        borderColor: '#FF6200',
    },
    accountTypeButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    accountTypeButtonTextActive: {
        color: '#fff',
    },

    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        marginBottom: 10,
        overflow: 'hidden',
    },
    picker: {
        height: 44,
    },
    twoColumns: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    cancelButton: {
        flex: 1,
        marginRight: 5,
        backgroundColor: '#ccc',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    confirmButton: {
        flex: 1,
        marginLeft: 5,
        backgroundColor: '#FF6200',
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    confirmButtonOutline: {
        flex: 1,
        marginLeft: 5,
        borderColor: '#FF6200',
        borderWidth: 1,
        paddingVertical: 12,
        borderRadius: 6,
        alignItems: 'center',
    },

    // Step 2
    step2Container: {
        flex: 1,
        padding: 20,
    },
    helpText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
    },
    orangeButton: {
        backgroundColor: '#FF6200',
        height: 50,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    orangeButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
});
