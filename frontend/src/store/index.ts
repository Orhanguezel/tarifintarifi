"use client";

import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { recipesApi } from "@/lib/recipes/api";
import { commentsApi } from "@/lib/comments/api";
import { reactionsApi } from "@/lib/reactions/api";
import { usersApi } from "@/lib/users/api.client"; // ⬅️ eklendi

export function makeStore() {
  const store = configureStore({
    reducer: {
      [recipesApi.reducerPath]: recipesApi.reducer,
      [commentsApi.reducerPath]: commentsApi.reducer,
      [reactionsApi.reducerPath]: reactionsApi.reducer,
      [usersApi.reducerPath]: usersApi.reducer, // ⬅️ eklendi
    },
    middleware: (gDM) =>
      gDM().concat(
        recipesApi.middleware,
        commentsApi.middleware,
        reactionsApi.middleware,
        usersApi.middleware // ⬅️ eklendi
      ),
  });

  setupListeners(store.dispatch);
  return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
