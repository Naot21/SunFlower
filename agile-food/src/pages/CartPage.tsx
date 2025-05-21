
import type React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiArrowLeft, FiShoppingCart, FiTag, FiTruck } from "react-icons/fi";
import { useCookies } from "react-cookie";

interface Product {
  id: string;
  name: string;
  price: number;
  categoryName: string;
  inStock: boolean;
  images: string[];
  createdAt: string;
  quantity: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cookies, , removeCookie] = useCookies(["jwt_token"]);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    const verifyTokenAndLoadCart = async () => {
      try {
        if (!cookies.jwt_token) {
          throw new Error("Vui lòng đăng nhập để xem giỏ hàng.");
        }

        // Verify token by making a request to a protected endpoint
        await axios.get(`${API_URL}/auth/user`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${cookies.jwt_token}` },
        });

        // Load cart from localStorage if token is valid
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } catch (err: any) {
        let errorMessage = "Lỗi khi xác thực. Vui lòng đăng nhập lại.";
        if (err.response?.status === 401) {
          removeCookie("jwt_token", { path: "/" });
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        } else if (err.response?.status === 403) {
          errorMessage = "Bạn không có quyền truy cập giỏ hàng.";
        } else {
          errorMessage = err.message || errorMessage;
        }
        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 3000,
        });
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyTokenAndLoadCart();
  }, [cookies.jwt_token, navigate, removeCookie, API_URL]);

  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const updatedCart = cartItems.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item));
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeCartItem = (itemId: string) => {
    const updatedCart = cartItems.filter((item) => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    toast.success("Đã xóa sản phẩm khỏi giỏ hàng", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
    toast.success("Đã xóa toàn bộ giỏ hàng", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const checkStockBeforeCheckout = async () => {
    try {
      const outOfStockItems: { name: string; inStock: number; requested: number }[] = [];

      for (const item of cartItems) {
        const response = await axios.get(`${API_URL}/products/${item.id}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${cookies.jwt_token}` },
        });
        const inStock = response.data.quantity;
        if (item.quantity > inStock) {
          outOfStockItems.push({ name: item.name, inStock, requested: item.quantity });
        }
      }

      if (outOfStockItems.length > 0) {
        const errorMessage = (
          <div>
            <p>Các sản phẩm sau vượt quá số lượng tồn kho:</p>
            <ul className="list-disc pl-5">
              {outOfStockItems.map((item, index) => (
                <li key={index}>
                  {item.name}: Yêu cầu {item.requested}, chỉ còn {item.inStock} trong kho.
                </li>
              ))}
            </ul>
            <p>Vui lòng điều chỉnh số lượng.</p>
          </div>
        );
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
        return false;
      }

      return true;
    } catch (error: any) {
      console.error("Lỗi khi kiểm tra số lượng tồn kho:", error);
      toast.error("Không thể kiểm tra số lượng tồn kho. Vui lòng thử lại!", {
        position: "top-right",
        autoClose: 3000,
      });
      return false;
    }
  };

  const handleCheckout = async () => {
    const isStockValid = await checkStockBeforeCheckout();
    if (isStockValid) {
      navigate("/checkout");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://via.placeholder.com/150";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <ToastContainer />
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">{error}</h2>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors font-medium"
          >
            <FiArrowLeft className="mr-2" />
            <span>Quay lại trang chủ</span>
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <FiShoppingCart className="mr-3 text-gray-900" />
            Giỏ hàng của bạn
          </h1>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 flex items-center gap-2 px-4 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FiTrash2 />
              Xóa tất cả
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FiShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Hãy thêm một số sản phẩm để bắt đầu mua sắm!</p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              <FiShoppingBag className="mr-2" />
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <span className="bg-black text-white rounded-full w-7 h-7 inline-flex items-center justify-center mr-3 text-sm">
                      {cartItems.length}
                    </span>
                    Sản phẩm trong giỏ hàng
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={item.images[0] || "https://via.placeholder.com/150"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                      </div>
                      <div className="flex-1">
                        <Link
                          to={`/products/${item.id}`}
                          className="text-lg font-medium hover:text-gray-900 transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <FiTag className="mr-1 text-gray-400" />
                          {item.categoryName}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className={`w-8 h-8 flex items-center justify-center rounded-md ${
                              item.quantity <= 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            } transition-colors`}
                            aria-label="Giảm số lượng"
                          >
                            <FiMinus size={16} />
                          </button>
                          <span className="w-10 h-8 flex items-center justify-center text-center font-medium bg-white border border-gray-200 rounded-md">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            aria-label="Tăng số lượng"
                          >
                            <FiPlus size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-right sm:ml-4 w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {(item.price * item.quantity).toLocaleString()}đ
                          </p>
                          <p className="text-sm text-gray-500">Đơn giá: {item.price.toLocaleString()}đ</p>
                        </div>
                        <button
                          onClick={() => removeCartItem(item.id)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          aria-label="Xóa sản phẩm"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100 text-gray-800">
                  Tóm tắt đơn hàng
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center">
                      <FiShoppingBag className="mr-2 text-gray-400" />
                      Tổng số lượng
                    </span>
                    <span className="font-medium">
                      {cartItems.reduce((total, item) => total + item.quantity, 0)} sản phẩm
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tổng tiền hàng</span>
                    <span className="font-medium">{calculateTotal().toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center">
                      <FiTruck className="mr-2 text-gray-400" />
                      Phí vận chuyển
                    </span>
                    <span className="font-medium text-gray-900">Miễn phí</span>
                  </div>
                  <div className="border-t border-gray-100 mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Tổng cộng</span>
                      <span className="text-xl font-bold text-gray-900">{calculateTotal().toLocaleString()}đ</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 px-6 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm"
                >
                  <FiShoppingBag />
                  Tiến hành thanh toán
                </button>
                <Link
                  to="/"
                  className="block text-center mt-4 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  Tiếp tục mua sắm
                </Link>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiTruck className="mr-1 text-gray-900" />
                      Giao hàng nhanh
                    </div>
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1 text-gray-900"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Thanh toán an toàn
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
