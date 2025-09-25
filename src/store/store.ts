// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage
import authReducer from "./authSlice";
import manufacturingReducer from "./manufacturingCollection";

const rootReducer = combineReducers({
  auth: authReducer,
  manufacturing: manufacturingReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "manufacturing"], // persist only auth slice
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;