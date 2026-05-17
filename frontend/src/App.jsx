import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import BookList from './pages/BookList.jsx';
import BookDetail from './pages/BookDetail.jsx';
import BookNew from './pages/BookNew.jsx';
import BookEdit from './pages/BookEdit.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Profile from './pages/Profile.jsx';

const AppContent = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = theme === 'dark'
        ? '/BiblioTech-DarkModeLogo.png'
        : '/BiblioTech-WhiteModeLogo.png';
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/books" replace />} />

          <Route path="/books" element={<BookList />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<PrivateRoute />}>
            <Route path="/books/new" element={<BookNew />} />
            <Route path="/books/:id/edit" element={<BookEdit />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<PrivateRoute adminOnly />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
};

const App = () => <AppContent />;

export default App;
