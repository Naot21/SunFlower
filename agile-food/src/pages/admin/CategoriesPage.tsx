import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify"; // Import toast
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
  FiImage,
} from "react-icons/fi";

interface Category {
  categoryId: string;
  name: string;
  img?: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>("nameAsc");
  const itemsPerPage = 8;
  const filtersRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close filters dropdown
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

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8080/api/categories/all", {
          headers: {
            Accept: "application/json; charset=UTF-8",
          },
          withCredentials: true,
        });
        setCategories(response?.data || []);
      } catch (error: any) {
        toast.error(error.response?.data || "Lỗi khi lấy danh mục", {
          position: "top-right",
          autoClose: 3000,
        });
        console.error("Lỗi khi lấy danh mục:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Check if category has products
  const checkCategoryHasProducts = async (categoryId: string): Promise<boolean> => {
    try {
      const response = await axios.get(`http://localhost:8080/api/products?categoryId=${categoryId}`, {
        withCredentials: true,
      });
      return response.data.length > 0;
    } catch (error: any) {
      toast.error("Lỗi khi kiểm tra sản phẩm trong danh mục", {
        position: "top-right",
        autoClose: 3000,
      });
      console.error("Lỗi khi kiểm tra sản phẩm trong danh mục:", error);
      return false;
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (id: string) => {
    try {
      const hasProducts = await checkCategoryHasProducts(id);
      if (hasProducts) {
        toast.error("Không thể xóa danh mục vì vẫn còn sản phẩm thuộc danh mục này", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Replace window.confirm with a toast-based confirmation if needed, but for simplicity, keep it as confirm
      if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
        setIsDeleting(id);
        await axios.delete(`http://localhost:8080/api/admin/categories/delete/${id}`, {
          withCredentials: true,
        });
        setCategories(categories.filter((category) => category.categoryId !== id));
        toast.success("Xóa danh mục thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data || "Lỗi khi xóa danh mục", {
        position: "top-right",
        autoClose: 3000,
      });
      console.error("Lỗi khi xóa danh mục:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  // Filter and sort categories
  const filteredCategories = categories
    .filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "idAsc":
          return a.categoryId.localeCompare(b.categoryId);
        case "idDesc":
          return b.categoryId.localeCompare(a.categoryId);
        default:
          return 0;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSortBy("nameAsc");
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Đang tải danh mục...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        {/* Header with title and add button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý danh mục</h1>
            <p className="text-gray-500 mt-1">Quản lý tất cả danh mục sản phẩm</p>
          </div>
          <Link
            to="/admin/add-categories"
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 self-start"
          >
            <FiPlus className="w-5 h-5" />
            Thêm danh mục
          </Link>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Tìm kiếm danh mục..."
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
              <span>Sắp xếp</span>
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Sắp xếp danh mục</h3>

                  <div className="space-y-2">
                    <button
                      onClick={() => setSortBy("nameAsc")}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        sortBy === "nameAsc" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                      }`}
                    >
                      Tên A-Z
                    </button>
                    <button
                      onClick={() => setSortBy("nameDesc")}
                      className={`w-full text-left px-3 py-2 rounded-md ${
                        sortBy === "nameDesc" ? "bg-gray-100 font-medium" : "hover:bg-gray-50"
                      }`}
                    >
                      Tên Z-A
                    </button>
                  </div>

                  <div className="flex justify-end pt-3 mt-2 border-t border-gray-100">
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 flex items-center gap-1"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      Đặt lại
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active filters */}
        {(sortBy !== "nameAsc" || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {sortBy !== "nameAsc" && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Sắp xếp:</span>
                <span className="font-medium">
                  {sortBy === "nameDesc"
                    ? "Tên Z-A"
                    : sortBy === "idAsc"
                    ? "ID tăng dần"
                    : sortBy === "idDesc"
                    ? "ID giảm dần"
                    : "Tên A-Z"}
                </span>
                <button onClick={() => setSortBy("nameAsc")} className="ml-2 text-gray-500 hover:text-gray-700">
                  ×
                </button>
              </div>
            )}
            {searchQuery && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Tìm kiếm:</span>
                <span className="font-medium">{searchQuery}</span>
                <button onClick={() => setSearchQuery("")} className="ml-2 text-gray-500 hover:text-gray-700">
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

        {/* Results count */}
        <div className="text-sm text-gray-500 mb-4">
          Hiển thị {filteredCategories.length} danh mục {searchQuery && `cho "${searchQuery}"`}
        </div>

        {/* Categories Table */}
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-gray-600 text-lg">Không tìm thấy danh mục nào</p>
            <p className="text-gray-500 mt-2">Thử thay đổi bộ lọc hoặc thêm danh mục mới</p>
            {searchQuery && (
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Danh mục
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Hình ảnh
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((category) => (
                  <tr key={category.categoryId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      <div className="text-xs text-gray-500">ID: {category.categoryId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.img ? (
                        <img
                          src={category.img || "/placeholder.svg"}
                          alt={category.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FiImage className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/admin/danh-muc/xem/${category.categoryId}`}
                          className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md"
                          title="Xem chi tiết"
                        >
                          <FiEye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/admin/danh-muc/sua/${category.categoryId}`}
                          className="p-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md"
                          title="Chỉnh sửa"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCategory(category.categoryId)}
                          disabled={isDeleting === category.categoryId}
                          className={`p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md ${
                            isDeleting === category.categoryId ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title="Xóa"
                        >
                          {isDeleting === category.categoryId ? (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{" "}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredCategories.length)}</span> trong{" "}
              <span className="font-medium">{filteredCategories.length}</span> danh mục
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