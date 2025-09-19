// src/store/makeStore.ts (veya mevcut dosya yolun)
"use client";

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";

// 🔧 Client slice'ı buradan al
import { recipesApi } from "@/lib/recipes/api.client";
import { commentsApi } from "@/lib/comments/api";
import { reactionsApi } from "@/lib/reactions/api";
import { usersApi } from "@/lib/users/api.client";

export function makeStore() {
  const store = configureStore({
    reducer: {
      [recipesApi.reducerPath]: recipesApi.reducer,
      [commentsApi.reducerPath]: commentsApi.reducer,
      [reactionsApi.reducerPath]: reactionsApi.reducer,
      [usersApi.reducerPath]: usersApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // FormData / File içeren mutation'larda gereksiz uyarıları sustur
        serializableCheck: false,
        immutableCheck: false,
      }).concat(
        recipesApi.middleware,
        commentsApi.middleware,
        reactionsApi.middleware,
        usersApi.middleware
      ),
    devTools: process.env.NODE_ENV !== "production",
  });

  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
