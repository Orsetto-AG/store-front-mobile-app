import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FavoriteState {
  favorites: Array<{ id: string; name: string; image: string }>; // Favori ürünlerin yapısını tanımlayın
}

const initialState: FavoriteState = {
  favorites: [],
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action: PayloadAction<{ id: string; name: string; image: string }>) => {
      if (!state.favorites.some((item) => item.id === action.payload.id)) {
        state.favorites.push(action.payload);
      }
    },
    removeFavorite: (state, action: PayloadAction<string>) => {
      state.favorites = state.favorites.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addFavorite, removeFavorite } = favoritesSlice.actions;

export default favoritesSlice.reducer;
