import { useState, useEffect, useRef} from "react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios, { type AxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiSearch, FiFilter, FiRefreshCw, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface Order {
  orderId?: number;
  userId: number;
  totalPrice: number;
  status: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

class OrderListErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error in OrderList:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function AdminOrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 8;
  const navigate = useNavigate();
  const [cookies, , removeCookie] = useCookies(["jwt_token"]);

  const API_URL = "http://localhost:8080/api";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!cookies.jwt_token) {
          throw new Error("Vui lòng đăng nhập.");
        }

        setLoading(true);
        setError(null);

        const userResponse = await axios.get(`${API_URL}/auth/user`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${cookies.jwt_token}` },
        });

        const userData = {
          email: userResponse.data.email,
          role: userResponse.data.role?.toUpperCase() || "CUSTOMER",
        };

        if (userData.role !== "ADMIN") {
          throw new Error("Chỉ quản trị viên mới có thể xem danh sách đơn hàng.");
        }

        const response = await axios.get(`${API_URL}/orders`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${cookies.jwt_token}` },
        });

        console.log("Fetched orders:", response.data);

        const validOrders = response.data.filter(
          (order: Order) => order.orderId != null && order.orderId !== undefined
        );
        setOrders(validOrders);
        setFilteredOrders(validOrders);
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>;
        let errorMessage = "Không thể tải danh sách đơn hàng.";
        if (axiosError.response?.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn.";
          removeCookie("jwt_token", { path: "/" });
          navigate("/login");
        } else if (axiosError.response?.status === 403) {
          errorMessage = "Bạn không có quyền xem danh sách đơn hàng.";
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
        setError(errorMessage);
        toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [cookies.jwt_token, navigate, removeCookie]);

  const formatOrderStatus = (status?: string | null) => {
    if (!status) {
      return { text: "Không xác định", color: "bg-gray-100 text-gray-800 border border-gray-200" };
    }
    switch (status.toUpperCase()) {
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

  const formatPaymentStatus = (status?: string | null) => {
    if (!status) {
      return { text: "Không xác định", color: "bg-gray-100 text-gray-800 border border-gray-200" };
    }
    switch (status.toUpperCase()) {
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

  const formatPaymentMethod = (method?: string | null) => {
    if (!method) {
      return "Không xác định";
    }
    switch (method.toUpperCase()) {
      case "COD":
        return "Tiền mặt (COD)";
      case "VNPAY":
        return "Thanh toán VNPay";
      default:
        return method;
    }
  };

  const filteredOrdersList = filteredOrders.filter((order) => {
    const matchesSearch =
      (order.orderId != null ? order.orderId.toString().includes(searchQuery) : false) ||
      (order.fullName ? order.fullName.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (order.email ? order.email.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (order.phone ? order.phone.includes(searchQuery) : false);
    const matchesStatus =
      statusFilter === "all" || order.status?.toUpperCase() === statusFilter.toUpperCase();
    const matchesPaymentStatus =
      paymentStatusFilter === "all" ||
      order.paymentStatus?.toUpperCase() === paymentStatusFilter.toUpperCase();
    const matchesPaymentMethod =
      paymentMethodFilter === "all" ||
      order.paymentMethod?.toUpperCase() === paymentMethodFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod;
  });

  const totalPages = Math.ceil(filteredOrdersList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrdersList.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentStatusFilter("all");
    setPaymentMethodFilter("all");
    setCurrentPage(1);
  };

  const errorFallback = (
    <div className="container mx-auto px-4 py-8 text-center bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-rose-100">
          <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-rose-600 text-lg mb-6">Đã xảy ra lỗi khi tải danh sách đơn hàng.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Thử lại
        </button>
      </div>
    </div>
  );

  return (
    <OrderListErrorBoundary fallback={errorFallback}>
      <div className="bg-gray-50 min-h-screen py-8">
        <ToastContainer position="top-right" autoClose={3000} />
        {loading ? (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-8 text-center bg-gray-50 min-h-screen">
            <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-rose-100">
                <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-rose-600 text-lg mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h1>
                  <p className="text-gray-500 mt-1">Xem và quản lý tất cả các đơn hàng</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900"
                    placeholder="Tìm kiếm đơn hàng..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <FiFilter className="h-5 w-5" />
                    <span>Bộ lọc</span>
                  </button>

                  {showFilters && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-10 border">
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-3">Lọc đơn hàng</h3>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                              Trạng thái đơn hàng
                            </label>
                            <select
                              id="status"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900"
                              value={statusFilter}
                              onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                              }}
                            >
                              <option value="all">Tất cả</option>
                              <option value="PENDING">Chờ xác nhận</option>
                              <option value="CONFIRMED">Đã xác nhận</option>
                              <option value="DELIVERED">Đang giao</option>
                              <option value="RECEIVED">Đã giao</option>
                              <option value="COMPLETED">Hoàn thành</option>
                              <option value="CANCELLED">Đã hủy</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                              Trạng thái thanh toán
                            </label>
                            <select
                              id="paymentStatus"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900"
                              value={paymentStatusFilter}
                              onChange={(e) => {
                                setPaymentStatusFilter(e.target.value);
                                setCurrentPage(1);
                              }}
                            >
                              <option value="all">Tất cả</option>
                              <option value="COMPLETED">Đã thanh toán</option>
                              <option value="PENDING">Chưa thanh toán</option>
                              <option value="FAILED">Thất bại</option>
                              <option value="REFUNDED">Đã hoàn tiền</option>
                            </select>
                          </div>

                          <div>
                            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                              Phương thức thanh toán
                            </label>
                            <select
                              id="paymentMethod"
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900"
                              value={paymentMethodFilter}
                              onChange={(e) => {
                                setPaymentMethodFilter(e.target.value);
                                setCurrentPage(1);
                              }}
                            >
                              <option value="all">Tất cả</option>
                              <option value="COD">Tiền mặt (COD)</option>
                              <option value="VNPAY">Thanh toán VNPay</option>
                            </select>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button
                              onClick={resetFilters}
                              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1"
                            >
                              <FiRefreshCw className="h-4 w-4" />
                              Đặt lại bộ lọc
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thanh toán</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phương thức</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((order) => (
                      <tr key={order.orderId ?? `order-${Math.random()}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderId ?? "N/A"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{order.fullName || "N/A"}</div>
                          <div className="text-gray-500">{order.email || "N/A"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${formatOrderStatus(order.status).color}`}>
                            {formatOrderStatus(order.status).text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${formatPaymentStatus(order.paymentStatus).color}`}>
                            {formatPaymentStatus(order.paymentStatus).text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPaymentMethod(order.paymentMethod)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.orderId != null && (
                            <Link
                              to={`/admin/orders/${order.orderId}`}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-700">
                    Hiển thị {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredOrdersList.length)} của {filteredOrdersList.length} đơn hàng
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border rounded-lg disabled:opacity-50"
                    >
                      <FiChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => paginate(page)}
                        className={`px-3 py-2 border rounded-lg ${currentPage === page ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border rounded-lg disabled:opacity-50"
                    >
                      <FiChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </OrderListErrorBoundary>
  );
}
