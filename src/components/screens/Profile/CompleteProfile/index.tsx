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
    useColorScheme,
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
        background: isDarkMode ? '#1a1a1a' : 'white',
        text: isDarkMode ? '#ffffff' : '#333333',
        border: isDarkMode ? '#404040' : '#dddddd',
        placeholder: isDarkMode ? '#808080' : '#999999',
        dragIndicator: isDarkMode ? '#404040' : '#dddddd',
    };

    const [formData, setFormData] = useState({
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

    const [isDatePickerOpen, setDatePickerOpen] = useState(false);

    useEffect(() => {
        if (profileData) {
            setFormData({
                gender: profileData.gender || 'male',
                languageCode: profileData.languageCode || 'de',
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                birthday: profileData.birthday ? new Date(profileData.birthday) : new Date(),
                street: profileData.street || '',
                streetNumber: profileData.streetNumber || '',
                zipCode: profileData.zipCode || '',
                city: profileData.city || '',
                country: profileData.country || 'Switzerland',
                otherAddressInfo: profileData.otherAddressInfo || '',
            });
        }
    }, [profileData]);

    const handleUpdate = async () => {
        try {
            const token = await AsyncStorage.getItem('token');

            await axios.put(
                'https://api.orsetto.ch/api/customer/complete-profile',
                {
                    personal: {
                        ...formData,
                        birthday: formData.birthday.toISOString().split('T')[0],
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
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

    return (
        <Modal
            isVisible={isVisible}
            style={styles.modal}
            onSwipeComplete={onClose}
            swipeDirection={['down']}
            propagateSwipe={true}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <View style={[styles.container, { backgroundColor: colors.background }]}>
                    <View style={[styles.dragIndicator, { backgroundColor: colors.dragIndicator }]} />
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={[styles.title, { color: colors.text }]}>Complete Profile</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
                            <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                                <Picker
                                    selectedValue={formData.gender}
                                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                                    style={[styles.picker, { color: colors.text }]}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="Male" value="male" color={colors.text} />
                                    <Picker.Item label="Female" value="female" color={colors.text} />
                                    <Picker.Item label="Other" value="other" color={colors.text} />
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Language</Text>
                            <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
                                <Picker
                                    selectedValue={formData.languageCode}
                                    onValueChange={(value) => setFormData({ ...formData, languageCode: value })}
                                    style={[styles.picker, { color: colors.text }]}
                                    dropdownIconColor={colors.text}
                                >
                                    <Picker.Item label="German" value="de" color={colors.text} />
                                    <Picker.Item label="English" value="en" color={colors.text} />
                                    <Picker.Item label="French" value="fr" color={colors.text} />
                                    <Picker.Item label="Italian" value="it" color={colors.text} />
                                </Picker>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.firstName}
                                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                                placeholder="Enter your first name"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.lastName}
                                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                                placeholder="Enter your last name"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Birthday</Text>
                            <TouchableOpacity
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background
                                }]}
                                onPress={() => setDatePickerOpen(true)}
                            >
                                <Text style={[styles.dateText, { color: colors.text }]}>
                                    {formData.birthday.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                            <DatePicker
                                modal
                                open={isDatePickerOpen}
                                date={formData.birthday}
                                mode="date"
                                onConfirm={(date) => {
                                    setDatePickerOpen(false);
                                    setFormData({ ...formData, birthday: date });
                                }}
                                onCancel={() => {
                                    setDatePickerOpen(false);
                                }}
                                theme={isDarkMode ? 'dark' : 'light'}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Street</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.street}
                                onChangeText={(text) => setFormData({ ...formData, street: text })}
                                placeholder="Enter street name"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Street Number</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.streetNumber}
                                onChangeText={(text) => setFormData({ ...formData, streetNumber: text })}
                                placeholder="Enter street number"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>ZIP Code</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.zipCode}
                                onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                                placeholder="Enter ZIP code"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>City</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                                placeholder="Enter city"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Additional Info</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.otherAddressInfo}
                                onChangeText={(text) => setFormData({ ...formData, otherAddressInfo: text })}
                                placeholder="Enter additional address info"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>

                        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
                            <Text style={styles.buttonText}>Update Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                            <Text style={styles.buttonText}>Delete Account</Text>
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
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
    },
    pickerContainer: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 'auto',
        width: '100%',
    },
    dateText: {
        fontSize: 16,
    },
    updateButton: {
        backgroundColor: '#FF6200',
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
