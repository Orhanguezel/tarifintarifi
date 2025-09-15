// src/store/index.ts
"use client";

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { recipesApi } from "@/lib/recipes/api";
import { commentsApi } from "@/lib/comments/api";
import { reactionsApi } from "@/lib/reactions/api";

export function makeStore() {
  const store = configureStore({
    reducer: {
      [recipesApi.reducerPath]: recipesApi.reducer,
      [commentsApi.reducerPath]: commentsApi.reducer,
      [reactionsApi.reducerPath]: reactionsApi.reducer
    },
    middleware: (gDM) =>
      gDM().concat(
        recipesApi.middleware,
        commentsApi.middleware,
        reactionsApi.middleware
      )
  });

  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
