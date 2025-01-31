import React, { useEffect, useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    Image, 
    TouchableOpacity, 
    TextInput,
    Dimensions,
    SafeAreaView,
    Platform,
    Animated,
    Pressable
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories } from '../../../components/redux/store/actions';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

interface Category {
    id: number;
    name: string;
    image: string;
    subcategories?: SubCategory[];
}

interface SubCategory {
    id: number;
    name: string;
    image: string;
    parentId: number;
}

interface RootState {
    home: {
        categories: Category[];
    };
}

type RootStackParamList = {
    CategoryProducts: { categoryId: number; categoryName: string };
};

type CategoriesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const SUBCATEGORY_ITEM_WIDTH = (width - 40) / 2;

const Categories = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<CategoriesScreenNavigationProp>();
    const categories = useSelector((state: RootState) => state.home.categories);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [currentSubcategories, setCurrentSubcategories] = useState<SubCategory[]>([]);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = categories.filter((category: Category) =>
                category.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredCategories(filtered);
        } else {
            setFilteredCategories([]);
        }
    }, [searchQuery, categories]);

    useEffect(() => {
        if (selectedCategory) {
            const category = categories.find(cat => cat.id === selectedCategory);
            setCurrentSubcategories(category?.subcategories || []);
        } else if (categories.length > 0) {
            setSelectedCategory(categories[0].id);
            setCurrentSubcategories(categories[0].subcategories || []);
        }
    }, [selectedCategory, categories]);

    const handleCategoryPress = (categoryId: number, categoryName: string) => {
        setSelectedCategory(categoryId);
    };

    const handleSubcategoryPress = (subcategoryId: number, subcategoryName: string) => {
        navigation.navigate('CategoryProducts', { 
            categoryId: subcategoryId, 
            categoryName: subcategoryName 
        });
    };

    const renderCategory = ({ item }: { item: Category }) => (
        <TouchableOpacity 
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item.id, item.name)}
        >
            <View style={[
                styles.categoryImageContainer,
                selectedCategory === item.id && styles.selectedCategoryImageContainer
            ]}>
                <Image 
                    source={{ uri: item.image }} 
                    style={styles.categoryImage}
                    resizeMode="contain"
                />
            </View>
            <Text 
                style={[
                    styles.categoryText,
                    selectedCategory === item.id && styles.selectedCategoryText
                ]}
                numberOfLines={2}
            >
                {item.name}
            </Text>
            {selectedCategory === item.id && (
                <View style={styles.selectedIndicator} />
            )}
        </TouchableOpacity>
    );

    const renderSubcategory = ({ item }: { item: SubCategory }) => {
        const [pressScale] = useState(new Animated.Value(1));

        const onPressIn = () => {
            Animated.spring(pressScale, {
                toValue: 0.95,
                useNativeDriver: true,
            }).start();
        };

        const onPressOut = () => {
            Animated.spring(pressScale, {
                toValue: 1,
                useNativeDriver: true,
            }).start();
        };

        return (
            <Pressable
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => handleSubcategoryPress(item.id, item.name)}
            >
                <Animated.View 
                    style={[
                        styles.subcategoryItem,
                        { transform: [{ scale: pressScale }] }
                    ]}
                >
                    <Image 
                        source={{ uri: item.image }} 
                        style={styles.subcategoryImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.subcategoryText} numberOfLines={2}>
                        {item.name}
                    </Text>
                </Animated.View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Status Bar Space */}
            <View style={styles.statusBar} />
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Image 
                        source={require('../../../components/images/searchNew.png')} 
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search for products, categories, or brands"
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity 
                        style={styles.cameraButton}
                        activeOpacity={0.7}
                    >
                        <Image 
                            source={require('../../../components/images/camera.png')} 
                            style={styles.cameraIcon}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Horizontal Category List */}
                <FlatList
                    data={searchQuery ? filteredCategories : categories}
                    renderItem={renderCategory}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                    decelerationRate="fast"
                    snapToAlignment="center"
                />

                {/* Category Title */}
                <View style={styles.categoryTitleContainer}>
                    <Text style={styles.categoryTitle}>
                        {categories.find(cat => cat.id === selectedCategory)?.name || 'Categories'}
                    </Text>
                    <View style={styles.orangeLine} />
                </View>

                {/* Subcategories Grid */}
                <FlatList
                    data={currentSubcategories}
                    renderItem={renderSubcategory}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.subcategoriesList}
                    initialNumToRender={6}
                    maxToRenderPerBatch={8}
                    windowSize={5}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    statusBar: {
        height: Platform.OS === 'ios' ? 44 : 0,
        backgroundColor: '#FF6600',
    },
    searchContainer: {
        backgroundColor: '#FF6600',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: Platform.OS === 'ios' ? 8 : 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 46,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        width: 20,
        height: 20,
        tintColor: '#999',
        marginRight: 10,
    },
    searchBar: {
        flex: 1,
        fontSize: 15,
        color: '#333',
        padding: 0,
        height: '100%',
    },
    cameraButton: {
        padding: 8,
        marginLeft: 4,
    },
    cameraIcon: {
        width: 24,
        height: 24,
        tintColor: '#666',
    },
    content: {
        flex: 1,
    },
    categoriesList: {
        paddingVertical: 16,
        backgroundColor: '#fff',
        paddingLeft: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 24,
        width: 84,
    },
    categoryImageContainer: {
        width: 76,
        height: 76,
        borderRadius: 38,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    selectedCategoryImageContainer: {
        borderColor: '#FF6600',
        borderWidth: 2.5,
    },
    categoryImage: {
        width: 48,
        height: 48,
    },
    categoryText: {
        fontSize: 13,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
        height: 36,
        lineHeight: 18,
    },
    selectedCategoryText: {
        color: '#FF6600',
        fontWeight: '600',
    },
    selectedIndicator: {
        position: 'absolute',
        bottom: -16,
        left: '50%',
        width: 24,
        height: 3,
        backgroundColor: '#FF6600',
        transform: [{ translateX: -12 }],
    },
    categoryTitleContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 12,
        backgroundColor: '#fff',
        marginBottom: 2,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryTitle: {
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    orangeLine: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        width: 140,
        height: 3,
        backgroundColor: '#FF6600',
    },
    subcategoriesList: {
        padding: 8,
        paddingTop: 12,
        backgroundColor: '#F5F5F5',
    },
    subcategoryItem: {
        width: SUBCATEGORY_ITEM_WIDTH,
        margin: 8,
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    subcategoryImage: {
        width: 64,
        height: 64,
        marginBottom: 12,
    },
    subcategoryText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default Categories;

