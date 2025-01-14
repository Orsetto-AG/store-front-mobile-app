import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Platform, Dimensions, TouchableOpacity, TextInput, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useDispatch, useSelector} from "react-redux";
import {addFavorite, removeFavorite} from "../../../redux/slices/favoritesSlice.ts";
import MediaModal from "./MediaModal/MediaModal.tsx";
const ProductDetail = ({ route, navigation }) => {
    const { product } = route.params; // MyHome'dan gelen ürün verisi
    const dispatch = useDispatch();
    const screenWidth = Dimensions.get('window').width;
    const [scrollY] = useState(new Animated.Value(0)); // Scroll pozisyonu için animasyon
    const favorites = useSelector(state => state.favorites.favorites);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState({ url: '', isVideo: false });

    const renderImage = ({ item }) => (
        <TouchableOpacity
            onPress={() => {
                setSelectedMedia({
                    url: item,
                    isVideo: item.endsWith('.mp4') || item.endsWith('.mov')
                });
                setModalVisible(true);
            }}
        >
            <Image
                source={{ uri: item }}
                style={[styles.productImage, { width: screenWidth }]}
            />
            {(item.endsWith('.mp4') || item.endsWith('.mov')) && (
                <View style={styles.videoIndicator}>
                    <Text style={styles.videoIcon}>▶</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    // Header arka plan rengi ve opaklık animasyonu
    const headerBackgroundColor = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: ['transparent', '#fff'],
        extrapolate: 'clamp',
    });

    const searchBarOpacity = scrollY.interpolate({
        inputRange: [50, 200],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });
    const handleFavoriteToggle = (product) => {
        if (favorites.find(item => item.id === product.id)) {
            dispatch(removeFavorite(product.id));
        } else {
            dispatch(addFavorite(product));
        }
    };
    return (
        <View style={styles.container}>
            {/* Dinamik Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        backgroundColor: headerBackgroundColor,
                    },
                ]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>

                <Animated.View style={[styles.searchBarContainer, { opacity: searchBarOpacity }]}>
                    <TextInput
                        placeholder="Search for products, categories..."
                        placeholderTextColor="#888"
                        style={styles.searchBar}
                    />
                    <LinearGradient
                        colors={['#FF6200', '#FF8533', '#4e48e4']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBar}
                    />
                </Animated.View>

                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => handleFavoriteToggle(product)}
                        style={styles.headerButton}
                    >
                        <Text style={{
                            fontSize: 20,
                            color: favorites.find(fav => fav.id === product.id) ? '#FF6200' : '#ccc'
                        }}>
                            ♥
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton}>
                        <Text>⇪</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Sayfa İçeriği */}
            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                scrollEventThrottle={16}
            >
                <FlatList
                    data={product.images}
                    renderItem={renderImage}
                    keyExtractor={(item, index) => index.toString()}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                />

                {/* Ürün Bilgileri */}
                <View style={styles.detailsContainer}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.productInfo}>
                        <Text style={styles.productRating}>★ {product.rating}</Text>
                        <Text style={styles.productPrice}>{product.price} TL</Text>
                    </View>
                    <Text style={styles.productDescription}>{product.description}</Text>

                    {/* Ek Bilgiler */}
                    <View style={styles.extraInfo}>
                        <Text style={styles.extraText}>Yarın kargoda</Text>
                        <Text style={styles.extraText}>300 TL üzeri kargo bedava</Text>
                    </View>
                    <View style={styles.extraInfo}>
                        <Text style={styles.extraText}>Yarın kargoda</Text>
                        <Text style={styles.extraText}>300 TL üzeri kargo bedava</Text>
                    </View>
                    <View style={styles.extraInfo}>
                        <Text style={styles.extraText}>Yarın kargoda</Text>
                        <Text style={styles.extraText}>300 TL üzeri kargo bedava</Text>
                    </View>
                    <View style={styles.extraInfo}>
                        <Text style={styles.extraText}>Yarın kargoda</Text>
                        <Text style={styles.extraText}>300 TL üzeri kargo bedava</Text>
                    </View>
                    <View style={styles.extraInfo}>
                        <Text style={styles.extraText}>Yarın kargoda</Text>
                        <Text style={styles.extraText}>300 TL üzeri kargo bedava</Text>
                    </View>
                    <View style={styles.extraInfo}>
                        <Text style={styles.extraText}>Yarın kargoda</Text>
                        <Text style={styles.extraText}>300 TL üzeri kargo bedava</Text>
                    </View>
                    <View style={styles.extraInfo}>
                        <Text style={styles.extraText}>Yarın kargoda</Text>
                        <Text style={styles.extraText}>300 TL üzeri kargo bedava</Text>
                    </View>
                </View>
            </Animated.ScrollView>
            <MediaModal
                isVisible={modalVisible}
                onClose={() => setModalVisible(false)}
                mediaList={product.media}
                initialIndex={product.media.findIndex((item) => item.uri === selectedMedia.url)}
            />

            {/* Fiyat ve Sepet Alanı */}
            <View style={styles.bottomBar}>
                <Text style={styles.totalPrice}>{product.price} TL</Text>
                <TouchableOpacity style={styles.addToCartButton}>
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 100 : 60, // iPhone için yüksekliği artırıyoruz
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 50 : 0, // iPhone için üstten padding ekliyoruz
    },
    scrollContent: {
        paddingTop: Platform.OS === 'ios' ? 90 : 60, // Header için boşluğu iPhone'a göre ayarlıyoruz
        paddingBottom: 80,
    },
    backButton: {
        padding: 10,
    },
    backButtonText: {
        fontSize: 18,
        color: '#000',
    },
    searchBarContainer: {
        flex: 1,
        marginHorizontal: 10,
    },
    videoIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -25 }, { translateY: -25 }],
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoIcon: {
        color: 'white',
        fontSize: 24,
    },
    searchBar: {
        height: 35,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 14,
        color: '#000',
        position: 'relative',
    },
    gradientBar: {
        height: 4,
        width: '100%',
        position: 'absolute',
        bottom: -2, // Search bar'ın hemen altına yerleştir
        borderRadius: 8,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        marginLeft: 15,
        padding: 5,
    },
    favoriteIcon: {
        position: 'absolute',
        top: 8,
        right: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    productImage: {
        height: 300,
        resizeMode: 'cover',
    },
    detailsContainer: {
        padding: 15,
    },
    productName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    productInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    productRating: {
        fontSize: 16,
        color: '#888',
    },
    productPrice: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FF6200',
    },
    productDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
        marginBottom: 15,
    },
    extraInfo: {
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
    },
    extraText: {
        fontSize: 14,
        color: '#444',
        marginBottom: 5,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderTopWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        position: 'absolute',
        bottom: 0,
        width: '100%',
    },
    totalPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6200',
    },
    addToCartButton: {
        backgroundColor: '#FF6200',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    addToCartText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default ProductDetail;
