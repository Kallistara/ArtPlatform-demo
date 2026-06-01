import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
import { ProtectedRoute } from '../../shared/ui/ProtectedRoute/ProtectedRoute';
import { HomePage } from '../../pages/HomePage/HomePage';
import { CatalogPage } from '../../pages/CatalogPage/CatalogPage';
import { ArtworkPage } from '../../pages/ArtworkPage/ArtworkPage';
import { FavoritesPage } from '../../pages/FavoritesPage/FavoritesPage';
import { CartPage } from '../../pages/CartPage/CartPage';
import { AccountPage } from '../../pages/AccountPage/AccountPage';
import { LoginPage } from '../../pages/LoginPage/LoginPage';
import { RegisterPage } from '../../pages/RegisterPage/RegisterPage';
import { AdminPage } from '../../pages/AdminPage/AdminPage';
import { CreateArtworkPage } from '../../pages/CreateArtworkPage/CreateArtworkPage';
import { EditArtworkPage } from '../../pages/EditArtworkPage/EditArtworkPage';
import { ArtistPage } from '../../pages/ArtistPage/ArtistPage';
import { CheckoutPage } from '../../pages/CheckoutPage/CheckoutPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/artworks/:id" element={<ArtworkPage />} />
        <Route path="/artists/:userId" element={<ArtistPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/artworks/edit/:id" element={<EditArtworkPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['Artist']} />}>
          <Route path="/artworks/create" element={<CreateArtworkPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['Artist', 'Admin']} />}>
          <Route path="/artworks/:id/edit" element={<EditArtworkPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['Admin']} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}