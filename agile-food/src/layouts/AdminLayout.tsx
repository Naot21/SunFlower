import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import {
  FiHome,
  FiBox,
  FiList,
  FiFileText,
  FiUsers,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";
import axios from "axios";

interface User {
  language: string;
  backgroundType: "color" | "image";
  backgroundColor: string;
  backgroundImage: string;
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [cookies] = useCookies(["jwt_token"]);
  const [user, setUser] = useState<User | null>(null);

  const API_URL = "http://localhost:8080/api";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_URL}/settings/get`, {
          headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          withCredentials: true,
        });
        setUser(response.data);
      } catch (error) {
        console.error("Không thể tải cài đặt:", error);
      }
    };
    fetchSettings();
  }, [cookies.jwt_token]);

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

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar && !sidebar.contains(event.target as Node) && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const translations = {
    vi: {
      dashboard: "Dashboard",
      products: "Sản phẩm",
      categories: "Danh mục",
      orders: "Đơn hàng",
      users: "Người dùng",
      settings: "Cài đặt",
      logout: "Quay về trang chủ",
      adminSettings: "Cài đặt",
    },
    en: {
      dashboard: "Dashboard",
      products: "Products",
      categories: "Categories",
      orders: "Orders",
      users: "Users",
      settings: "Settings",
      logout: "Return to Homepage",
      adminSettings: "Settings",
    },
  };

  const t = translations[user?.language || "vi"];

  const menuItems = [
    { name: t.dashboard, path: "/admin", icon: <FiHome className="w-5 h-5" />, exact: true },
    { name: t.products, path: "/admin/products", icon: <FiBox className="w-5 h-5" /> },
    { name: t.categories, path: "/admin/categories", icon: <FiList className="w-5 h-5" /> },
    { name: t.orders, path: "/admin/orders", icon: <FiFileText className="w-5 h-5" /> },
    { name: t.users, path: "/admin/list-user", icon: <FiUsers className="w-5 h-5" /> },
  ];

  return (
      <div className="flex h-screen">
        <aside
            id="sidebar"
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <Link to="/admin" className="flex items-center space-x-2">
                <div className="bg-gray-900 text-white p-2 rounded-md">
                  <FiBox className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">Agile Food</span>
                  <span className="ml-2 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded">
                  Admin
                </span>
                </div>
              </Link>
            </div>

            <button
                className="absolute top-4 right-4 lg:hidden text-gray-500 hover:text-gray-900"
                onClick={() => setMobileMenuOpen(false)}
            >
              <FiX className="w-6 h-6" />
            </button>

            <nav className="flex-1 py-6 px-4 overflow-y-auto">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                    <li key={item.path}>
                      <Link
                          to={item.path}
                          className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                              isActive(item.path) && (item.exact ? location.pathname === item.path : true)
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        <span className="mr-3">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </li>
                ))}
              </ul>

              <div className="border-t border-gray-200 mt-6 pt-6">
                <ul className="space-y-1">
                  <li>
                    <Link
                        to="/admin/settings"
                        className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                            isActive("/admin/settings")
                                ? "bg-gray-900 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <FiSettings className="w-5 h-5 mr-3" />
                      <span className="font-medium">{t.adminSettings}</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                        to="/"
                        className="flex items-center px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FiLogOut className="w-5 h-5 mr-3" />
                      <span className="font-medium">{t.logout}</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
        </aside>

        <div className="flex-1 flex flex-col lg:ml-64">
          <header className="bg-white shadow-sm sticky top-0 z-40 lg:hidden">
            <div className="p-4 flex justify-between items-center">
              <button
                  className="text-gray-500 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(true)}
              >
                <FiMenu className="w-6 h-6" />
              </button>
              <Link to="/admin" className="text-xl font-bold text-gray-900">
                Agile Food Admin
              </Link>
              <div className="w-6"></div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50">
            <Outlet />
          </main>
        </div>
      </div>
  );
}