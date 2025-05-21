import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import NotFoundPage from "./pages/NotFoundPage";
import CartPage from "./pages/CartPage";
import LoginPage from "./pages/LoginPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import RegisterPage from "./pages/RegisterPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import AdminProductsPage from "./pages/admin/ProductsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminCategoriesPage from "./pages/admin/CategoriesPage";
import AdminAddCategoryPage from "./pages/admin/AdminAddCategoryPage";
import AdminEditCategoryPage from "./pages/admin/AdminEditCategoryPage";
import AdminAddProductPage from "./pages/admin/AdminAddProductPage";
import AdminEditProductPage from "./pages/admin/AdminEditProductPage";
import ListUserPage from "./pages/admin/ListUserPage";
import AddressPage from "./pages/admin/AddressPage";
import AdminOrderListPage from "./pages/admin/OrderList";
import AdminOrderDetailPage from "./pages/admin/OrderDetail";
import OrdersPage from "./pages/OrderPage";
import Address from "./pages/Address.tsx";
import AddAddressPage from "./pages/AddAddressPage";
import VerifyPage from "./pages/VerifyPage";
import ChangePasswordPage from "./pages/ChangePassword";
import UpdateProfilePage from "./pages/UserProfilePage";
import RestrictedPage from "./pages/RestrictedPage";
import ProtectedAdminRoute from "./ProtectedAdminRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import FavoritesPage from "./pages/favorites-page.tsx";
import UpdateAddressPage from "./pages/UpdateAddressPage.tsx";
import OrderStatisticsPage from "./pages/admin/AdminStatisticsPage";


// Create router with routes
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Routes sử dụng MainLayout */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        <Route path="gioi-thieu" element={<AboutPage />} />
        <Route path="lien-he" element={<ContactPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="my-order" element={<OrdersPage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="address" element={<Address />} />
        <Route path="address/add" element={<AddAddressPage />} />
        <Route path="address/update/:id" element={<UpdateAddressPage />} />
        <Route path="profile" element={<UpdateProfilePage />} />
        <Route path="wishlist" element={<FavoritesPage />} />
        <Route path="restricted" element={<RestrictedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin Routes sử dụng AdminLayout - không lồng trong MainLayout */}
      <Route path="/admin" element={<ProtectedAdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="order-statistics" element={<OrderStatisticsPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="add-categories" element={<AdminAddCategoryPage />} />
          <Route path="danh-muc/sua/:id" element={<AdminEditCategoryPage />} />
          <Route path="add-products" element={<AdminAddProductPage />} />
          <Route path="san-pham/sua/:id" element={<AdminEditProductPage />} />
          <Route path="list-user" element={<ListUserPage />} />
          <Route path="address" element={<AddressPage />} />
          <Route path="orders" element={<AdminOrderListPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        </Route>
      </Route>
    </>
  )
);

export default function App() {
  return (
    <>
      {/* Đặt ToastContainer ở cấp ứng dụng để sử dụng chung */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <RouterProvider router={router} />
    </>
  );
}