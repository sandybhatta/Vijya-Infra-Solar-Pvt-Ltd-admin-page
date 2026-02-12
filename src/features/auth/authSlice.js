import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  user: null,
  session: null,
  isAuthenticated: false,
  role: null, // 'admin' | 'manager'
  isActive: false,
  loading: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user
      state.session = action.payload.session
      state.isAuthenticated = !!action.payload.session
      state.role = action.payload.role || 'manager'
      state.isActive = action.payload.isActive !== undefined ? action.payload.isActive : false
      state.loading = false
    },
    clearUser: (state) => {
      state.user = null
      state.session = null
      state.isAuthenticated = false
      state.role = null
      state.isActive = false
      state.loading = false
    },
    setLoading: (state, action) => {
        state.loading = action.payload
    }
  },
})

export const { setUser, clearUser, setLoading } = authSlice.actions
export default authSlice.reducer
