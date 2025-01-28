import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    FlatList,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { logout } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CompleteProfileModal from '../Profile/CompleteProfile';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';

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

const Profile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const [isModalVisible, setModalVisible] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const navigation = useNavigation();
    const fetchProfileData = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
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
            navigation.navigate('UserSettings');
        }
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
            <View style={styles.fixedHeader}>
                <TouchableOpacity style={styles.notificationIcon}>
                    <Text style={styles.notificationText}>🔔</Text>
                </TouchableOpacity>
                <Text style={styles.fixedHeaderText}>My Account</Text>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {displayName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <Text style={styles.name}>{displayName.toLowerCase()}</Text>
                </View>

                <View style={styles.premiumBanner}>
                    <Text style={styles.premiumText}>ORSETTO</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.premiumButton}>
                        <Text style={styles.premiumButtonText}>Premium User</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={menuItems}
                    renderItem={renderMenuItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.menuContainer}
                />

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Log out</Text>
                </TouchableOpacity>
            </ScrollView>

            <CompleteProfileModal
                isVisible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onProfileUpdate={() => {
                    fetchProfileData();
                    setModalVisible(false);
                }}
                profileData={profileData}
            />
        </View>
    );
};

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
    header: {
        backgroundColor: '#FF6200',
        paddingVertical: 30,
        alignItems: 'center',
    },
    avatar: {
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
    menuArrow: {
        fontSize: 20,
        color: '#ccc',
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
});

export default Profile;
