import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  role: string | null;
  userName: string | null;
  userId: string | null;
  isActive: boolean; // Статус активности пользователя
  isVerified: boolean; // Новый флаг для верификации пользователя
}

const initialState: UserState = {
  role: localStorage.getItem('role') || null,
  userName: localStorage.getItem('userName') || null,
  userId: localStorage.getItem('userId') || null,
  isActive: localStorage.getItem('isActive') === 'true', // По умолчанию true, если в localStorage нет значения
  isVerified: localStorage.getItem('isVerified') === 'true', // Статус верификации пользователя из localStorage
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserRole(state, action: PayloadAction<string>) {
      state.role = action.payload;
      localStorage.setItem('role', action.payload); // Сохраняем роль в localStorage
    },
    setUserName(state, action: PayloadAction<string>) {
      state.userName = action.payload;
      localStorage.setItem('userName', action.payload); // Сохраняем имя пользователя в localStorage
    },
    setUserId(state, action: PayloadAction<string>) {
      state.userId = action.payload;
      localStorage.setItem('userId', action.payload); // Сохраняем userId в localStorage
    },
    setUserActiveStatus(state, action: PayloadAction<boolean>) {
      state.isActive = action.payload;
      localStorage.setItem('isActive', String(action.payload)); // Сохраняем статус активности в localStorage
    },
    setUserVerifiedStatus(state, action: PayloadAction<boolean>) {
      state.isVerified = action.payload;
      localStorage.setItem('isVerified', String(action.payload)); // Сохраняем статус верификации в localStorage
    },
    logout(state) {
      state.role = null;
      state.userName = null;
      state.userId = null;
      state.isActive = true; // При выходе статус активности сбрасывается в true
      state.isVerified = false; // При выходе статус верификации сбрасывается
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      localStorage.removeItem('isActive');
      localStorage.removeItem('isVerified'); // Удаляем статус верификации из localStorage
    },
  },
});

export const { setUserRole, setUserName, setUserId, setUserActiveStatus, setUserVerifiedStatus, logout } = userSlice.actions;
export default userSlice.reducer;
