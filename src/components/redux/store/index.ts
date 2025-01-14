import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { persistReducer, persistStore } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import rootReducer from './reducers';
import rootSaga from './sagas';

// Redux-Saga Middleware
const sagaMiddleware = createSagaMiddleware();

// Persist Configuration
const persistConfig = {
    key: 'root', // Root key for persistence
    storage: AsyncStorage, // Use AsyncStorage for persistence
    whitelist: ['favorites'], // Specify which reducers to persist (e.g., favorites)
};

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the Redux store with persisted reducer and saga middleware
const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: false, // Disable thunk since we're using saga
            serializableCheck: false, // Disable serializable check for redux-persist compatibility
        }).concat(sagaMiddleware),
});

// Run root saga
sagaMiddleware.run(rootSaga);

// Persistor for the store
export const persistor = persistStore(store);

export default store;
