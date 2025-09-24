import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import apiCall from "@/lib/apiCall";
import type { ITeam } from "@/modules/team";

interface TeamState {
  team: ITeam[];
  teamAdmin: ITeam[];
  selected: ITeam | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: TeamState = {
  team: [],
  teamAdmin: [],
  selected: null,
  status: "idle",
  loading: false,
  error: null,
  successMessage: null,
};

const BASE = "/team";

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

export const fetchTeam = createAsyncThunk<ITeam[]>(
  "team/fetchAll",
  async (_, thunkAPI) => {
    const res = await apiCall("get", `${BASE}`, null, thunkAPI.rejectWithValue);
    // response: { success, message, data }
    return res.data;
  }
);

export const fetchAllTeamAdmin = createAsyncThunk<ITeam[]>(
  "team/fetchAllAdmin",
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

export const createTeam = createAsyncThunk(
  "team/create",
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

export const updateTeam = createAsyncThunk(
  "team/update",
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

export const deleteTeam = createAsyncThunk(
  "team/delete",
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

export const togglePublishTeam = createAsyncThunk(
  "team/togglePublish",
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

export const fetchTeamBySlug = createAsyncThunk(
  "team/fetchBySlug",
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
const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    clearTeamMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    setSelectedTeam: (state, action: PayloadAction<ITeam | null>) => {
      state.selected = action.payload;
    },
  },
  extraReducers: (builder) => {
    const setLoading = (state: TeamState) => {
      state.loading = true;
      state.status = "loading";
      state.error = null;
    };

    const setError = (state: TeamState, action: PayloadAction<any>) => {
      state.loading = false;
      state.status = "failed";
      state.error = extractErrorMessage(action.payload);
    };

    // 🌐 Public
    builder
      .addCase(fetchTeam.pending, setLoading)
      .addCase(fetchTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.team = action.payload;
      })
      .addCase(fetchTeam.rejected, setError);

    // 🔐 Admin List
    builder
      .addCase(fetchAllTeamAdmin.pending, setLoading)
      .addCase(fetchAllTeamAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.teamAdmin = action.payload;
      })
      .addCase(fetchAllTeamAdmin.rejected, setError);

    // ➕ Create
    builder
      .addCase(createTeam.pending, setLoading)
      .addCase(createTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.teamAdmin.unshift(action.payload.data);
        state.successMessage = action.payload.message; // 👈 BACKEND'DEN
      })
      .addCase(createTeam.rejected, setError);

    // 📝 Update
    builder
      .addCase(updateTeam.pending, setLoading)
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        const updated = action.payload.data;
        const i = state.teamAdmin.findIndex((a) => a._id === updated._id);
        if (i !== -1) state.teamAdmin[i] = updated;
        if (state.selected?._id === updated._id) state.selected = updated;
        state.successMessage = action.payload.message; // 👈 BACKEND'DEN
      })
      .addCase(updateTeam.rejected, setError);

    // 🗑️ Delete
    builder
      .addCase(deleteTeam.pending, setLoading)
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.teamAdmin = state.teamAdmin.filter((a) => a._id !== action.payload.id);
        state.successMessage = action.payload.message; // 👈 BACKEND'DEN
      })
      .addCase(deleteTeam.rejected, setError);

    // 🌍 Toggle Publish
    builder
      .addCase(togglePublishTeam.pending, setLoading)
      .addCase(togglePublishTeam.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        const updated = action.payload.data;
        const i = state.teamAdmin.findIndex((a) => a._id === updated._id);
        if (i !== -1) state.teamAdmin[i] = updated;
        if (state.selected?._id === updated._id) state.selected = updated;
        state.successMessage = action.payload.message; // 👈 BACKEND'DEN
      })
      .addCase(togglePublishTeam.rejected, setError);

    // 🔎 Single (Slug)
    builder
      .addCase(fetchTeamBySlug.pending, setLoading)
      .addCase(fetchTeamBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.status = "succeeded";
        state.selected = action.payload;
      })
      .addCase(fetchTeamBySlug.rejected, setError);
  },
});

export const { clearTeamMessages, setSelectedTeam } = teamSlice.actions;
export default teamSlice.reducer;
