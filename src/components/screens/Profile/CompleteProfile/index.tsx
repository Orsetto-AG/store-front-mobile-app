import React, { useState, useEffect, useRef } from 'react';
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
    useColorScheme,
    Switch,
    PanResponder,
    Animated
} from 'react-native';
import Modal from 'react-native-modal';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CompleteProfileModalProps {
    isVisible: boolean;
    onClose: () => void;
    onProfileUpdate: () => void;
    profileData: any;
}

const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
                                                                       isVisible,
                                                                       onClose,
                                                                       onProfileUpdate,
                                                                       profileData,
                                                                   }) => {
    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    const colors = {
        background: isDarkMode ? '#1a1a1a' : '#ffffff',
        text: isDarkMode ? '#ffffff' : '#333333',
        border: isDarkMode ? '#404040' : '#dddddd',
        placeholder: isDarkMode ? '#808080' : '#999999',
        dragIndicator: isDarkMode ? '#404040' : '#dddddd',
    };

    // Account tipinin seçili olup olmadığı bilgisini tutuyoruz
    const [isCompany, setIsCompany] = useState(false);

    // Kişisel bilgi state
    const [personalData, setPersonalData] = useState({
        gender: 'male',
        languageCode: 'de',
        firstName: '',
        lastName: '',
        birthday: new Date(),
        street: '',
        streetNumber: '',
        zipCode: '',
        city: '',
        country: 'Switzerland',
        otherAddressInfo: '',
    });

    // Şirket bilgileri state
    const [companyData, setCompanyData] = useState({
        companyName: '',
        isTradeRegistered: false,
        tradeRegisteredNumber: '',
        isRegisterOwner: false, // “Zeichnungsberechtigung”
    });

    const [isDatePickerOpen, setDatePickerOpen] = useState(false);

    // Modal açıldığında veya profileData değiştiğinde input alanlarına verileri doldur
    useEffect(() => {
        if (profileData) {
            // Firma verisi var mı?
            const hasCompanyData = profileData;
            setIsCompany(!!hasCompanyData);

            // Kişisel verileri doldur
            setPersonalData({
                gender: profileData?.gender || 'male',
                languageCode: profileData?.languageCode || 'de',
                firstName: profileData?.firstName || '',
                lastName: profileData?.lastName || '',
                birthday: profileData?.birthday
                    ? new Date(profileData.birthday)
                    : new Date(),
                street: profileData?.street || '',
                streetNumber: profileData?.streetNumber || '',
                zipCode: profileData?.zipCode || '',
                city: profileData?.city || '',
                country: profileData?.country || 'Switzerland',
                otherAddressInfo: profileData?.otherAddressInfo || '',
            });

            // Firma verisi varsa doldur, yoksa sıfırla
            if (hasCompanyData) {
                setCompanyData({
                    companyName: profileData.companyName || '',
                    isTradeRegistered: profileData.isTradeRegistered || false,
                    tradeRegisteredNumber: profileData.tradeRegisteredNumber || '',
                    isRegisterOwner: profileData.isRegisterOwner || false,
                });
            } else {
                setCompanyData({
                    companyName: '',
                    isTradeRegistered: false,
                    tradeRegisteredNumber: '',
                    isRegisterOwner: false,
                });
            }
        }
    }, [profileData]);

    // Profil güncelleme
    const handleUpdate = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            const requestBody = {
                personal: {
                    ...personalData,
                    // Tarihi "YYYY-MM-DD" formatına çevirelim
                    birthday: personalData.birthday.toISOString().split('T')[0],
                },
                company: isCompany ? { ...companyData } : null,
            };

            await axios.put(
                'https://api.orsetto.ch/api/customer/complete-profile',
                requestBody,
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Token ekledik
                    },
                }
            );

            onProfileUpdate();
            onClose();
        } catch (error) {
            console.error('Update error:', error);
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    // Hesap silme
    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            await axios.delete('https://api.orsetto.ch/api/customer/delete-account', {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            });
                            onClose();
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert('Error', 'Failed to delete account');
                        }
                    },
                },
            ]
        );
    };

    // Basit “aşağı sürükle kapat” için react-native-modal ayarları
    return (
        <Modal
            isVisible={isVisible}
            style={styles.modal}
            onSwipeComplete={onClose}
            swipeDirection={['down']}
            propagateSwipe
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    {/* Üstteki çekme çubuğu */}
                    <View
                        style={[styles.dragIndicator, { backgroundColor: colors.dragIndicator }]}
                    />
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                    >
                        <Text style={[styles.title, { color: colors.text }]}>
                            Account vervollständigen
                        </Text>

                        {/* Account tipi seçimi */}
                        <View style={styles.accountTypeRow}>
                            <TouchableOpacity
                                style={[
                                    styles.accountTypeButton,
                                    !isCompany && styles.activeAccountTypeButton,
                                ]}
                                onPress={() => setIsCompany(false)}
                            >
                                <Text
                                    style={[
                                        styles.accountTypeText,
                                        !isCompany && styles.activeAccountTypeText,
                                    ]}
                                >
                                    Privatperson
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.accountTypeButton,
                                    isCompany && styles.activeAccountTypeButton,
                                ]}
                                onPress={() => setIsCompany(true)}
                            >
                                <Text
                                    style={[
                                        styles.accountTypeText,
                                        isCompany && styles.activeAccountTypeText,
                                    ]}
                                >
                                    Gewerbe
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* --- PERSÖNLICHE INFORMATIONEN --- */}
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>
                            Persönliche Informationen
                        </Text>

                        {/* Vorname */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Vorname</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                    },
                                ]}
                                value={personalData.firstName}
                                onChangeText={(text) =>
                                    setPersonalData({ ...personalData, firstName: text })
                                }
                                placeholder="Vorname eingeben"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        {/* Nachname */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Nachname</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                    },
                                ]}
                                value={personalData.lastName}
                                onChangeText={(text) =>
                                    setPersonalData({ ...personalData, lastName: text })
                                }
                                placeholder="Nachname eingeben"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        {/* Geburtsdatum */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Geburtsdatum</Text>
                            <TouchableOpacity
                                style={[
                                    styles.input,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.background,
                                        justifyContent: 'center',
                                    },
                                ]}
                                onPress={() => setDatePickerOpen(true)}
                            >
                                <Text style={{ color: colors.text }}>
                                    {personalData.birthday.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal
                                open={isDatePickerOpen}
                                date={personalData.birthday}
                                mode="date"
                                onConfirm={(date) => {
                                    setDatePickerOpen(false);
                                    setPersonalData({ ...personalData, birthday: date });
                                }}
                                onCancel={() => {
                                    setDatePickerOpen(false);
                                }}
                                theme={isDarkMode ? 'dark' : 'light'}
                            />
                        </View>

                        {/* Geschlecht */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Geschlecht</Text>
                            <View
                                style={[
                                    styles.pickerContainer,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.background,
                                    },
                                ]}
                            >
                                <Picker
                                    selectedValue={personalData.gender}
                                    onValueChange={(value) =>
                                        setPersonalData({ ...personalData, gender: value })
                                    }
                                    style={[styles.picker, { color: colors.text }]}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="Männlich" value="male" />
                                    <Picker.Item label="Weiblich" value="female" />
                                    <Picker.Item label="Andere" value="other" />
                                </Picker>
                            </View>
                        </View>

                        {/* Kontaktsprache */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Kontaktsprache
                            </Text>
                            <View
                                style={[
                                    styles.pickerContainer,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.background,
                                    },
                                ]}
                            >
                                <Picker
                                    selectedValue={personalData.languageCode}
                                    onValueChange={(value) =>
                                        setPersonalData({ ...personalData, languageCode: value })
                                    }
                                    style={[styles.picker, { color: colors.text }]}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="Deutsch" value="de" />
                                    <Picker.Item label="English" value="en" />
                                    <Picker.Item label="Français" value="fr" />
                                    <Picker.Item label="Italiano" value="it" />
                                </Picker>
                            </View>
                        </View>

                        {/* --- ADRESSE --- */}
                        <Text style={[styles.sectionHeader, { color: colors.text }]}>Adresse</Text>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Land</Text>
                            <View
                                style={[
                                    styles.pickerContainer,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.background,
                                    },
                                ]}
                            >
                                <Picker
                                    selectedValue={personalData.country}
                                    onValueChange={(value) =>
                                        setPersonalData({ ...personalData, country: value })
                                    }
                                    style={[styles.picker, { color: colors.text }]}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="Switzerland" value="Switzerland" />
                                    <Picker.Item label="Germany" value="Germany" />
                                    <Picker.Item label="Austria" value="Austria" />
                                </Picker>
                            </View>
                        </View>

                        {/* PLZ & Ort */}
                        <View style={styles.twoColumns}>
                            <View style={{ flex: 1, marginRight: 5 }}>
                                <Text style={[styles.label, { color: colors.text }]}>PLZ</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            borderColor: colors.border,
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                        },
                                    ]}
                                    value={personalData.zipCode}
                                    onChangeText={(text) =>
                                        setPersonalData({ ...personalData, zipCode: text })
                                    }
                                    placeholder="PLZ"
                                    placeholderTextColor={colors.placeholder}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 5 }}>
                                <Text style={[styles.label, { color: colors.text }]}>Ort</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            borderColor: colors.border,
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                        },
                                    ]}
                                    value={personalData.city}
                                    onChangeText={(text) =>
                                        setPersonalData({ ...personalData, city: text })
                                    }
                                    placeholder="Ort"
                                    placeholderTextColor={colors.placeholder}
                                />
                            </View>
                        </View>

                        {/* Strasse & Nr. */}
                        <View style={styles.twoColumns}>
                            <View style={{ flex: 2, marginRight: 5 }}>
                                <Text style={[styles.label, { color: colors.text }]}>Strasse</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            borderColor: colors.border,
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                        },
                                    ]}
                                    value={personalData.street}
                                    onChangeText={(text) =>
                                        setPersonalData({ ...personalData, street: text })
                                    }
                                    placeholder="Strasse"
                                    placeholderTextColor={colors.placeholder}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 5 }}>
                                <Text style={[styles.label, { color: colors.text }]}>Nr.</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        {
                                            borderColor: colors.border,
                                            backgroundColor: colors.background,
                                            color: colors.text,
                                        },
                                    ]}
                                    value={personalData.streetNumber}
                                    onChangeText={(text) =>
                                        setPersonalData({ ...personalData, streetNumber: text })
                                    }
                                    placeholder="Nr."
                                    placeholderTextColor={colors.placeholder}
                                />
                            </View>
                        </View>

                        {/* Weitere Informationen */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>
                                Weitere Informationen
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        borderColor: colors.border,
                                        backgroundColor: colors.background,
                                        color: colors.text,
                                    },
                                ]}
                                value={personalData.otherAddressInfo}
                                onChangeText={(text) =>
                                    setPersonalData({ ...personalData, otherAddressInfo: text })
                                }
                                placeholder="z.B. Gebäude, Stockwerk ..."
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        {/* --- GESCHÄFTSINFORMATIONEN (isCompany = true ise) --- */}
                        {isCompany && (
                            <>
                                <Text style={[styles.sectionHeader, { color: colors.text }]}>
                                    Geschäftsinformationen
                                </Text>

                                {/* Firmenname */}
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>
                                        Firmenname
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            {
                                                borderColor: colors.border,
                                                backgroundColor: colors.background,
                                                color: colors.text,
                                            },
                                        ]}
                                        value={companyData.companyName}
                                        onChangeText={(text) =>
                                            setCompanyData({ ...companyData, companyName: text })
                                        }
                                        placeholder="Firmenname eingeben"
                                        placeholderTextColor={colors.placeholder}
                                    />
                                </View>

                                {/* Handelsregister (switch) */}
                                <View style={styles.switchGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>
                                        Sind Sie im Handelsregister eingetragen?
                                    </Text>
                                    <Switch
                                        trackColor={{ false: '#767577', true: '#FF6200' }}
                                        thumbColor={companyData.isTradeRegistered ? '#fff' : '#f4f3f4'}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={(value) =>
                                            setCompanyData({
                                                ...companyData,
                                                isTradeRegistered: value,
                                            })
                                        }
                                        value={companyData.isTradeRegistered}
                                    />
                                </View>

                                {/* Handelsregister Nr. */}
                                {companyData.isTradeRegistered && (
                                    <View style={styles.inputGroup}>
                                        <Text style={[styles.label, { color: colors.text }]}>
                                            Handelsregister Nr.
                                        </Text>
                                        <TextInput
                                            style={[
                                                styles.input,
                                                {
                                                    borderColor: colors.border,
                                                    backgroundColor: colors.background,
                                                    color: colors.text,
                                                },
                                            ]}
                                            value={companyData.tradeRegisteredNumber}
                                            onChangeText={(text) =>
                                                setCompanyData({
                                                    ...companyData,
                                                    tradeRegisteredNumber: text,
                                                })
                                            }
                                            placeholder="Registernummer eingeben"
                                            placeholderTextColor={colors.placeholder}
                                        />
                                    </View>
                                )}

                                {/* Zeichnungsberechtigung (switch) */}
                                <View style={styles.switchGroup}>
                                    <Text style={[styles.label, { color: colors.text }]}>
                                        Sind Sie zeichnungsberechtigt?
                                    </Text>
                                    <Switch
                                        trackColor={{ false: '#767577', true: '#FF6200' }}
                                        thumbColor={companyData.isRegisterOwner ? '#fff' : '#f4f3f4'}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={(value) =>
                                            setCompanyData({
                                                ...companyData,
                                                isRegisterOwner: value,
                                            })
                                        }
                                        value={companyData.isRegisterOwner}
                                    />
                                </View>
                            </>
                        )}

                        {/* Kaydet / Güncelle Butonu */}
                        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                            <Text style={styles.buttonText}>Weiter</Text>
                        </TouchableOpacity>

                        {/* Hesap Silme Butonu */}
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                            <Text style={styles.buttonText}>Account löschen</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'flex-end',
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    dragIndicator: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    accountTypeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    accountTypeButton: {
        flex: 1,
        padding: 10,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 8,
        alignItems: 'center',
    },
    activeAccountTypeButton: {
        backgroundColor: '#008080',
        borderColor: '#008080',
    },
    accountTypeText: {
        color: '#333',
        fontWeight: '600',
    },
    activeAccountTypeText: {
        color: '#fff',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 15,
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 15,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 45,
        width: '100%',
    },
    twoColumns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    switchGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    updateButton: {
        backgroundColor: '#008080',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
    },
    deleteButton: {
        backgroundColor: '#FF0000',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default CompleteProfileModal;
