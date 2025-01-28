import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';

const SETTINGS_ITEMS = [
    { id: '1', title: 'Account Details', icon: require('../../../images/profile.png') },
    { id: '2', title: 'Payments', icon: require('../../../images/profile.png') },
    { id: '3', title: 'Push Notifications',icon: require('../../../images/profile.png') },
    { id: '4', title: 'Email Notifications',icon: require('../../../images/profile.png') },
    { id: '5', title: 'Privacy Settings',icon: require('../../../images/profile.png') },
];

const UserSettings = () => {
    const navigation = useNavigation();
    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleItemPress = (item: { id: string; title: string }) => {
        if (item.id === '1') {
            navigation.navigate('AccountDetails');
        }
    };
    const renderItem = ({ item }: { item: typeof SETTINGS_ITEMS[0] }) => (
        <TouchableOpacity
            style={styles.itemContainer}
            onPress={() => handleItemPress(item)}
        >
            {/* SOL TARAF: İkon + Metin */}
            <View style={styles.leftContainer}>
                <Image source={item.icon}  style={styles.leftIcon} />
                <Text style={styles.itemText}>{item.title}</Text>
            </View>

            {/* SAĞ TARAF: Ok ikonu */}
            <Image
                source={require('../../../images/next.png')}
                style={styles.rightIcon}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Turuncu Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    {/* Geri ikonu */}
                    <Image
                        source={require('../../../images/next.png')}
                        style={styles.backIcon}
                    />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>My Settings</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Liste alanı */}
            <View style={styles.contentContainer}>
                <FlatList
                    data={SETTINGS_ITEMS}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    style={styles.listStyle}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            </View>
        </SafeAreaView>
    );
};

export default UserSettings;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FF6200', // üstte turuncu alan
    },
    headerContainer: {
        backgroundColor: '#FF6200',
        height: 60,
        paddingTop: 30,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    backButton: {
        width: 40,
        justifyContent: 'center',
        marginBottom: 10,
        height: 40,
    },
    backIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        transform: [{ rotate: '180deg' }], // Sol oku andırması için
        tintColor: '#fff',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
        marginTop: -5,
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    listStyle: {
        marginTop: 10,
    },
    // Liste öğesi (sol + sağ)
    itemContainer: {
        minHeight: 50,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    separator: {
        height: 0.5,
        backgroundColor: '#ccc',
        marginLeft: 15,
    },
    // Sol kısım (ikon + başlık)
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        marginRight: 10,
        // Dilerseniz renk vermek için tintColor da ekleyebilirsiniz
    },
    itemText: {
        fontSize: 16,
        color: '#000',
    },
    // Sağ taraftaki ok ikonu
    rightIcon: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
    },
});
