import { combineReducers } from '@reduxjs/toolkit';
import homeReducer from './homeReducer';
import categoryProductsReducer from './categoryProductsReducer';
import favoritesReducer from '../../slices/favoritesSlice.ts';
const rootReducer = combineReducers({
    home: homeReducer,
    categoryProducts: categoryProductsReducer,
    favorites: favoritesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export default rootReducer;
