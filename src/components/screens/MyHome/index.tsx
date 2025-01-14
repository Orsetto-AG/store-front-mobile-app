import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, fetchRecommended, fetchBestSellers } from '../../redux/store/actions';
import { useNavigation } from '@react-navigation/native';
import { addFavorite, removeFavorite } from '../../redux/slices/favoritesSlice.ts';
const MyHome = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const { categories, recommended, bestSellers } = useSelector(state => state.home);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const favorites = useSelector(state => state.favorites.favorites);
    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchRecommended());
        dispatch(fetchBestSellers());
    }, [dispatch]);

    useEffect(() => {
        if (searchQuery) {
            const allProducts = [...recommended, ...bestSellers];
            const productResults = allProducts.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(productResults);

            const categoryResults = categories.filter(category =>
                category.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCategories(categoryResults);
        } else {
            setFilteredProducts([]);
            setFilteredCategories([]);
        }
    }, [searchQuery, recommended, bestSellers, categories]);
    const handleCategoryPress = (categoryId, categoryName) => {
        navigation.navigate('CategoryProducts', { categoryId, categoryName });
    };
    const handleFavoriteToggle = (product) => {
        if (favorites.find(item => item.id === product.id)) {
            dispatch(removeFavorite(product.id));
        } else {
            dispatch(addFavorite(product));
        }
    };
    const renderCategory = ({ item }) => (
        <TouchableOpacity style={styles.categoryItem} onPress={() => handleCategoryPress(item.id, item.name)}>
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <Text style={styles.categoryText}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderProduct = ({ item }) => (
        <TouchableOpacity
            style={styles.productItem}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        >
            {/* Product Image with Favorite Icon */}
            <View style={styles.imageWrapper}>
                <Image source={{ uri: item.image }} style={styles.productImage} />
                <TouchableOpacity
                    onPress={() => handleFavoriteToggle(item)}
                    style={styles.favoriteIcon}
                >
                    <Text style={{ fontSize: 20, color: favorites.find(fav => fav.id === item.id) ? '#FF6200' : '#ccc' }}>
                        ♥
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Product Name */}
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>

            {/* Product Rating */}
            <Text style={styles.productRating}>★ {item.rating}</Text>

            {/* Product Price */}
            <Text style={styles.productPrice}>{item.price} €</Text>
            <View style={styles.productActions}>
                {/* Favorite Button */}


                {/* Bid Button */}
                <TouchableOpacity style={styles.buyButton}>
                    <Text style={styles.buyText}>Bid</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );


    return (
        <View style={styles.container}>
            <View style={{height: 45, backgroundColor: '#FF6200'}}>

            </View>
            {/* Search Bar */}
            <View style={styles.stickyHeaderWrapper}>
                <View style={styles.stickyHeader}>
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search for product, category or brand"
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {searchQuery ? (
                    <View>
                        {filteredCategories.length > 0 && (
                            <View>
                                <Text style={styles.sectionTitle}>Categories</Text>
                                <FlatList
                                    data={filteredCategories}
                                    renderItem={renderCategory}
                                    keyExtractor={(item) => item.id.toString()}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.categoriesList}
                                />
                            </View>
                        )}

                        {filteredProducts.length > 0 && (
                            <View>
                                <Text style={styles.sectionTitle}>Products Result</Text>
                                <FlatList
                                    data={filteredProducts}
                                    renderItem={renderProduct}
                                    keyExtractor={(item) => item.id.toString()}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.productsList}
                                />
                            </View>
                        )}
                    </View>
                ) : (
                    <View>
                        {/* Categories */}
                        <Text style={styles.sectionTitle}>Categories</Text>
                        <FlatList
                            data={categories}
                            renderItem={renderCategory}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesList}
                        />

                        {/* Recommended */}
                        <Text style={styles.sectionTitle}>Cengiz, Special for you</Text>
                        <FlatList
                            data={recommended}
                            renderItem={renderProduct}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.productsList}
                        />

                        {/* Best Sellers */}
                        <Text style={styles.sectionTitle}>Best Sellers</Text>
                        <FlatList
                            data={bestSellers}
                            renderItem={renderProduct}
                            keyExtractor={(item) => item.id.toString()}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.productsList}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    stickyHeaderWrapper: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        zIndex: 10,
        backgroundColor: '#FF6200',
        paddingBottom: 10,
        paddingTop: 10,

    },
    stickyHeader: {
        paddingHorizontal: 15,
    },
    searchBar: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        fontSize: 16,
        color: '#000',
    },
    scrollContent: {
        paddingTop: 70,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF6200',
        margin: 10,
    },
    categoriesList: {
        paddingHorizontal: 10,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 15,
    },
    categoryImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#FF6200',
    },
    categoryText: {
        marginTop: 5,
        fontSize: 14,
        color: '#000',
    },
    productsList: {
        paddingHorizontal: 10,
    },
    productItem: {
        width: 150,
        marginRight: 15,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
    },

    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    productRating: {
        fontSize: 12,
        color: '#888',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6200',
        marginVertical: 5,
    },
    favoriteText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    productActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10, // Adds space between actions and other content
    },
    favoriteButton: {
        padding: 5,
        backgroundColor: '#fff', // Transparent background for better UI
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        width: 50, // Fixed width for consistency
        height: 35, // Fixed height for button
    },
    buyButton: {
        flex: 1, // Takes the remaining space
        paddingVertical: 7,
        backgroundColor: '#FF6200',
        borderRadius: 5,
       // Space between favorite and bid button
    },
    buyText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    imageWrapper: {
        position: 'relative',
        width: '100%',
        height: 100,
        marginBottom: 10,
    },
    productImage: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
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

});

export default MyHome;
