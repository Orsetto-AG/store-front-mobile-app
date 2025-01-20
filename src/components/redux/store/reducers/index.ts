import { combineReducers } from '@reduxjs/toolkit';
import homeReducer from './homeReducer';
import categoryProductsReducer from './categoryProductsReducer';
import favoritesReducer from '../../slices/favoritesSlice.ts';
import authReducer from '../../slices/authSlice';
const rootReducer = combineReducers({
    home: homeReducer,
    categoryProducts: categoryProductsReducer,
    favorites: favoritesReducer,
    auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
