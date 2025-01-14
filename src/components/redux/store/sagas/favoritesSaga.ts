import { call, put, takeLatest } from 'redux-saga/effects';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setFavorites } from '../reducers/favoritesReducer.ts';

function* loadFavoritesSaga() {
    try {
        const storedFavorites = yield call([AsyncStorage, 'getItem'], 'favorites');
        const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : [];
        yield put(setFavorites(parsedFavorites));
    } catch (error) {
        console.error('Error loading favorites:', error);
    }
}

export default function* favoritesSaga() {
    yield takeLatest('LOAD_FAVORITES', loadFavoritesSaga);
}
