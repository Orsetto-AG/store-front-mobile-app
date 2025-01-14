export const fetchCategories = () => ({ type: 'FETCH_CATEGORIES_REQUEST' });
export const fetchRecommended = () => ({ type: 'FETCH_RECOMMENDED_REQUEST' });
export const fetchBestSellers = () => ({ type: 'FETCH_BESTSELLERS_REQUEST' });
export const fetchCategoryProducts = (categoryId: number) => ({ type: 'FETCH_CATEGORY_PRODUCTS_REQUEST', payload: categoryId });
export const addFavorite = (product) => ({
    type: 'ADD_FAVORITE',
    payload: product,
});

export const removeFavorite = (productId) => ({
    type: 'REMOVE_FAVORITE',
    payload: productId,
});
