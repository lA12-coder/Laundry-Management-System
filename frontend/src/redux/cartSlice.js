import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    items: [],
    totalAmount: 0,
    totalQuantity: 0,
}

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {

        addToCart(state, action) {
            const newItem = action.payload;
            const existingItem = state.items.find(item => item.id === newItem.id);

            if (!existingItem) {
                state.items.push({
                    ...newItem,
                    quantity: newItem.quantity || 1
                });

            } else {
                existingItem.quantity += newItem.quantity || 1;
            }

            // Recalculate total amount and quantity
            state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
            state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        },

        removeFromCart(state, action) {
            const id = action.payload;
            state.items = state.items.filter(item => item.id != id);

            // Recalculate total amount and quantity
            state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
            state.totalAmount = state.items.reduce((total, item) => total + item.quantity * item.price, 0);
        },
          
        updateQuantity(state, action) {
            const { id, quantity } = action.payload;
            const existingItem = state.items.find((item) => item.id == id)
            if (existingItem && quantity >= 0) {
                existingItem.quantity = quantity
            }

            if (existingItem.quantity === 0) {
                state.items = state.items.filter(item => item.id !== existingItem.id)
            }

            // Recalculate total amount and quantity
            state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
            state.totalAmount = state.items.reduce((total, item) => total + item.quantity * item.price, 0);
        }
        

    }

});


export const { addToCart, removeFromCart, updateQuantity } = cartSlice.actions;
export default cartSlice.reducer;

