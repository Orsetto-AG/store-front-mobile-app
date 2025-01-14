import { call, put, takeLatest } from 'redux-saga/effects';
import api from '../../../utils/api.ts';
import {AnyAction} from "redux";

function* fetchCategories(): Generator<any, void, any> {
    try {
        const response = yield call(api.getCategories);
        yield put({ type: 'FETCH_CATEGORIES_SUCCESS', payload: response.data });
    } catch (error) {
        yield put({ type: 'FETCH_CATEGORIES_FAILURE', payload: error.message });
    }
}

function* fetchRecommended(): Generator<any, void, any> {
    try {
        const response = yield call(api.getRecommended);
        yield put({ type: 'FETCH_RECOMMENDED_SUCCESS', payload: response.data });
    } catch (error) {
        yield put({ type: 'FETCH_RECOMMENDED_FAILURE', payload: error.message });
    }
}

function* fetchBestSellers(): Generator<any, void, any> {
    try {
        const response = yield call(api.getBestSellers);
        yield put({ type: 'FETCH_BESTSELLERS_SUCCESS', payload: response.data });
    } catch (error) {
        yield put({ type: 'FETCH_BESTSELLERS_FAILURE', payload: error.message });
    }
}
function* fetchCategoryProducts(action: AnyAction): Generator<any, void, any> {
    try {
        const response = yield call(api.getCategoryProducts, action.payload);
        yield put({ type: 'FETCH_CATEGORY_PRODUCTS_SUCCESS', payload: response.data });
    } catch (error) {
        yield put({ type: 'FETCH_CATEGORY_PRODUCTS_FAILURE', payload: error.message });
    }
}
export default [
    takeLatest('FETCH_CATEGORIES_REQUEST', fetchCategories),
    takeLatest('FETCH_RECOMMENDED_REQUEST', fetchRecommended),
    takeLatest('FETCH_BESTSELLERS_REQUEST', fetchBestSellers),
    takeLatest('FETCH_CATEGORY_PRODUCTS_REQUEST', fetchCategoryProducts),
];
