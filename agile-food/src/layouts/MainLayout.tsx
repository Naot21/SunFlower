import type React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiAlertCircle, FiCheckCircle, FiMail } from "react-icons/fi";

interface User {
  email: string;
  fullName: string;
  phone: string;
  status: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
  language: string;
  backgroundType: "color" | "image";
  backgroundColor: string;
  backgroundImage: string;
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cookies, , removeCookie] = useCookies(["jwt_token"]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const API_URL = "http://localhost:8080/api";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    if (search) {
      setSearchQuery(decodeURIComponent(search.replace(/\+/g, " ")));
    } else {
      setSearchQuery("");
    }
  }, [location.search]);

  useEffect(() => {
    if (user) {
      document.documentElement.lang = user.language || "vi";
      const body = document.body;
      if (user.backgroundType === "image" && user.backgroundImage) {
        body.style.background = `url(${user.backgroundImage}) no-repeat center/cover fixed`;
      } else {
        body.style.background = user.backgroundColor || "#f3f4f6";
      }
    }
  }, [user]);

  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiry = payload.exp * 1000;
      return Date.now() > expiry;
    } catch (error) {
      console.error("Lỗi khi giải mã token:", error);
      return true;
    }
  };

  const handleResendVerification = async () => {
    try {
      await axios.post(
          `${API_URL}/auth/resend-verification`,
          {},
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          }
      );
      toast.success(
          <div className="flex items-center">
            <FiMail className="w-5 h-5 mr-2" />
            <span>Email xác minh đã được gửi lại.</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
      );
      navigate("/verify");
    } catch (error) {
      toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>Không thể gửi email xác minh.</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
      );
    }
  };

  const fetchUser = useCallback(async () => {
    const token = cookies.jwt_token;
    if (!token) {
      setUser(null);
      setLoading(false);
      navigate("/login");
      return;
    }

    if (isTokenExpired(token)) {
      removeCookie("jwt_token", { path: "/" });
      setUser(null);
      setLoading(false);
      toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>Phiên đăng nhập hết hạn.</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
      );
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get<User>(`${API_URL}/auth/user`, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = {
        ...response.data,
        role: response.data.role?.toUpperCase() as "CUSTOMER" | "ADMIN",
      };
      setUser(userData);

      if (userData.status === "PENDING") {
        toast.warn(
            <div
                className="flex items-center cursor-pointer"
                onClick={handleResendVerification}
            >
              <FiAlertCircle className="w-5 h-5 mr-2" />
              <span>Tài khoản chưa xác minh.</span>
            </div>,
            { position: "top-right", autoClose: 5000 }
        );
      } else if (userData.status === "ACTIVE") {
        toast.success(
            <div className="flex items-center">
              <FiCheckCircle className="w-5 h-5 mr-2" />
              <span>Chào mừng {userData.fullName || userData.email}!</span>
            </div>,
            { position: "top-right", autoClose: 3000 }
        );
      }
    } catch (error) {
      toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>Không thể lấy thông tin người dùng.</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
      );
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [cookies.jwt_token, navigate, removeCookie]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
          mobileMenuRef.current &&
          !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          }
      );
      toast.success(
          <div className="flex items-center">
            <FiCheckCircle className="w-5 h-5 mr-2" />
            <span>Đăng xuất thành công!</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
      );
    } catch (error) {
      toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            <span>Đăng xuất thất bại.</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
      );
    } finally {
      removeCookie("jwt_token", { path: "/" });
      setUser(null);
      setIsDropdownOpen(false);
      navigate("/login");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      navigate("/");
    } else {
      const keywords = trimmedQuery.split(/\s+/).filter(Boolean);
      const encodedQuery = keywords.map(encodeURIComponent).join("+");
      navigate(`/?search=${encodedQuery}`);
    }
    setIsMobileMenuOpen(false);
  };

  const translations = {
    vi: {
      home: "Trang chủ",
      products: "Sản phẩm",
      about: "Giới thiệu",
      contact: "Liên hệ",
      searchPlaceholder: "Tìm kiếm sản phẩm...",
      profile: "Thông tin cá nhân",
      changePassword: "Đổi mật khẩu",
      address: "Địa chỉ",
      wishlist: "Yêu thích",
      orders: "Đơn hàng",
      adminOrders: "Quản lý đơn hàng",
      logout: "Đăng xuất",
      login: "Đăng nhập",
      register: "Đăng ký",
      settings: "Cài đặt",
    },
    en: {
      home: "Home",
      products: "Products",
      about: "About",
      contact: "Contact",
      searchPlaceholder: "Search products...",
      profile: "Profile",
      changePassword: "Change Password",
      address: "Address",
      wishlist: "Wishlist",
      orders: "Orders",
      adminOrders: "Manage Orders",
      logout: "Logout",
      login: "Login",
      register: "Register",
      settings: "Settings",
    },
  };

  const t = translations[user?.language || "vi"];

  const renderUserDropdown = () => (
      <div className="relative" ref={dropdownRef}>
        <button
            className="flex items-center font-medium bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
        >
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center mr-2 text-sm font-bold">
            {user?.fullName?.charAt(0).toUpperCase() ||
                user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
          <span className="max-w-[120px] truncate">
          {user?.fullName || user?.email || "User"}
        </span>
          <svg
              className={`w-4 h-4 ml-2 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
          >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <div
            className={`absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50 transition-all ${
                isDropdownOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
            }`}
        >
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium">{user?.fullName || "Người dùng"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email || "Không có email"}</p>
          </div>
          <div className="py-1">
            <Link
                to="/profile"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {t.profile}
            </Link>
            <Link
                to="/change-password"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              {t.changePassword}
            </Link>
            <Link
                to="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsDropdownOpen(false)}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {t.settings}
            </Link>
            {user?.role === "CUSTOMER" && (
                <>
                  <Link
                      to="/address"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {t.address}
                  </Link>
                  <Link
                      to="/my-order"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                    {t.orders}
                  </Link>
                </>
            )}
            {user?.role === "ADMIN" && (
                <Link
                    to="/admin/orders"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {t.adminOrders}
                </Link>
            )}
          </div>
          <div className="py-1 border-t">
            <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {t.logout}
            </button>
          </div>
        </div>
      </div>
  );

  if (loading) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black mb-4"></div>
          <p className="text-gray-600 font-medium">{t.loading || "Đang tải..."}</p>
        </div>
    );
  }

  return (
      <div className="min-h-screen flex flex-col">
        <header className="bg-white py-4 shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                  className="md:hidden mr-2 p-2 rounded-md hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <Link to="/" className="text-2xl font-bold flex items-center">
                <span className="bg-black text-white px-2 py-1 rounded mr-1">Agile</span>
                <span>Food</span>
              </Link>
            </div>

            <nav className="hidden md:flex space-x-6">
              <Link to="/" className="font-medium hover:text-gray-600 relative group">
                {t.home}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
              </Link>
              <Link to="/#products" className="font-medium hover:text-gray-600 relative group">
                {t.products}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
              </Link>
              <Link to="/gioi-thieu" className="font-medium hover:text-gray-600 relative group">
                {t.about}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
              </Link>
              <Link to="/lien-he" className="font-medium hover:text-gray-600 relative group">
                {t.contact}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <form onSubmit={handleSearch} className="relative hidden md:block">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black w-48 md:w-64"
                />
                <button
                    type="submit"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                >
                  <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d=" gehemit21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </button>
              </form>

              <Link to="/cart" className="relative p-2 rounded-full hover:bg-gray-100">
                <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                  />
                </svg>
                <span className="absolute top-0 right-0 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full"></span>
              </Link>

              {user ? (
                  renderUserDropdown()
              ) : (
                  <Link
                      to="/login"
                      className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    {t.login}
                  </Link>
              )}
            </div>
          </div>
        </header>

        <div
            ref={mobileMenuRef}
            className={`fixed inset-0 z-30 transform transition-transform duration-300 ${
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative bg-white h-full w-4/5 max-w-sm shadow-xl overflow-y-auto">
            <div className="p-5 border-b flex justify-between items-center">
              <Link
                  to="/"
                  className="text-2xl font-bold"
                  onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="bg-black text-white px-2 py-1 rounded mr-1">Agile</span>
                <span>Food</span>
              </Link>
              <button
                  className="p-2 rounded-md hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-5">
              <form onSubmit={handleSearch} className="relative mb-6">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                    type="submit"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                >
                  <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                  >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </button>
              </form>

              <nav className="space-y-1">
                <Link
                    to="/"
                    className="block px-3 py-2 rounded-md hover:bg-gray-100 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t.home}
                </Link>
                <Link
                    to="/#products"
                    className="block px-3 py-2 rounded-md hover:bg-gray-100 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t.products}
                </Link>
                <Link
                    to="/gioi-thieu"
                    className="block px-3 py-2 rounded-md hover:bg-gray-100 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t.about}
                </Link>
                <Link
                    to="/lien-he"
                    className="block px-3 py-2 rounded-md hover:bg-gray-100 font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t.contact}
                </Link>
              </nav>

              <div className="mt-6 pt-6 border-t">
                {user ? (
                    <div className="space-y-1">
                      <div className="px-3 py-2">
                        <p className="font-medium">{user.fullName || "Người dùng"}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <Link
                          to="/profile"
                          className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        {t.profile}
                      </Link>
                      <Link
                          to="/change-password"
                          className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                          />
                        </svg>
                        {t.changePassword}
                      </Link>
                      <Link
                          to="/settings"
                          className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                          onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {t.settings}
                      </Link>
                      {user?.role === "CUSTOMER" && (
                          <>
                            <Link
                                to="/address"
                                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <svg
                                  className="w-5 h-5 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              {t.address}
                            </Link>
                            <Link
                                to="/my-order"
                                className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <svg
                                  className="w-5 h-5 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                              >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                />
                              </svg>
                              {t.orders}
                            </Link>
                          </>
                      )}
                      {user?.role === "ADMIN" && (
                          <Link
                              to="/admin/orders"
                              className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
                              onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <svg
                                className="w-5 h-5 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                            {t.adminOrders}
                          </Link>
                      )}
                      <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-gray-100"
                      >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {t.logout}
                      </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                      <Link
                          to="/login"
                          className="block w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t.login}
                      </Link>
                      <Link
                          to="/register"
                          className="block w-full bg-white text-black px-4 py-2 rounded-lg border-2 border-black hover:bg-gray-100 text-center"
                          onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {t.register}
                      </Link>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="flex-grow">
          <Outlet context={{ user }} />
        </main>

        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Agile Food</h3>
                <p className="text-gray-400 mb-4">
                  {t.footerDescription || "Thực phẩm tươi sạch, giao hàng nhanh chóng."}
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path
                          fillRule="evenodd"
                          d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                          clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path
                          fillRule="evenodd"
                          d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                          clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t.information || "Thông tin"}</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/gioi-thieu" className="text-gray-400 hover:text-white">
                      {t.aboutUs || "Về chúng tôi"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/chinh-sach-bao-mat" className="text-gray-400 hover:text-white">
                      {t.privacyPolicy || "Chính sách bảo mật"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/dieu-khoan-su-dung" className="text-gray-400 hover:text-white">
                      {t.termsOfUse || "Điều khoản sử dụng"}
                    </Link>
                  </li>
                  <li>
                    <Link to="/chinh-sach-van-chuyen" className="text-gray-400 hover:text-white">
                      {t.shippingPolicy || "Chính sách vận chuyển"}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t.account || "Tài khoản"}</h3>
                <ul className="space-y-2">
                  <li>
                    <Link to="/login" className="text-gray-400 hover:text-white">
                      {t.login}
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="text-gray-400 hover:text-white">
                      {t.register}
                    </Link>
                  </li>
                  <li>
                    <Link to="/my-order" className="text-gray-400 hover:text-white">
                      {t.orders}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">{t.contact || "Liên hệ"}</h3>
                <ul className="space-y-2 text-gray-400">
                  <li className="flex items-start">
                    <svg
                        className="w-5 h-5 mr-2 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{t.addressDetails || "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh"}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{t.phone || "0123 456 789"}</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{t.email || "info@agilefood.com"}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
              <p>© 2025 Agile Food. All rights reserved.</p>
            </div>
          </div>
        </footer>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
  );
}