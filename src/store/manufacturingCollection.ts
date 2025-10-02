// src/store/manufacturingSlice.ts
import type { RawMaterialsApiResponse } from "@/types/rawMaterial";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IndentsApiResponse } from "@/types/indent";
import type { VendorsApiResponse } from "@/types/vendor";
import type { PurchaseOrderApiResponse } from "@/types/purchaseType";
import type { UsersApiResponse } from "@/types/UsersApiResponse";
import type { GrnsApiResponse } from "@/types/grn";
import type { RawMaterialBatchApiResponse } from "@/types/rawmaterialBatch";
import type { ProductionApiResponse } from "@/types/productionTypes";

interface ManufacturingState {
  rawMaterialResponse: RawMaterialsApiResponse | null;
  indentResponse: IndentsApiResponse | null;
  vendorResponse: VendorsApiResponse | null;
  purchaseOrderResponse: PurchaseOrderApiResponse | null;
  userResponse: UsersApiResponse | null;
  grnResponse: GrnsApiResponse | null;
  rawMaterialBatch: RawMaterialBatchApiResponse | null;
  productionResponse: ProductionApiResponse | null;
}

const initialState: ManufacturingState = {
  rawMaterialResponse: null,
  indentResponse: null,
  vendorResponse: null,
  purchaseOrderResponse: null,
  userResponse: null,
  grnResponse: null,
  rawMaterialBatch: null,
  productionResponse: null,
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
    setVendorResponse: (state, action: PayloadAction<VendorsApiResponse>) => {
      state.vendorResponse = action.payload;
    },
    clearVendorResponse: (state) => {
      state.vendorResponse = null;
    },
    setPurchaseOrderResponse: (state, action: PayloadAction<PurchaseOrderApiResponse>) => {
      state.purchaseOrderResponse = action.payload;
    },
    clearPurchaseOrderResponse: (state) => {
      state.purchaseOrderResponse = null;
    },
    setUserResponse: (state, action: PayloadAction<UsersApiResponse>) => {
      state.userResponse = action.payload;
    },
    clearUserResponse: (state) => {
      state.userResponse = null;
    },
    setGrnResponse: (state, action: PayloadAction<GrnsApiResponse>) => {
      state.grnResponse = action.payload;
    },
    clearGrnResponse: (state) => {
      state.grnResponse = null;
    },
    setRawMaterialBatchResponse: (state,action:PayloadAction<RawMaterialBatchApiResponse>)=> {
      state.rawMaterialBatch = action.payload;
    },
    clearRawMaterialBatchResponse: (state)=>{
      state.rawMaterialBatch = null;
    },
    setProductionResponse: (state, action: PayloadAction<ProductionApiResponse>) => {
      state.productionResponse = action.payload;
    },
    clearProductionResponse: (state) => {
      state.productionResponse = null;
    },
  },
});

export const { setRawMaterialResponse, clearRawMaterialResponse,
  setIndentResponse, clearIndentResponse,
  setVendorResponse, clearVendorResponse,
  setPurchaseOrderResponse, clearPurchaseOrderResponse,
  setUserResponse, clearUserResponse,
  setGrnResponse, clearGrnResponse,
  setRawMaterialBatchResponse,clearRawMaterialBatchResponse,
  setProductionResponse, clearProductionResponse
} = manufacturingSlice.actions;
export default manufacturingSlice.reducer;
