import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    FlatList,
    Modal
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CompleteProfileModal from '../Profile/CompleteProfile';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import {
    launchCamera,
    launchImageLibrary,
    CameraOptions,
    ImageLibraryOptions,
    ImagePickerResponse,
    Asset,
} from 'react-native-image-picker';

const menuItems = [
    { id: '1', label: 'User Settings', icon: require('../../images/profiles.png') },
    { id: '2', label: 'Offers', icon: require('../../images/discount.png') },
    { id: '3', label: 'Bought', icon: require('../../images/sold.png') },
    { id: '4', label: 'Selling', icon: require('../../images/selling.png') },
    { id: '5', label: 'Sold', icon: require('../../images/out-of-stock.png') },
    { id: '6', label: 'Drafts', icon: require('../../images/draft-button.png') },
    { id: '7', label: 'Fees', icon: require('../../images/fee.png') },
    { id: '8', label: 'Questions and Answers', icon: require('../../images/conversations.png') },
    { id: '9', label: 'Customer Service', icon: require('../../images/customer-support.png') },
    { id: '10', label: 'News', icon: require('../../images/megaphone.png') },
];

const MAX_FILE_SIZE = 1_000_000; // 1 MB

const Profile = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { user } = useSelector((state: RootState) => state.auth);

    const [isModalVisible, setModalVisible] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    // Avatar modal state
    const [isAvatarModalVisible, setAvatarModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchProfileData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const response = await axios.get('https://api.orsetto.ch/api/customer/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setProfileData(response.data.data.user);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.removeItem('token');
        dispatch(logout());
    };

    const handleMenuItemPress = (id: string) => {
        if (id === '1') {
            navigation.navigate('UserSettings' as never);
        }
        // Diğer menü itemları için istediğiniz yönlendirmeleri yapabilirsiniz.
    };

    // Avatar'a basıldığında modal aç
    const handleAvatarPress = () => {
        setAvatarModalVisible(true);
        setErrorMessage(null);
        setSelectedImage(null);
    };

    // Kamera ile fotoğraf çekmek
    const handleTakePhoto = () => {
        const options: CameraOptions = {
            mediaType: 'photo',
            includeBase64: true,
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
        };

        launchCamera(options, (response: ImagePickerResponse) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                setErrorMessage('Kamera açılırken hata oluştu.');
                return;
            }
            if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                // 1MB kontrolü
                if (asset.base64 && isBase64OverLimit(asset.base64, MAX_FILE_SIZE)) {
                    setErrorMessage('Seçilen fotoğraf 1MB limitini aşıyor. Lütfen daha düşük boyutlu bir fotoğraf seçin.');
                    return;
                }
                setSelectedImage(asset);
            }
        });
    };

    // Galeriden fotoğraf seçmek
    const handleChoosePhoto = () => {
        const options: ImageLibraryOptions = {
            mediaType: 'photo',
            includeBase64: true,
            quality: 0.8,
            maxWidth: 1024,
            maxHeight: 1024,
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                setErrorMessage('Galeri açılırken hata oluştu.');
                return;
            }
            if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                // 1MB kontrolü
                if (asset.base64 && isBase64OverLimit(asset.base64, MAX_FILE_SIZE)) {
                    setErrorMessage('Seçilen fotoğraf 1MB limitini aşıyor. Lütfen daha düşük boyutlu bir fotoğraf seçin.');
                    return;
                }
                setSelectedImage(asset);
            }
        });
    };

    // Seçilen resmi API'ye PUT isteği ile gönder
    const handleUpdateAvatar = async () => {
        if (!selectedImage?.base64) {
            setErrorMessage('Resim seçilmedi.');
            return;
        }

        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            // mimeType tespiti: fileName'den uzantıyı çekiyoruz
            // yoksa default olarak image/jpeg varsayıyoruz
            let mimeType = 'image/jpeg';
            if (selectedImage.fileName) {
                const extension = selectedImage.fileName.split('.').pop()?.toLowerCase();
                if (extension === 'png') {
                    mimeType = 'image/png';
                } else if (extension === 'jpg' || extension === 'jpeg') {
                    mimeType = 'image/jpeg';
                }
                // isterseniz daha fazla uzantı kontrol edebilirsiniz
            }

            // API'ye data:<mimeType>;base64,<base64Data> formatında gönderiyoruz
            const putBody = {
                avatar: `data:${mimeType};base64,${selectedImage.base64}`,
            };

            const response = await axios.put(
                'https://api.orsetto.ch/api/customer/avatar',
                putBody,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status === 1) {
                // Başarılı yükleme
                setAvatarModalVisible(false);
                // Profil verisini tekrar çekip güncelle
                fetchProfileData();
                setSelectedImage(null);
            } else {
                setErrorMessage('Avatar güncellenirken beklenmeyen bir hata oluştu.');
            }
        } catch (error) {
            console.error('Avatar güncellenirken hata oluştu:', error);
            setErrorMessage('Avatar güncellenirken hata oluştu.');
        }
    };

    // Base64 verisi 1MB'ı aşıyor mu kontrol fonksiyonu
    const isBase64OverLimit = (base64: string, limitBytes: number) => {
        // Base64 string'in yaklaşık byte boyutu
        // Base64'te 4 karakter ~ 3 byte veri tuttuğu için,
        // (stringLength * 3) / 4 ile byte'ı hesaplayabilirsiniz.
        const sizeInBytes = (base64.length * 3) / 4;
        return sizeInBytes > limitBytes;
    };

    const displayName = profileData?.username ?? '';

    const renderMenuItem = ({ item }: { item: typeof menuItems[0] }) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuItemPress(item.id)}
        >
            <Image source={item.icon} style={styles.menuIcon} />
            <Text style={styles.menuItemText}>{item.label}</Text>
            <Image source={require('../../images/next.png')} style={styles.nextIcon} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Üst sabit header */}
            <View style={styles.fixedHeader}>
                <TouchableOpacity style={styles.notificationIcon}>
                    <Text style={styles.notificationText}>🔔</Text>
                </TouchableOpacity>
                <Text style={styles.fixedHeaderText}>My Account</Text>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {/* Avatar ve İsim */}
                <View style={styles.header}>
                    {/* Avatar Container */}
                    {profileData?.avatarUrl ? (
                        <TouchableOpacity onPress={handleAvatarPress}>
                            <Image
                                source={{ uri: profileData.avatarUrl }}
                                style={styles.avatarImage}
                            />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.avatarPlaceholder}
                            onPress={handleAvatarPress}
                        >
                            <Text style={styles.avatarText}>
                                {displayName?.charAt(0).toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.name}>{displayName.toLowerCase()}</Text>
                </View>

                {/* Premium banner örneği */}
                <View style={styles.premiumBanner}>
                    <Text style={styles.premiumText}>ORSETTO</Text>
                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}
                        style={styles.premiumButton}
                    >
                        <Text style={styles.premiumButtonText}>Premium User</Text>
                    </TouchableOpacity>
                </View>

                {/* Menü Listesi */}
                <FlatList
                    data={menuItems}
                    renderItem={renderMenuItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.menuContainer}
                />

                {/* Log out butonu */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Log out</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Profil tamamlama modalı */}
            <CompleteProfileModal
                isVisible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onProfileUpdate={() => {
                    fetchProfileData();
                    setModalVisible(false);
                }}
                profileData={profileData}
            />

            {/* Avatar seçimi için modal */}
            <Modal
                visible={isAvatarModalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setAvatarModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Avatarını Güncelle</Text>

                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity onPress={handleTakePhoto} style={styles.modalButton}>
                                <Text style={styles.modalButtonText}>Kamera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleChoosePhoto} style={styles.modalButton}>
                                <Text style={styles.modalButtonText}>Galeri</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Hata mesajı */}
                        {errorMessage && (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        )}

                        {/* Seçilen resim önizleme */}
                        {selectedImage && (
                            <View style={styles.previewContainer}>
                                <Image
                                    source={{ uri: `data:image/jpeg;base64,${selectedImage.base64}` }}
                                    style={styles.previewImage}
                                />
                            </View>
                        )}

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#FF6200' }]}
                                onPress={handleUpdateAvatar}
                            >
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                                    Güncelle
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                                onPress={() => {
                                    setAvatarModalVisible(false);
                                    setSelectedImage(null);
                                    setErrorMessage(null);
                                }}
                            >
                                <Text style={styles.modalButtonText}>İptal</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Profile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    fixedHeader: {
        backgroundColor: '#FF6200',
        height: 90,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fixedHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 'auto',
        marginBottom: 10,
    },
    notificationIcon: {
        position: 'absolute',
        right: 20,
        top: 55,
    },
    notificationText: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    scrollContainer: {
        flex: 1,
    },
    header: {
        backgroundColor: '#FF6200',
        paddingVertical: 30,
        alignItems: 'center',
    },
    avatarImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: '#FFF',
        marginBottom: 10,
        resizeMode: 'cover',
    },
    avatarPlaceholder: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF6200',
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        bottom: 10,
    },
    premiumBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFE6E6',
        borderRadius: 10,
        padding: 15,
        margin: 15,
        position: 'relative',
        marginTop: -30,
    },
    premiumText: {
        fontSize: 14,
        color: '#FF007F',
        fontWeight: 'bold',
    },
    premiumButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    premiumButtonText: {
        fontSize: 14,
        color: '#FF6200',
        fontWeight: 'bold',
    },
    menuContainer: {
        marginTop: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#e6e2e2',
    },
    menuIcon: {
        width: 24,
        height: 24,
        marginRight: 15,
    },
    nextIcon: {
        width: 15,
        height: 15,
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    logoutButton: {
        backgroundColor: '#FF6200',
        margin: 20,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#FF6200',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    modalButton: {
        backgroundColor: '#F5F5F5',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    modalButtonText: {
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    previewContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        resizeMode: 'cover',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
});
