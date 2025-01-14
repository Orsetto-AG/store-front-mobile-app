import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Product {
  id: string;
  name: string;
  image: string;
  price: string;
  description: string;
  model: string;
  brand: string;
}

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsStart(state) {
      state.loading = true;
    },
    fetchProductsSuccess(state, action: PayloadAction<Product[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    fetchProductsFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { fetchProductsStart, fetchProductsSuccess, fetchProductsFailure } = productsSlice.actions;
export default productsSlice.reducer;
