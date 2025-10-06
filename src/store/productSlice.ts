import { createSlice } from "@reduxjs/toolkit";


export const productSlice = createSlice({
    name: "product",
    initialState: {
        products: [],
    },
    reducers: {
        setProducts: (state, action) => {
            state.products = action.payload;
        },
    },
});

export default productSlice.reducer;

export const { setProducts } = productSlice.actions;
