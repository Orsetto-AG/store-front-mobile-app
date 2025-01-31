export declare const fetchCategories: () => {
    type: 'FETCH_CATEGORIES_REQUEST';
};

export declare const fetchRecommended: () => {
    type: 'FETCH_RECOMMENDED_REQUEST';
};

export declare const fetchBestSellers: () => {
    type: 'FETCH_BESTSELLERS_REQUEST';
};

export declare const fetchCategoryProducts: (categoryId: number) => {
    type: 'FETCH_CATEGORY_PRODUCTS_REQUEST';
    payload: number;
};

export declare const addFavorite: (product: any) => {
    type: 'ADD_FAVORITE';
    payload: any;
};

export declare const removeFavorite: (productId: string | number) => {
    type: 'REMOVE_FAVORITE';
    payload: string | number;
}; 