import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios, { type AxiosError } from "axios";
import { toast } from "react-toastify";
import {
  FiSearch,
  FiFilter,
  FiPlus,
  FiEye,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

interface Product {
  id: number;
  name: string;
  price: number;
  categoryId: number;
  inStock: boolean;
  quantity: number;
  images: string[];
  createdAt: string;
}

interface Category {
  categoryId: number;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const itemsPerPage = 8;
  const filtersRef = useRef<HTMLDivElement>(null);
  const [cookies, , removeCookie] = useCookies(["jwt_token"]);
  const navigate = useNavigate();

  const API_URL = "http://localhost:8080/api/admin";
  const API_URL2 = "http://localhost:8080/api";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node) && showFilters) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL2}/categories/all`, {
          withCredentials: true,
        });
        setCategories(response.data);
      } catch (err) {
        toast.error("Không thể tải danh sách danh mục", { position: "top-right", autoClose: 3000 });
        console.error("Lỗi khi tải danh mục:", err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL2}/products`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${cookies.jwt_token}`,
          },
        });
        setProducts(
          response.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            categoryId: item.categoryId,
            inStock: item.inStock,
            quantity: item.quantity,
            images: item.images,
            createdAt: item.createdAt,
          }))
        );
      } catch (err: any) {
        const axiosError = err as AxiosError<{ message?: string }>;
        let errorMessage = "Không thể tải dữ liệu sản phẩm từ server";
        if (axiosError.response?.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
          removeCookie("jwt_token", { path: "/" });
          navigate("/login");
        } else if (axiosError.response?.status === 403) {
          errorMessage = "Bạn không có quyền truy cập danh sách sản phẩm.";
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
        toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [cookies.jwt_token, navigate, removeCookie]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/placeholder-product.jpg";
  };

  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.categoryId === categoryId);
    return category ? category.name : "Chưa phân loại";
  };

  // Kiểm tra xem sản phẩm có trong đơn hàng nào không
  const checkProductInOrders = async (productId: number): Promise<boolean> => {
    try {
      if (!Number.isInteger(productId) || productId <= 0) {
        throw new Error("ID sản phẩm không hợp lệ");
      }
      const response = await axios.get(`${API_URL2}/orders/details?productId=${productId}`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${cookies.jwt_token}`,
        },
      });
      return response.data.length > 0;
    } catch (error: any) {
      const axiosError = error as AxiosError<{ error?: string }>;
      let errorMessage = "Lỗi khi kiểm tra sản phẩm trong đơn hàng";
      if (axiosError.response?.status === 400) {
        errorMessage = axiosError.response.data?.error || "ID sản phẩm không hợp lệ";
      } else if (axiosError.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        removeCookie("jwt_token", { path: "/" });
        navigate("/login");
      } else if (axiosError.response?.status === 403) {
        errorMessage = "Bạn không có quyền kiểm tra đơn hàng.";
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      console.error("Lỗi khi kiểm tra sản phẩm trong đơn hàng:", error);
      return false;
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      setIsDeleting(id); // Show spinner

      // Hiển thị thông báo đầu tiên - TRƯỚC KHI làm bất cứ việc gì khác
      toast.info("Đang xử lý yêu cầu xóa sản phẩm...", {
        position: "top-right",
        autoClose: 1500,
        // Thêm hideProgressBar: false để hiển thị thanh tiến trình
        hideProgressBar: false,
        // Đảm bảo thông báo này xuất hiện ngay lập tức
        delay: 0
      });

      // Đợi một chút để đảm bảo thông báo xuất hiện trước
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if product is in any orders
      const isInOrders = await checkProductInOrders(id);
      if (isInOrders) {
        toast.error("Không thể xóa sản phẩm vì sản phẩm đang có trong đơn hàng", {
          position: "top-right",
          autoClose: 3000,
        });
        setIsDeleting(null);
        return;
      }

      // If not in orders, show confirmation
      const confirmation = window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?");
      if (confirmation) {
        // Hiển thị thông báo đang xóa
        toast.info("Đang xóa sản phẩm...", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
        });

        await axios.delete(`${API_URL}/products/delete/${id}`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${cookies.jwt_token}`,
          },
        });

        setProducts((prev) => prev.filter((product) => product.id !== id));
        toast.success("Xóa sản phẩm thành công!", {
          position: "top-right",
          autoClose: 3000
        });
      } else {
        toast.info("Đã hủy xóa sản phẩm", {
          position: "top-right",
          autoClose: 2000
        });
      }
    } catch (err: any) {
      const axiosError = err as AxiosError<{ message?: string }>;
      let errorMessage = "Không thể xóa sản phẩm";
      if (axiosError.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        removeCookie("jwt_token", { path: "/" });
        navigate("/login");
      } else if (axiosError.response?.status === 403) {
        errorMessage = "Bạn không có quyền xóa sản phẩm.";
      } else if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
      console.error(err);
    } finally {
      setIsDeleting(null); // Reset spinner
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.categoryId.toString() === categoryFilter;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "inStock" && product.inStock) ||
      (stockFilter === "outOfStock" && !product.inStock);

    return matchesSearch && matchesCategory && matchesStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "priceAsc":
        return a.price - b.price;
      case "priceDesc":
        return b.price - a.price;
      case "nameAsc":
        return a.name.localeCompare(b.name);
      case "nameDesc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const resetFilters = () => {
    setSearchQuery("");
    setCategoryFilter("all");
    setStockFilter("all");
    setSortBy("newest");
    setCurrentPage(1);
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Đang tải dữ liệu sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
            <p className="text-gray-500 mt-1">Quản lý và cập nhật thông tin sản phẩm</p>
          </div>
          <Link
            to="/admin/add-products"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 self-start"
          >
            <FiPlus className="w-5 h-5" />
            Thêm sản phẩm
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
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
                  <h3 className="font-medium text-gray-900 mb-3">Lọc sản phẩm</h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                        Danh mục
                      </label>
                      <select
                        id="category"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        value={categoryFilter}
                        onChange={(e) => {
                          setCategoryFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="all">Tất cả danh mục</option>
                        {categories.map((category) => (
                          <option key={category.categoryId} value={category.categoryId}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái
                      </label>
                      <select
                        id="stock"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        value={stockFilter}
                        onChange={(e) => {
                          setStockFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                      >
                        <option value="all">Tất cả</option>
                        <option value="inStock">Còn hàng</option>
                        <option value="outOfStock">Hết hàng</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                        Sắp xếp theo
                      </label>
                      <select
                        id="sortBy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="priceAsc">Giá tăng dần</option>
                        <option value="priceDesc">Giá giảm dần</option>
                        <option value="nameAsc">Tên A-Z</option>
                        <option value="nameDesc">Tên Z-A</option>
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

        {(categoryFilter !== "all" || stockFilter !== "all" || sortBy !== "newest") && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categoryFilter !== "all" && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Danh mục:</span>
                <span className="font-medium">{getCategoryName(Number.parseInt(categoryFilter))}</span>
                <button onClick={() => setCategoryFilter("all")} className="ml-2 text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
            )}
            {stockFilter !== "all" && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Trạng thái:</span>
                <span className="font-medium">{stockFilter === "inStock" ? "Còn hàng" : "Hết hàng"}</span>
                <button onClick={() => setStockFilter("all")} className="ml-2 text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
            )}
            {sortBy !== "newest" && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Sắp xếp:</span>
                <span className="font-medium">
                  {sortBy === "oldest"
                    ? "Cũ nhất"
                    : sortBy === "priceAsc"
                    ? "Giá tăng dần"
                    : sortBy === "priceDesc"
                    ? "Giá giảm dần"
                    : sortBy === "nameAsc"
                    ? "Tên A-Z"
                    : "Tên Z-A"}
                </span>
                <button onClick={() => setSortBy("newest")} className="ml-2 text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
            )}
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-900 text-white hover:bg-gray-800"
            >
              <FiRefreshCw className="mr-1 h-3 w-3" />
              Đặt lại tất cả
            </button>
          </div>
        )}

        <div className="text-sm text-gray-500 mb-4">
          Hiển thị {sortedProducts.length} sản phẩm {searchQuery && `cho "${searchQuery}"`}
        </div>

        {currentItems.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm nào</h3>
            <p className="text-gray-500 mb-4">Thử thay đổi bộ lọc hoặc thêm sản phẩm mới</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
              <Link
                to="/admin/add-products"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Thêm sản phẩm
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-lg overflow-hidden border border-gray-200">
                          <img
                            className="h-full w-full object-cover"
                            src={product.images[0] || "/placeholder-product.jpg"}
                            alt={product.name}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</div>
                          <div className="text-xs text-gray-500">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {getCategoryName(product.categoryId)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {product.price.toLocaleString("vi-VN")}đ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          product.quantity === 0
                            ? "bg-red-100 text-red-800"
                            : product.inStock
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {product.quantity === 0 ? "Hết hàng" : product.inStock ? "Còn hàng" : "Hết hàng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {new Date(product.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(product.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md"
                          title="Xem chi tiết"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/san-pham/sua/${product.id}`}
                          className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md"
                          title="Chỉnh sửa"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          disabled={isDeleting === product.id}
                          className={`p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md ${
                            isDeleting === product.id ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title="Xóa"
                        >
                          {isDeleting === product.id ? (
                            <div className="w-4 h-4 border-t-2 border-r-2 border-red-600 rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{" "}
              <span className="font-medium">{Math.min(indexOfLastItem, sortedProducts.length)}</span> trong{" "}
              <span className="font-medium">{sortedProducts.length}</span> sản phẩm
            </div>
            <div className="flex justify-center space-x-1">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-md ${
                  currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                  return (
                    <button
                      key={page}
                      onClick={() => paginate(page)}
                      className={`w-10 h-10 rounded-md ${
                        currentPage === page ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                }
                if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) {
                  return (
                    <span key={page} className="w-10 h-10 flex items-center justify-center">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-md ${
                  currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}