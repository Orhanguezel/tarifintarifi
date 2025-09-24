import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { IBlog } from "@/modules/blog";

interface BlogState {
  blog: IBlog[];
  blogAdmin: IBlog[];
  selected: IBlog | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: BlogState = {
  blog: [],
  blogAdmin: [],
  selected: null,
  status: "idle",
  loading: false,
  error: null,
  successMessage: null,
};

const BASE = "/blog";

const extractErrorMessage = (payload: unknown): string => {
  if (typeof payload === "string") return payload;
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof (payload as any).message === "string"
  )
    return (payload as any).message;
  return "An error occurred.";
};

// --- Async Thunks ---

export const fetchBlog = createAsyncThunk<IBlog[]>(
  "blog/fetchAll",
  async (_, thunkAPI) => {
    const res = await apiCall("get", `${BASE}`, null, thunkAPI.rejectWithValue);
    // response: { success, message, data }
    return res.data;
  }
);

export const fetchAllBlogAdmin = createAsyncThunk<IBlog[]>(
  "blog/fetchAllAdmin",
  async (_, thunkAPI) => {
    const res = await apiCall(
      "get",
      `${BASE}/admin`,
      null,
      thunkAPI.rejectWithValue
    );
    return res.data;
  }
);

export const createBlog = createAsyncThunk(
  "blog/create",
  async (formData: FormData, thunkAPI) => {
    const res = await apiCall(
      "post",
      `${BASE}/admin`,
      formData,
      thunkAPI.rejectWithValue
    );
    // return: { success, message, data }
    return { ...res, data: res.data };
  }
);

export const updateBlog = createAsyncThunk(
  "blog/update",
  async ({ id, formData }: { id: string; formData: FormData }, thunkAPI) => {
    const res = await apiCall(
      "put",
      `${BASE}/admin/${id}`,
      formData,
      thunkAPI.rejectWithValue
    );
    return { ...res, data: res.data };
  }
);

export const deleteBlog = createAsyncThunk(
  "blog/delete",
  async (id: string, thunkAPI) => {
    const res = await apiCall(
      "delete",
      `${BASE}/admin/${id}`,
      null,
      thunkAPI.rejectWithValue
    );
    // return: { success, message }
    return { id, message: res.message };
  }
);

export const togglePublishBlog = createAsyncThunk(
  "blog/togglePublish",
  async (
    { id, isPublished }: { id: string; isPublished: boolean },
    thunkAPI
  ) => {
    const formData = new FormData();
    formData.append("isPublished", String(isPublished));
    const res = await apiCall(
      "put",
      `${BASE}/admin/${id}`,
      formData,
      thunkAPI.rejectWithValue
    );
    return { ...res, data: res.data };
  }
);

export const fetchBlogBySlug = createAsyncThunk(
  "blog/fetchBySlug",
  async (slug: string, thunkAPI) => {
    const res = await apiCall(
      "get",
      `${BASE}/slug/${slug}`,
      null,
      thunkAPI.rejectWithValue
    );
    return res.data;
  }
);

// --- Slice ---
const blogSlice = createSlice({
  name: "blog",
  initialState,
  reducers: {
    clearBlogMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setSelectedBlog: (state, action: PayloadAction<IBlog | null>) => {
      state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state: BlogState) => {
      state.loading = true;
      state.status = "loading";
      state.error = null;
    };

    const setError = (state: BlogState, action: PayloadAction<any>) => {
      state.loading = false;
      state.status = "failed";
      state.error = extractErrorMessage(action.payload);
    };

    // 🌐 Public
    builder
      .addCase(fetchBlog.pending, setLoading)
      .addCase(fetchBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.blog = action.payload;
      })
      .addCase(fetchBlog.rejected, setError);

    // 🔐 Admin List
    builder
      .addCase(fetchAllBlogAdmin.pending, setLoading)
      .addCase(fetchAllBlogAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.blogAdmin = action.payload;
      })
      .addCase(fetchAllBlogAdmin.rejected, setError);

    // ➕ Create
    builder
      .addCase(createBlog.pending, setLoading)
      .addCase(createBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.blogAdmin.unshift(action.payload.data);
        state.successMessage = action.payload.message; // 👈 BACKEND'DEN
      })
      .addCase(createBlog.rejected, setError);

    // 📝 Update
    builder
      .addCase(updateBlog.pending, setLoading)
      .addCase(updateBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        const updated = action.payload.data;
        const i = state.blogAdmin.findIndex((a) => a._id === updated._id);
        if (i !== -1) state.blogAdmin[i] = updated;
        if (state.selected?._id === updated._id) state.selected = updated;
        state.successMessage = action.payload.message; // 👈 BACKEND'DEN
      })
      .addCase(updateBlog.rejected, setError);

    // 🗑️ Delete
    builder
      .addCase(deleteBlog.pending, setLoading)
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.blogAdmin = state.blogAdmin.filter((a) => a._id !== action.payload.id);
        state.successMessage = action.payload.message; // 👈 BACKEND'DEN
      })
      .addCase(deleteBlog.rejected, setError);

    // 🌍 Toggle Publish
    builder
      .addCase(togglePublishBlog.pending, setLoading)
      .addCase(togglePublishBlog.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        const updated = action.payload.data;
        const i = state.blogAdmin.findIndex((a) => a._id === updated._id);
        if (i !== -1) state.blogAdmin[i] = updated;
        if (state.selected?._id === updated._id) state.selected = updated;
        state.successMessage = action.payload.message; // 👈 BACKEND'DEN
      })
      .addCase(togglePublishBlog.rejected, setError);

    // 🔎 Single (Slug)
    builder
      .addCase(fetchBlogBySlug.pending, setLoading)
      .addCase(fetchBlogBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.selected = action.payload;
      })
      .addCase(fetchBlogBySlug.rejected, setError);
  },
});

export const { clearBlogMessages, setSelectedBlog } = blogSlice.actions;
export default blogSlice.reducer;
