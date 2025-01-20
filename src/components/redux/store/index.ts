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
    key: 'root',
    storage: AsyncStorage,
    whitelist: ['auth', 'favorites'],
};

// Persisted Reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Redux Store Configuration
const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: true, // Enable thunk middleware
            serializableCheck: false,
        }).concat(sagaMiddleware),
});

// Run Redux-Saga
sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);

export default store;
