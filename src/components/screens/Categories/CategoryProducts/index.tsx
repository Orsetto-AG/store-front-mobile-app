import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TextInput, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategoryProducts } from '../../../redux/store/actions';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { addFavorite, removeFavorite } from '../../../redux/slices/favoritesSlice.ts';
const CategoryProducts = ({ route }) => {
    const { categoryId, categoryName } = route.params;
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const products = useSelector((state) => state.categoryProducts.products);
    const loading = useSelector((state) => state.categoryProducts.loading);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const favorites = useSelector(state => state.favorites.favorites);

    useEffect(() => {
        dispatch(fetchCategoryProducts(categoryId));
    }, [categoryId, dispatch]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = products.filter((product) =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const handleFavoriteToggle = (product) => {
        if (favorites.find(item => item.id === product.id)) {
            dispatch(removeFavorite(product.id));
        } else {
            dispatch(addFavorite(product));
        }
    };

    const renderProduct = ({ item }) => {
        const now = moment();
        const listingDate = moment(item.listedDate);
        const isNewlyListed = now.diff(listingDate, 'days') < 3;
        const expirationDate = moment(item.expirationDate);
        const hoursLeft = expirationDate.diff(now, 'hours');
        const isExpired = hoursLeft <= 0;
        const isSold = item.isSold;
        const highestBid = item.bids.length > 0 ? item.bids[item.bids.length - 1].amount : null;

        const displayPrice = highestBid ? highestBid : item.price; // Price is set dynamically
        const cardOpacity = isExpired || isSold ? 0.5 : 1;

        return (
            <View style={[styles.productCard, { opacity: cardOpacity }]}>
                <View style={styles.productContent}>
                    {/* Product Image */}
                    <View style={styles.imageWrapper}>
                        <Image source={{ uri: item.image }} style={styles.productImage} />
                    </View>

                    {/* Product Details */}
                    <View style={styles.productDetails}>
                        <View style={styles.productHeader}>
                            <Text style={styles.productName} numberOfLines={2}>
                                {item.name}
                            </Text>
                            {cardOpacity === 1 && (
                                <TouchableOpacity
                                    onPress={() => handleFavoriteToggle(item)}
                                    style={styles.favoriteButton}
                                >
                                    <Text style={{ fontSize: 20, color: favorites.find(fav => fav.id === item.id) ? '#FF6200' : '#ccc' }}>
                                        ♥
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.listedDate}>
                            Listed Date: {listingDate.format('DD.MM.YYYY HH:mm')}
                        </Text>
                        {isNewlyListed && <Text style={styles.newBadge}>Newly Listed</Text>}
                        <Text style={styles.bidInfo}>
                            {highestBid ? `Last Bid: ${highestBid} €` : '0 Bids'}
                        </Text>
                        {hoursLeft > 0 && hoursLeft < 24 && (
                            <Text style={styles.timeLeft}>{hoursLeft} hours left</Text>
                        )}
                        {isExpired && <Text style={styles.statusEnded}>Ended</Text>}
                        {isSold && <Text style={styles.statusSold}>Sold</Text>}
                    </View>
                </View>

                {/* Price and "Place Bid" Button */}
                {!isExpired && !isSold && (
                    <TouchableOpacity style={styles.offerButton}>
                        <View style={styles.offerButtonContent}>
                            <Text style={styles.priceText}>{displayPrice} €</Text>
                            <Text style={styles.separator}>|</Text>
                            <Text style={styles.offerText}>Bid Now</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
        );
    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading Products...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={{height: 45, backgroundColor: '#FF6200'}}>

            </View>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Image style={styles.backImage} source={require('../../../images/back.png')}
                    />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{categoryName}</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrapper}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search for a product..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Product List */}
            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.productsList}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0', // Light gray background
    },
    header: {
        height: 60,
        backgroundColor: '#FF6200',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    backButton: {
        marginRight: 15,
        padding: 10,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    searchBarWrapper: {
        padding: 10,
        backgroundColor: '#f5f5f5',
    },
    searchBar: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        color: '#000',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    productsList: {
        paddingHorizontal: 10,
    },
    productCard: {
        backgroundColor: '#fff', // White background
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 15,
        padding: 10,
    },
    productContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    imageWrapper: {
        width: 80,
        height: 80,
        backgroundColor: '#e0e0e0', // Light gray background
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    productImage: {
        width: 70,
        height: 70,
        borderRadius: 10,
    },
    backImage: {
        width: 25,
        height: 25,
    },
    productDetails: {
        flex: 1,
    },
    newBadge: {
        fontSize: 12,
        color: '#00AA00',
        marginBottom: 5,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2, // Reduced spacing
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        flex: 1, // Name takes maximum space
    },
    listedDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5, // Standardized spacing
    },
    favoriteButton: {
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    bidInfo: {
        fontSize: 12,
        color: '#000',
        marginBottom: 5,
    },
    timeLeft: {
        fontSize: 12,
        color: '#FF6200',
        marginBottom: 5,
    },
    statusEnded: {
        fontSize: 12,
        color: '#FF0000',
        marginBottom: 5,
    },
    statusSold: {
        fontSize: 12,
        color: '#00AA00',
        marginBottom: 5,
    },
    favoriteButton: {
        padding: 10,
    },
    offerButton: {
        marginTop: 10,
        paddingVertical: 10,
        backgroundColor: '#FF6200',
        borderRadius: 5,
        alignItems: 'center',
    },
    offerButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 14,
    },
    separator: {
        marginHorizontal: 8,
        color: 'rgba(255, 255, 255, 0.7)', // Transparent separator
        fontSize: 14,
    },
    offerText: {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: 14,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CategoryProducts;
