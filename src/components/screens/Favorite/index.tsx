import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { removeFavorite } from '../../redux/slices/favoritesSlice.ts'; // Favori çıkarma aksiyonu
import FilterModal from '../FilterModal'; // FilterModal'ı ekliyoruz

const Favorite = () => {
    const favorites = useSelector((state) => state.favorites.favorites); // Redux'tan gelen favoriler
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFavorites, setFilteredFavorites] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false); // Modal görünürlüğü
    const [sortOption, setSortOption] = useState(''); // Seçilen filtre
    const dispatch = useDispatch();

    // Redux favoriler veya filtreleme değiştiğinde listeyi güncelle
    useEffect(() => {
        let sortedFavorites = [...favorites];

        if (sortOption === 'price_asc') {
            sortedFavorites.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        } else if (sortOption === 'price_desc') {
            sortedFavorites.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        } else if (sortOption === 'name_asc') {
            sortedFavorites.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortOption === 'name_desc') {
            sortedFavorites.sort((a, b) => b.name.localeCompare(a.name));
        }

        setFilteredFavorites(
            sortedFavorites.filter((item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
    }, [favorites, searchQuery, sortOption]);

    const handleRemoveFavorite = (id) => {
        dispatch(removeFavorite(id));
    };

    const renderFavoriteItem = ({ item }) => (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.favoriteIcon}
                onPress={() => handleRemoveFavorite(item.id)}
            >
                <Text style={styles.favoriteText}>♥</Text>
            </TouchableOpacity>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text style={styles.productName} numberOfLines={2}>
                {item.name}
            </Text>
            <Text style={styles.productRating}>★ {item.rating}</Text>
            <Text style={styles.productPrice}>{item.price} TL</Text>
            <TouchableOpacity style={styles.addToCartButton}>
                <Text style={styles.addToCartText}>Bid Now</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Üst Alan */}
            <View style={styles.header}>
                <TextInput
                    style={styles.searchBar}
                    placeholder="Search in favorites"
                    value={searchQuery}
                    onChangeText={(text) => setSearchQuery(text)}
                />
            </View>

            <View style={{ padding: 10, flex: 1 }}>
                {/* Filtreleme Butonları */}
                <View style={styles.filters}>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setIsModalVisible(true)} // Modal'ı aç
                    >
                        <Text style={styles.filterText}>Filtrele</Text>
                    </TouchableOpacity>
                </View>

                {/* Favori Listesi */}
                {filteredFavorites.length > 0 ? (
                    <FlatList
                        data={filteredFavorites}
                        renderItem={renderFavoriteItem}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                    />
                ) : (
                    <Text style={styles.noFavorites}>No favorites found.</Text>
                )}

                {/* Filter Modal */}
                <FilterModal
                    visible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                    onApplyFilter={(filter) => setSortOption(filter)} // Filtreyi uygula
                    onResetFilter={() => {
                        setSortOption(''); // Varsayılan sıralama
                    }}
                />
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 110,
        backgroundColor: '#FF6200',
    },
    searchBar: {
        width: '90%',
        height: 40,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 16,
        marginTop: 50,
        marginLeft: 'auto',
        marginRight: 'auto',
    },
    filters: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    filterButton: {
        flex: 1,
        padding: 10,
        marginHorizontal: 5,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        alignItems: 'center',
    },
    filterText: {
        fontSize: 14,
        color: '#333',
    },
    row: {
        justifyContent: 'space-between',
    },
    card: {
        flex: 1,
        margin: 5,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        alignItems: 'center',
    },
    favoriteIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    favoriteText: {
        fontSize: 18,
        color: '#FF6200',
    },
    productImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginBottom: 10,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
        textAlign: 'center',
    },
    productRating: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6200',
        marginBottom: 10,
    },
    addToCartButton: {
        backgroundColor: '#FF6200',
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    addToCartText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    noFavorites: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
    },
});

export default Favorite;
