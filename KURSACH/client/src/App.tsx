// src/App.tsx
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Catalog from './components/Catalog';
import CreateHousing from './components/CreateHousing';
import Navbar from './components/Navbar';  // Импортируем Navbar
import PropertyPage from './components/PropertyPage';
import { Provider } from 'react-redux';
import { store } from './store';
import EditProperty from './components/EditProperty';
import OwnerBookingsPage from './components/OwnerBookingsPage';
import BookingHistory from './components/BookingHistory';
import AdminPanel from './components/AdminPanel';
import UserSettings from './components/UserSettings';
import ChatListComponent from './components/ChatListComponent';
import OwnerStatistics from './components/OwnerStatistics';
import UserManagement from './components/UserManagement';

const App: React.FC = () => (
  <Provider store={store}>
    <BrowserRouter>
      <Navbar /> {/* Добавляем Navbar */}
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/create" element={<CreateHousing />} />
        <Route path="/property/:id" element={<PropertyPage />} />
        <Route path="/property/:id/edit" element={<EditProperty />} />
        <Route path="/owner/:id" element={<OwnerBookingsPage />} />
        <Route path="/user-history/:id" element={<BookingHistory />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/manager" element={<UserManagement />} />
        <Route path="/user-settings/:userId" element={<UserSettings />} />
        <Route path="/user-chats/:userId" element={<ChatListComponent />} />
        <Route path="/statistics" element={<OwnerStatistics />} />
      </Routes>
    </BrowserRouter>
  </Provider>
);

export default App;
