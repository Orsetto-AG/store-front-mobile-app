import { AnyAction } from 'redux';

type HomeState = {
    categories: Array<{ id: number; name: string; image: string }>;
    recommended: Array<{ id: number; name: string; image: string; rating: number; price: string }>;
    bestSellers: Array<{ id: number; name: string; image: string; rating: number; price: string }>;
    loading: boolean;
    error: string | null;
};

const initialState: HomeState = {
    categories: [],
    recommended: [],
    bestSellers: [],
    loading: false,
    error: null,
};

const homeReducer = (state = initialState, action: AnyAction): HomeState => {
    switch (action.type) {
        case 'FETCH_CATEGORIES_REQUEST':
        case 'FETCH_RECOMMENDED_REQUEST':
        case 'FETCH_BESTSELLERS_REQUEST':
            return { ...state, loading: true, error: null };
        case 'FETCH_CATEGORIES_SUCCESS':
            return { ...state, loading: false, categories: action.payload };
        case 'FETCH_RECOMMENDED_SUCCESS':
            return { ...state, loading: false, recommended: action.payload };
        case 'FETCH_BESTSELLERS_SUCCESS':
            return { ...state, loading: false, bestSellers: action.payload };
        case 'FETCH_CATEGORIES_FAILURE':
        case 'FETCH_RECOMMENDED_FAILURE':
        case 'FETCH_BESTSELLERS_FAILURE':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
};

export default homeReducer;
