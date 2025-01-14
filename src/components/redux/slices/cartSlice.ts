import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppThunk } from '../store';

interface CartItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  image: string;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
    },
    addToCart(state, action: PayloadAction<CartItem>) {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      AsyncStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item.id !== action.payload);
      AsyncStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
      AsyncStorage.setItem('cart', JSON.stringify(state.items));
    },
  },
});

export const { setCartItems, addToCart, removeFromCart, updateQuantity } = cartSlice.actions;

export const loadCartItems = (): AppThunk => async dispatch => {
  try {
    const storedCart = await AsyncStorage.getItem('cart');
    if (storedCart) {
      dispatch(setCartItems(JSON.parse(storedCart)));
    }
  } catch (error) {
    console.error('Failed to load cart items', error);
  }
};

export default cartSlice.reducer;
