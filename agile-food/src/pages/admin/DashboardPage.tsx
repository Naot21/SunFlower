import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios, { type AxiosError } from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FiPackage,
  FiDollarSign,
  FiShoppingBag,
  FiEye,
  FiPlus,
  FiHome,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiDownload,
} from "react-icons/fi";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels"; // For data labels
import Papa from "papaparse"; // For CSV export

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, ChartDataLabels);

interface Order {
  orderId: number;
  userId: number;
  totalPrice: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  images: string[];
  revenue: number;
}

interface ProductRevenue {
  productId: number;
  productName: string;
  revenue: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
}

interface Stats {
  name: string;
  value: string;
  icon: JSX.Element;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [productRevenue, setProductRevenue] = useState<ProductRevenue[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [cookies, , removeCookie] = useCookies(["jwt_token"]);
  const navigate = useNavigate();
  const filtersRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node) && showFilters) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!cookies.jwt_token) {
          throw new Error("Vui lòng đăng nhập để xem dashboard.");
        }

        setLoading(true);

        const userResponse = await axios.get(`${API_URL}/auth/user`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${cookies.jwt_token}` },
        });

        if (userResponse.data.role.toUpperCase() !== "ADMIN") {
          throw new Error("Chỉ quản trị viên mới có thể xem dashboard.");
        }

        const [ordersResponse, productsResponse, revenueByProductResponse, topProductsResponse, monthlyRevenueResponse] = await Promise.all([
          axios.get(`${API_URL}/dashboard/orders`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          }),
          axios.get(`${API_URL}/dashboard/products`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          }),
          axios.get(`${API_URL}/dashboard/revenue-by-product`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          }),
          axios.get(`${API_URL}/dashboard/top-products`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          }),
          axios.get(`${API_URL}/dashboard/revenue-by-month`, {
            params: { year: selectedYear !== "all" ? selectedYear : undefined },
            withCredentials: true,
            headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          }),
        ]);

        const orders: Order[] = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
        const products: Product[] = Array.isArray(productsResponse.data) ? productsResponse.data : [];
        const productRevenueData: ProductRevenue[] = revenueByProductResponse.data || [];
        const topProductsData: Product[] = topProductsResponse.data || [];
        const monthlyRevenueData: MonthlyRevenue[] = monthlyRevenueResponse.data || [];

        const totalRevenue = orders
          .filter((order) => ["RECEIVED", "COMPLETED"].includes(order.status.toUpperCase()))
          .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        const totalOrders = orders.length;
        const totalProducts = products.length;

        setStats([
          {
            name: "Tổng đơn hàng",
            value: totalOrders.toString(),
            icon: <FiPackage className="w-6 h-6" />,
          },
          {
            name: "Tổng doanh thu",
            value: `${totalRevenue.toLocaleString("vi-VN")} VNĐ`,
            icon: <FiDollarSign className="w-6 h-6" />,
          },
          {
            name: "Số sản phẩm",
            value: totalProducts.toString(),
            icon: <FiShoppingBag className="w-6 h-6" />,
          },
        ]);

        setRecentOrders(orders);
        setFilteredOrders(orders);
        setProductRevenue(productRevenueData);
        setTopProducts(topProductsData);
        setMonthlyRevenue(monthlyRevenueData);

        toast.success("Tải dữ liệu dashboard thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
      } catch (error: any) {
        const axiosError = error as AxiosError<{ error?: string }>;
        let errorMessage = "Lỗi khi tải dữ liệu dashboard.";
        if (axiosError.response?.status === 401) {
          removeCookie("jwt_token", { path: "/" });
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
          navigate("/login");
        } else if (axiosError.response?.status === 403) {
          errorMessage = "Bạn không có quyền xem dashboard.";
          navigate("/");
        } else {
          errorMessage = axiosError.response?.data?.error || axiosError.message || errorMessage;
        }
        toast.error(`Lỗi: ${errorMessage}`, {
          position: "top-right",
          autoClose: 3000,
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [cookies.jwt_token, navigate, removeCookie, API_URL, selectedYear]);

  useEffect(() => {
    const applyFilters = () => {
      let result = recentOrders;

      if (searchQuery) {
        result = result.filter(
          (order) =>
            order.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.orderId.toString().includes(searchQuery)
        );
      }

      if (statusFilter !== "all") {
        result = result.filter((order) => order.status.toLowerCase() === statusFilter.toLowerCase());
      }

      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setFilteredOrders(result.slice(0, 5));
    };

    applyFilters();
  }, [recentOrders, searchQuery, statusFilter]);

  const formatOrderStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return { text: "Chờ xác nhận", color: "bg-amber-100 text-amber-800 border border-amber-200" };
      case "confirmed":
        return { text: "Đã xác nhận", color: "bg-green-100 text-green-800 border border-green-200" };
      case "delivered":
        return { text: "Đang giao", color: "bg-blue-100 text-blue-800 border border-blue-200" };
      case "received":
        return { text: "Đã giao", color: "bg-purple-100 text-purple-800 border border-purple-200" };
      case "completed":
        return { text: "Hoàn thành", color: "bg-emerald-100 text-emerald-800 border border-emerald-200" };
      case "cancelled":
        return { text: "Đã hủy", color: "bg-rose-100 text-rose-800 border border-rose-200" };
      default:
        return { text: status, color: "bg-gray-100 text-gray-800 border border-gray-200" };
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const exportToCSV = () => {
    const csvData = monthlyRevenue.map((item) => ({
      Month: item.month,
      Revenue: `${(item.revenue / 1000000).toFixed(1)} triệu VNĐ`,
      OrderCount: item.orderCount,
      AverageOrderValue: `${(item.averageOrderValue / 1000000).toFixed(1)} triệu VNĐ`,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `monthly_revenue_${selectedYear !== "all" ? selectedYear : "all"}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const productRevenueChartData = {
    labels: productRevenue.map((prod) => prod.productName),
    datasets: [
      {
        label: "Doanh thu",
        data: productRevenue.map((prod) => (prod.revenue / 1000000).toFixed(1)),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"],
        hoverOffset: 4,
      },
    ],
  };

  const topProductsChartData = {
    labels: topProducts.map((product) => product.name),
    datasets: [
      {
        label: "Doanh thu",
        data: topProducts.map((product) => (product.revenue / 1000000).toFixed(1)),
        backgroundColor: "#36A2EB",
        borderColor: "#36A2 WEF",
        borderWidth: 1,
      },
    ],
  };

  const monthlyRevenueChartData = {
    labels: monthlyRevenue.map((item) => item.month),
    datasets: [
      {
        label: "Doanh thu",
        data: monthlyRevenue.map((item) => (item.revenue / 1000000).toFixed(1)),
        backgroundColor: "#FF6384",
        borderColor: "#FF6384",
        borderWidth: 1,
      },
      {
        label: "Số đơn hàng",
        data: monthlyRevenue.map((item) => item.orderCount),
        backgroundColor: "#36A2EB",
        borderColor: "#36A2EB",
        borderWidth: 1,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-gray-50 min-h-screen">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-rose-500 mx-auto mb-4"
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
          <p className="text-rose-600 text-lg mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Thử lại
            </button>
            {error.includes("đăng nhập") && (
              <Link
                to="/login"
                className="px-6 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Đăng nhập lại
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Xin chào, Admin! Tổng quan hoạt động cửa hàng.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FiRefreshCw className="w-5 h-5" />
              Làm mới
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <FiHome className="w-5 h-5" />
              Trang chủ
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.length > 0 ? (
            stats.map((stat) => (
              <div
                key={stat.name}
                className="bg-white shadow-sm rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-600">{stat.icon}</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd>
                        <div className="text-xl font-semibold text-gray-900">{stat.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600 text-lg">Không có dữ liệu thống kê để hiển thị.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="Tìm kiếm theo tên, email hoặc mã đơn hàng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="relative" ref={filtersRef}>
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FiFilter className="h-5 w-5" />
                        <span>Bộ lọc</span>
                      </button>
                      {showFilters && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 mb-3">Lọc đơn hàng</h3>
                            <div className="space-y-4">
                              <div>
                                <label
                                  htmlFor="status"
                                  className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                  Trạng thái đơn hàng
                                </label>
                                <select
                                  id="status"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                  value={statusFilter}
                                  onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                  <option value="all">Tất cả trạng thái</option>
                                  <option value="pending">Chờ xác nhận</option>
                                  <option value="confirmed">Đã xác nhận</option>
                                  <option value="delivered">Đang giao</option>
                                  <option value="received">Đã giao</option>
                                  <option value="completed">Hoàn thành</option>
                                  <option value="cancelled">Đã hủy</option>
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
                    <Link
                      to="/admin/orders"
                      className="text-sm font-medium text-gray-900 hover:underline flex items-center gap-1"
                    >
                      Xem tất cả
                      <FiEye className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mã đơn hàng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Khách hàng
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày đặt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số tiền
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredOrders.length > 0 ? (
                        filteredOrders.map((order) => (
                          <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.orderId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{order.fullName}</div>
                              <div className="text-xs text-gray-500">{order.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.createdAt
                                ? new Date(order.createdAt).toLocaleDateString("vi-VN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.totalPrice
                                ? `${order.totalPrice.toLocaleString("vi-VN")} VNĐ`
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${formatOrderStatus(order.status).color}`}
                              >
                                {formatOrderStatus(order.status).text}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50"
                          >
                            Không có đơn hàng phù hợp với bộ lọc.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 mt-6">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Doanh thu theo năm</h2>
                  <div className="flex items-center gap-3">
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                    >
                      <option value="all">Tất cả năm</option>
                      {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                    
                  </div>
                </div>
                {monthlyRevenue.length > 0 ? (
                  <div className="flex justify-center">
                    <div style={{ maxWidth: "600px", width: "100%" }}>
                      <Bar
                        data={monthlyRevenueChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "top",
                            },
                            title: {
                              display: true,
                              text: "Doanh thu và số đơn hàng theo tháng",
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const datasetLabel = context.dataset.label || "";
                                  const value = context.parsed.y;
                                  if (datasetLabel === "Doanh thu") {
                                    return `${datasetLabel}: ${value} triệu VNĐ`;
                                  } else {
                                    return `${datasetLabel}: ${value} đơn`;
                                  }
                                },
                                afterLabel: (context) => {
                                  const index = context.dataIndex;
                                  const avgOrderValue = (monthlyRevenue[index].averageOrderValue / 1000000).toFixed(1);
                                  return `Giá trị trung bình đơn hàng: ${avgOrderValue} triệu VNĐ`;
                                },
                              },
                            },
                            datalabels: {
                              display: true,
                              color: "#000",
                              anchor: "end",
                              align: "top",
                              formatter: (value, context) => {
                                return context.dataset.label === "Doanh thu" ? `${value}M` : value;
                              },
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: "Giá trị",
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: "Tháng",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-600 text-lg">Không có dữ liệu doanh thu theo tháng. Vui lòng kiểm tra trạng thái đơn hàng.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200 mt-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Doanh thu theo sản phẩm</h2>
                </div>
                {productRevenue.length > 0 ? (
                  <div className="flex justify-center">
                    <div style={{ maxWidth: "400px" }}>
                      <Pie
                        data={productRevenueChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "top",
                            },
                            title: {
                              display: true,
                              text: "Doanh thu theo sản phẩm (triệu VNĐ)",
                            },
                            datalabels: {
                              display: true,
                              color: "#000",
                              formatter: (value) => `${value}M`,
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-600 text-lg">Không có dữ liệu doanh thu theo sản phẩm. Vui lòng kiểm tra trạng thái đơn hàng.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Top 5 sản phẩm bán chạy</h2>
                  <Link
                    to="/admin/san-pham"
                    className="text-sm font-medium text-gray-900 hover:underline flex items-center gap-1"
                  >
                    Xem tất cả
                    <FiEye className="w-4 h-4" />
                  </Link>
                </div>
                {topProducts.length > 0 ? (
                  <div className="flex justify-center">
                    <div style={{ maxWidth: "400px" }}>
                      <Bar
                        data={topProductsChartData}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: {
                              position: "top",
                            },
                            title: {
                              display: true,
                              text: "Top sản phẩm bán chạy (triệu VNĐ)",
                            },
                            datalabels: {
                              display: true,
                              color: "#000",
                              anchor: "end",
                              align: "top",
                              formatter: (value) => `${value}M`,
                            },
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: "Doanh thu (triệu VNĐ)",
                              },
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-600">Không có sản phẩm bán chạy để hiển thị. Vui lòng kiểm tra trạng thái đơn hàng.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden mt-6 border border-gray-200">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
                <div className="space-y-2">
                  <Link
                    to="/admin/add-products"
                    className="flex items-center p-3 text-base font-medium text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                    <FiPlus className="w-5 h-5 mr-3 text-gray-500" />
                    Thêm sản phẩm mới
                  </Link>
                  <Link
                    to="/admin/orders"
                    className="flex items-center p-3 text-base font-medium text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                    <FiPackage className="w-5 h-5 mr-3 text-gray-500" />
                    Quản lý đơn hàng
                  </Link>
                  <Link
                    to="/admin/thong-ke"
                    className="flex items-center p-3 text-base font-medium text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                    <FiDollarSign className="w-5 h-5 mr-3 text-gray-500" />
                    Xem báo cáo doanh thu
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}