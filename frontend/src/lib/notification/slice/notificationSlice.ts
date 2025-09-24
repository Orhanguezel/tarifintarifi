// store/notification/slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { INotification, CreateNotificationPayload } from "@/modules/notification/types";

interface PaginatedRes<T> {
  success: boolean;
  message?: string;
  page: number;
  limit: number;
  total: number;
  items: T[];
}

interface NotificationState {
  items: INotification[];
  loading: boolean;
  status?: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  message: string | null;
  // pagination (my/admin list için)
  page: number;
  limit: number;
  total: number;
  // unread count
  unreadCount?: number;
}

const initialState: NotificationState = {
  items: [],
  loading: false,
  status: "idle",
  error: null,
  message: null,
  page: 1,
  limit: 20,
  total: 0,
};

// 🔹 Current user's feed
export const fetchMyNotifications = createAsyncThunk<
  PaginatedRes<INotification>,
  { page?: number; limit?: number; isRead?: boolean; q?: string } | void,
  { rejectValue: string }
>("notification/fetchMy", async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (typeof params?.isRead === "boolean") qs.set("isRead", String(params.isRead));
    if (params?.q) qs.set("q", params.q);
    const res = await apiCall("get", `/notification/my${qs.toString() ? `?${qs}` : ""}`);
    return res as PaginatedRes<INotification>;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Could not fetch notifications.");
  }
});

// 🔹 Admin list (opsiyonel, admin panelde kullan)
export const fetchAdminNotifications = createAsyncThunk<
  PaginatedRes<INotification>,
  {
    page?: number; limit?: number; type?: string; isRead?: boolean;
    user?: string; channel?: string; tag?: string; active?: boolean;
    from?: string; to?: string; q?: string; sort?: string;
  },
  { rejectValue: string }
>("notification/fetchAdmin", async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    }
    const res = await apiCall("get", `/notification/admin${qs.toString() ? `?${qs}` : ""}`);
    return res as PaginatedRes<INotification>;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Could not fetch admin notifications.");
  }
});

// 🔹 Unread count
export const fetchUnreadCount = createAsyncThunk<
  number,
  { user?: string } | void,
  { rejectValue: string }
>("notification/fetchUnreadCount", async (params, { rejectWithValue }) => {
  try {
    const qs = new URLSearchParams();
    if (params?.user) qs.set("user", params.user);
    const res = await apiCall("get", `/notification/unread-count${qs.toString() ? `?${qs}` : ""}`);
    return Number(res?.count || 0);
  } catch (err: any) {
    return rejectWithValue(err?.message || "Could not fetch unread count.");
  }
});

// 🔹 Create (admin)
export const createNotification = createAsyncThunk<
  INotification,
  CreateNotificationPayload,
  { rejectValue: string }
>("notification/create", async (data, { rejectWithValue }) => {
  try {
    const res = await apiCall("post", "/notification", data);
    return res.notification as INotification;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Could not create notification.");
  }
});

// 🔹 Delete (admin)
export const deleteNotification = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notification/delete", async (id, { rejectWithValue }) => {
  try {
    await apiCall("delete", `/notification/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Could not delete notification.");
  }
});

// 🔹 Mark one as read (owner or admin)
export const markNotificationAsRead = createAsyncThunk<
  INotification,
  string,
  { rejectValue: string }
>("notification/markAsRead", async (id, { rejectWithValue }) => {
  try {
    const res = await apiCall("patch", `/notification/${id}/read`);
    return res.notification as INotification;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Could not update notification.");
  }
});

// 🔹 Mark all as read (current user scope by default)
export const markAllMyNotificationsAsRead = createAsyncThunk<
  number | void,
  void,
  { rejectValue: string }
>("notification/markAllMineAsRead", async (_, { rejectWithValue }) => {
  try {
    const res = await apiCall("patch", `/notification/mark-all-read?onlyMine=true`);
    return res?.modified as number | undefined;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Could not update all notifications.");
  }
});

// (opsiyonel) Admin tenant-wide mark-all
export const adminMarkAllNotificationsAsRead = createAsyncThunk<
  number | void,
  void,
  { rejectValue: string }
>("notification/adminMarkAllAsRead", async (_, { rejectWithValue }) => {
  try {
    const res = await apiCall("patch", `/notification/mark-all-read`);
    return res?.modified as number | undefined;
  } catch (err: any) {
    return rejectWithValue(err?.message || "Could not update all notifications (admin).");
  }
});

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearNotificationMessages(state) {
      state.message = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // My feed
      .addCase(fetchMyNotifications.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.items = action.payload.items;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
      })
      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Fetch error";
      })

      // Admin list
      .addCase(fetchAdminNotifications.pending, (state) => {
        state.loading = true;
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.items = action.payload.items;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.total = action.payload.total;
      })
      .addCase(fetchAdminNotifications.rejected, (state, action) => {
        state.loading = false;
        state.status = "failed";
        state.error = action.payload || "Fetch error";
      })

      // Unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload ?? 0;
      })

      // Create
      .addCase(createNotification.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.message = null;
      })
      .addCase(createNotification.fulfilled, (state, action: PayloadAction<INotification>) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.message = "Notification created successfully.";
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Create error";
      })

      // Delete
      .addCase(deleteNotification.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(n => n._id !== action.payload);
        state.message = "Notification deleted.";
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload || "Delete error";
      })

      // Mark one as read
      .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<INotification>) => {
        state.items = state.items.map(n => (n._id === action.payload._id ? action.payload : n));
        // unreadCount'ı lokal düşür
        if (!action.payload.isRead) return;
        if (typeof state.unreadCount === "number" && state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.error = action.payload || "Update error";
      })

      // Mark all mine as read
      .addCase(markAllMyNotificationsAsRead.fulfilled, (state) => {
        state.items = state.items.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }));
        state.unreadCount = 0;
      })
      .addCase(markAllMyNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload || "Update error";
      })

      // Admin tenant-wide mark-all
      .addCase(adminMarkAllNotificationsAsRead.fulfilled, (state) => {
        state.items = state.items.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() }));
      })
      .addCase(adminMarkAllNotificationsAsRead.rejected, (state, action) => {
        state.error = action.payload || "Update error";
      });
  },
});

export const { clearNotificationMessages } = notificationSlice.actions;
export default notificationSlice.reducer;
