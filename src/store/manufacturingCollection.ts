// src/store/manufacturingSlice.ts
import type { RawMaterialsApiResponse } from "@/types/rawMaterial";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IndentsApiResponse } from "@/types/indent";

interface ManufacturingState {
  rawMaterialResponse: RawMaterialsApiResponse | null;
  indentResponse: IndentsApiResponse | null;
}

const initialState: ManufacturingState = {
  rawMaterialResponse: null,
  indentResponse: null,
};

export const manufacturingSlice = createSlice({
  name: "manufacturing",
  initialState,
  reducers: {
    setRawMaterialResponse: (state, action: PayloadAction<RawMaterialsApiResponse>) => {
      state.rawMaterialResponse = action.payload;
    },
    clearRawMaterialResponse: (state) => {
      state.rawMaterialResponse = null;
    },
    setIndentResponse: (state, action: PayloadAction<IndentsApiResponse>) => {
      state.indentResponse = action.payload;
    },
    clearIndentResponse: (state) => {
      state.indentResponse = null;
    },
  },
});

export const { setRawMaterialResponse, clearRawMaterialResponse, setIndentResponse, clearIndentResponse } = manufacturingSlice.actions;
export default manufacturingSlice.reducer;
