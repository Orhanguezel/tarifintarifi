import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { BlogCategory, TranslatedField } from "@/modules/blog";

interface CategoryState {
  categories: BlogCategory[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
  successMessage: null,
};

// --- Fetch ---
export const fetchBlogCategories = createAsyncThunk(
  "blogCategory/fetchAll",
  async (_, thunkAPI) => {
    const res = await apiCall(
      "get",
      "/blogcategory",
      null,
      thunkAPI.rejectWithValue
    );
    return res.data;
  }
);

// --- Create ---
export const createBlogCategory = createAsyncThunk(
  "blogCategory/create",
  async (
    data: {
      name: TranslatedField;
      description?: TranslatedField;
    },
    thunkAPI
  ) => {
    const res = await apiCall(
      "post",
      "/blogcategory",
      data,
      thunkAPI.rejectWithValue
    );
    return res.data;
  }
);

// --- Update ---
export const updateBlogCategory = createAsyncThunk(
  "blogCategory/update",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        name: TranslatedField;
        description?: TranslatedField;
      };
    },
    thunkAPI
  ) => {
    const res = await apiCall(
      "put",
      `/blogcategory/${id}`,
      data,
      thunkAPI.rejectWithValue
    );
    return res.data;
  }
);

// --- Delete ---
export const deleteBlogCategory = createAsyncThunk(
  "blogCategory/delete",
  async (id: string, thunkAPI) => {
    const res = await apiCall(
      "delete",
      `/blogcategory/${id}`,
      null,
      thunkAPI.rejectWithValue
    );
    return { id, message: res.message };
  }
);

const blogCategorySlice = createSlice({
  name: "blogCategory",
  initialState,
  reducers: {
    clearBlogCategoryMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    const startLoading = (state: CategoryState) => {
      state.loading = true;
      state.error = null;
    };

    const setError = (state: CategoryState, action: PayloadAction<any>) => {
      state.loading = false;
      state.error = action.payload?.message;
    };

    builder
      // Fetch
      .addCase(fetchBlogCategories.pending, startLoading)
      .addCase(fetchBlogCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchBlogCategories.rejected, setError)
      // Create
      .addCase(createBlogCategory.pending, startLoading)
      .addCase(createBlogCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload?.message;
        if (action.payload?.data?._id) {
          state.categories.unshift(action.payload.data);
        }
      })
      .addCase(createBlogCategory.rejected, setError)
      // Update
      .addCase(updateBlogCategory.pending, startLoading)
      .addCase(updateBlogCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload?.message;
        const updated = action.payload?.data || action.payload;
        const index = state.categories.findIndex(
          (cat) => cat._id === updated._id
        );
        if (index !== -1) {
          state.categories[index] = updated;
        }
      })
      .addCase(updateBlogCategory.rejected, setError)
      // Delete
      .addCase(deleteBlogCategory.pending, startLoading)
      .addCase(deleteBlogCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload?.message;
        state.categories = state.categories.filter(
          (cat) => cat._id !== action.payload.id
        );
      })
      .addCase(deleteBlogCategory.rejected, setError);
  },
});

export const { clearBlogCategoryMessages } = blogCategorySlice.actions;
export default blogCategorySlice.reducer;
