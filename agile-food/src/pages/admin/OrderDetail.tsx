import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios, { type AxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface OrderDetailItem {
  orderDetailId: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number | null;
  images: string[];
}

interface Order {
  orderId: number;
  userId: number;
  totalPrice: number | null;
  couponId: number | null;
  status: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  transactionId: string | null;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  note: string;
  orderDetails: OrderDetailItem[];
}

const safeToUpper = (value: unknown): string => {
  if (typeof value !== "string" || value == null) return "UNKNOWN";
  return value.toUpperCase();
};

const formatPrice = (value: number | null | undefined, locale: string = "vi-VN"): string => {
  if (value == null || isNaN(value)) return "0đ";
  return value.toLocaleString(locale) + "đ";
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["jwt_token"]);

  const API_URL = "http://localhost:8080/api";

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!cookies.jwt_token) {
          throw new Error("Vui lòng đăng nhập để xem chi tiết đơn hàng.");
        }

        setLoading(true);
        setError(null);

        const userResponse = await axios.get(`${API_URL}/auth/user`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${cookies.jwt_token}`,
          },
        });

        const userData = {
          email: userResponse.data.email,
          role: safeToUpper(userResponse.data.role),
        };

        if (userData.role !== "ADMIN") {
          throw new Error("Chỉ quản trị viên mới có thể xem chi tiết đơn hàng.");
        }

        const orderResponse = await axios.get(`${API_URL}/orders/${id}`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${cookies.jwt_token}`,
          },
        });

        const data = orderResponse.data;
        console.log("Order API response:", data); // Debug log

        if (!data.orderId || !Array.isArray(data.orderDetails)) {
          throw new Error("Dữ liệu đơn hàng không hợp lệ: orderId hoặc orderDetails không hợp lệ.");
        }

        // Ensure orderDetails is an array
        setOrder({
          ...data,
          orderDetails: data.orderDetails || [], // Fallback to empty array if undefined
        });

        toast.success(`Đã tải chi tiết đơn hàng #${id} thành công!`, {
          position: "top-right",
          autoClose: 3000,
        });
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        let errorMessage = "Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.";
        if (axiosError.response?.status === 401) {
          removeCookie("jwt_token", { path: "/" });
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
          navigate("/login");
        } else if (axiosError.response?.status === 403) {
          errorMessage = "Bạn không có quyền xem chi tiết đơn hàng này.";
          navigate("/admin/orders");
        } else if (axiosError.response?.status === 404) {
          errorMessage = "Không tìm thấy đơn hàng.";
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
        setError(errorMessage);
        toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, cookies.jwt_token, removeCookie]);

  const handleConfirmOrder = async () => {
    if (!order || !order.status) {
      toast.error("Không có dữ liệu đơn hàng để xác nhận.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      if (safeToUpper(order.status) !== "PENDING") {
        toast.error("Chỉ có thể xác nhận đơn hàng đang ở trạng thái 'Chờ xác nhận'", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const response = await axios.put(
        `${API_URL}/orders/${order.orderId}/confirm`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${cookies.jwt_token}`,
          },
        }
      );
      setOrder((prevOrder) => ({
        ...prevOrder,
        status: "CONFIRMED", // Cập nhật trạng thái ngay lập tức
        ...response.data,
        orderDetails: response.data.orderDetails || [],
      }));
      toast.success("Đơn hàng đã được xác nhận!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      let errorMessage = "Không thể xác nhận đơn hàng. Vui lòng thử lại.";
      if (axiosError.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        removeCookie("jwt_token", { path: "/" });
        navigate("/login");
      } else if (axiosError.response?.status === 403) {
        errorMessage = "Bạn không có quyền xác nhận đơn hàng.";
      } else if (axiosError.response?.status === 400) {
        errorMessage = axiosError.response.data?.message || "Yêu cầu không hợp lệ.";
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
    }
  };

  const handleDeliverOrder = async () => {
    if (!order || !order.status) {
      toast.error("Không có dữ liệu đơn hàng để bàn giao.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      if (safeToUpper(order.status) !== "CONFIRMED") {
        toast.error("Chỉ có thể bàn giao đơn hàng đang ở trạng thái 'Đã xác nhận'", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const response = await axios.put(
        `${API_URL}/orders/${order.orderId}/deliver`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${cookies.jwt_token}`,
          },
        }
      );
      setOrder((prevOrder) => ({
        ...prevOrder,
        status: "DELIVERED", // Cập nhật trạng thái ngay lập tức
        ...response.data,
        orderDetails: response.data.orderDetails || [],
      }));
      toast.success("Đơn hàng đã được bàn giao cho đơn vị vận chuyển!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      let errorMessage = "Không thể bàn giao đơn hàng. Vui lòng thử lại.";
      if (axiosError.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        removeCookie("jwt_token", { path: "/" });
        navigate("/login");
      } else if (axiosError.response?.status === 403) {
        errorMessage = "Bạn không có quyền cập nhật trạng thái đơn hàng.";
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
    }
  };

  const handleReceiveOrder = async () => {
    if (!order || !order.status) {
      toast.error("Không có dữ liệu đơn hàng để xác nhận đã giao.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      if (safeToUpper(order.status) !== "DELIVERED") {
        toast.error("Chỉ có thể xác nhận đơn hàng đang ở trạng thái 'Đang giao'", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const response = await axios.put(
        `${API_URL}/orders/${order.orderId}/receive`,
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${cookies.jwt_token}`,
          },
        }
      );
      setOrder((prevOrder) => ({
        ...prevOrder,
        status: "RECEIVED", // Cập nhật trạng thái ngay lập tức
        ...response.data,
        orderDetails: response.data.orderDetails || [],
      }));
      toast.success("Đơn hàng đã được xác nhận giao thành công!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      let errorMessage = "Không thể xác nhận đơn hàng đã giao. Vui lòng thử lại.";
      if (axiosError.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        removeCookie("jwt_token", { path: "/" });
        navigate("/login");
      } else if (axiosError.response?.status === 403) {
        errorMessage = "Bạn không có quyền cập nhật trạng thái đơn hàng.";
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/placeholder-product.jpg";
  };

  const formatOrderStatus = (status: string | null | undefined) => {
    if (!status) {
      return { text: "Không xác định", color: "bg-gray-100 text-gray-800 border border-gray-200" };
    }
    switch (safeToUpper(status)) {
      case "PENDING":
        return { text: "Chờ xác nhận", color: "bg-amber-100 text-amber-800 border border-amber-200" };
      case "CONFIRMED":
        return { text: "Đã xác nhận", color: "bg-green-100 text-green-800 border border-green-200" };
      case "DELIVERED":
        return { text: "Đang giao", color: "bg-blue-100 text-blue-800 border border-blue-200" };
      case "RECEIVED":
        return { text: "Đã giao", color: "bg-purple-100 text-purple-800 border border-purple-200" };
      case "COMPLETED":
        return { text: "Hoàn thành", color: "bg-emerald-100 text-emerald-800 border border-emerald-200" };
      case "CANCELLED":
        return { text: "Đã hủy", color: "bg-rose-100 text-rose-800 border border-rose-200" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-800 border border-gray-200" };
    }
  };

  const formatPaymentStatus = (status: string | null | undefined) => {
    if (!status) {
      return { text: "Không xác định", color: "bg-gray-100 text-gray-800 border border-gray-200" };
    }
    switch (safeToUpper(status)) {
      case "COMPLETED":
        return { text: "Đã thanh toán", color: "bg-emerald-100 text-emerald-800 border border-emerald-200" };
      case "PENDING":
        return { text: "Chưa thanh toán", color: "bg-amber-100 text-amber-800 border border-amber-200" };
      case "FAILED":
        return { text: "Thất bại", color: "bg-rose-100 text-rose-800 border border-rose-200" };
      case "REFUNDED":
        return { text: "Đã hoàn tiền", color: "bg-orange-100 text-orange-800 border border-orange-200" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-800 border border-gray-200" };
    }
  };

  const formatPaymentMethod = (method: string | null | undefined) => {
    if (!method) {
      return "Không xác định";
    }
    switch (safeToUpper(method)) {
      case "COD":
        return "Tiền mặt (COD)";
      case "VNPAY":
        return "Thanh toán VNPay";
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-gray-50 min-h-screen">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-rose-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-rose-500"
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
          </div>
          <p className="text-rose-600 text-lg mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 shadow-sm"
            >
              Thử lại
            </button>
            {error.includes("đăng nhập") && (
              <Link
                to="/login"
                className="px-6 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                Đăng nhập lại
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-gray-50 min-h-screen">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
          <p className="text-gray-500 mb-6">Đơn hàng không tồn tại hoặc đã bị xóa.</p>
          <Link
            to="/admin/orders"
            className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm inline-flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Chi tiết đơn hàng #{order.orderId}</h1>
            <p className="text-gray-500 mt-1 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Ngày tạo: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
            </p>
          </div>
          <div className="flex gap-4">
            {safeToUpper(order.status) === "PENDING" && (
              <button
                onClick={handleConfirmOrder}
                className="inline-flex items-center px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận đơn hàng
              </button>
            )}
            {safeToUpper(order.status) === "CONFIRMED" && (
              <button
                onClick={handleDeliverOrder}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                Bàn giao cho đơn vị vận chuyển
              </button>
            )}
            <button
              onClick={() => navigate("/admin/orders")}
              className="inline-flex items-center px-4 py-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Quay lại danh sách đơn hàng
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Thông tin khách hàng</h2>
            </div>
            <div className="space-y-4 text-sm text-gray-600 pl-2">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <div>
                  <span className="font-medium text-gray-700">Họ và tên:</span>
                  <span className="ml-2 text-gray-900">{order.fullName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{order.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div>
                  <span className="font-medium text-gray-700">Số điện thoại:</span>
                  <span className="ml-2 text-gray-900">{order.phone}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
                <div>
                  <span className="font-medium text-gray-700">Địa chỉ:</span>
                  <span className="ml-2 text-gray-900">{order.address}</span>
                </div>
              </div>
              {order.note && (
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-700">Ghi chú:</span>
                    <p className="mt-1 text-gray-900">{order.note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Thông tin đơn hàng</h2>
            </div>
            <div className="space-y-4 text-sm text-gray-600 pl-2">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <span className="font-medium text-gray-700">Trạng thái:</span>
                  <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs ${formatOrderStatus(order.status).color}`}>
                    {formatOrderStatus(order.status).text}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                <div>
                  <span className="font-medium text-gray-700">Phương thức thanh toán:</span>
                  <span className="ml-2 text-gray-900">{formatPaymentMethod(order.paymentMethod)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <span className="font-medium text-gray-700">Trạng thái thanh toán:</span>
                  <span
                    className={`ml-2 px-2.5 py-0.5 rounded-full text-xs ${formatPaymentStatus(order.paymentStatus).color}`}
                  >
                    {formatPaymentStatus(order.paymentStatus).text}
                  </span>
                </div>
              </div>
              {order.transactionId && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-700">Mã giao dịch:</span>
                    <span className="ml-2 text-gray-900">{order.transactionId}</span>
                  </div>
                </div>
              )}
              {order.couponId && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <div>
                    <span className="font-medium text-gray-700">Mã giảm giá:</span>
                    <span className="ml-2 text-gray-900">{order.couponId}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <span className="font-medium text-gray-700">Tổng tiền:</span>
                  <span className="ml-2 text-lg font-bold text-gray-900">{formatPrice(order.totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Sản phẩm trong đơn hàng</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!Array.isArray(order.orderDetails) || order.orderDetails.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">
                      Không có sản phẩm nào trong đơn hàng.
                    </td>
                  </tr>
                ) : (
                  order.orderDetails.map((item) => (
                    <tr key={item.orderDetailId} className="hover:bg-gray-50 transition-colors duration-100">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            <img
                              className="h-16 w-16 rounded-md object-cover border border-gray-200"
                              src={item.images.length > 0 ? item.images[0] : "/placeholder-product.jpg"}
                              alt={item.productName}
                              onError={handleImageError}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                            <div className="text-xs text-gray-500">ID: {item.productId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatPrice(item.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPrice(item.price != null ? item.price * item.quantity : null)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-700">
                    Tổng cộng:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                    {formatPrice(order.totalPrice)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}