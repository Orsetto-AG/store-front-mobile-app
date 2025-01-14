import { AnyAction } from 'redux';

type CategoryProductsState = {
    products: Array<{ id: number; name: string; image: string; rating: number; price: string }>;
    loading: boolean;
    error: string | null;
};

const initialState: CategoryProductsState = {
    products: [],
    loading: false,
    error: null,
};

const categoryProductsReducer = (state = initialState, action: AnyAction): CategoryProductsState => {
    switch (action.type) {
        case 'FETCH_CATEGORY_PRODUCTS_REQUEST':
            return { ...state, loading: true, error: null };
        case 'FETCH_CATEGORY_PRODUCTS_SUCCESS':
            return { ...state, loading: false, products: action.payload };
        case 'FETCH_CATEGORY_PRODUCTS_FAILURE':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export default categoryProductsReducer;
