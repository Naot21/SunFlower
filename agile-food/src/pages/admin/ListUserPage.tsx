import { useEffect, useState, useRef } from "react"
import axios from "axios"
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiUsers,
  FiUserCheck,
} from "react-icons/fi"

interface User {
  fullname: string // Đồng bộ với backend
  email: string
  phone: string
  role: string
  status: string
  createdAt: string
}

export default function ListUserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("nameAsc")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const itemsPerPage = 8
  const filtersRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close filters dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node) && showFilters) {
        setShowFilters(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showFilters])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const res = await axios.get("http://localhost:8080/api/admin/users/list-user", {
          withCredentials: true,
        })
        setUsers(res.data)
        setFilteredUsers(res.data)
        setError(null)
      } catch (err: any) {
        setError(err.response?.data || "Lỗi khi lấy dữ liệu người dùng")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Apply filters when any filter changes
  useEffect(() => {
    const applyFilters = () => {
      let result = users

      // Apply search filter
      if (searchQuery) {
        result = result.filter(
          (user) =>
            user.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phone?.includes(searchQuery),
        )
      }

      // Apply role filter
      if (roleFilter !== "all") {
        result = result.filter((user) => user.role.toLowerCase() === roleFilter.toLowerCase())
      }

      // Apply status filter
      if (statusFilter !== "all") {
        result = result.filter((user) => user.status.toLowerCase() === statusFilter.toLowerCase())
      }

      // Apply sorting
      result = [...result].sort((a, b) => {
        switch (sortBy) {
          case "nameAsc":
            return a.fullname.localeCompare(b.fullname)
          case "nameDesc":
            return b.fullname.localeCompare(a.fullname)
          case "emailAsc":
            return a.email.localeCompare(b.email)
          case "emailDesc":
            return b.email.localeCompare(a.email)
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          default:
            return 0
        }
      })

      setFilteredUsers(result)
      setCurrentPage(1)
    }

    applyFilters()
  }, [users, searchQuery, roleFilter, statusFilter, sortBy])

  const resetFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setStatusFilter("all")
    setSortBy("nameAsc")
    setCurrentPage(1)
  }

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Format role for display
  const formatRole = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return { text: "Quản trị viên", color: "bg-purple-100 text-purple-800" }
      case "user":
        return { text: "Người dùng", color: "bg-blue-100 text-blue-800" }
      default:
        return { text: role, color: "bg-gray-100 text-gray-800" }
    }
  }

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return { text: "Hoạt động", color: "bg-green-100 text-green-800" }
      case "inactive":
      case "pending":
        return { text: "Chờ duyệt", color: "bg-amber-100 text-amber-800" }
      case "blocked":
        return { text: "Đã khóa", color: "bg-red-100 text-red-800" }
      default:
        return { text: status, color: "bg-gray-100 text-gray-800" }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Đang tải dữ liệu người dùng...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh sách người dùng</h1>
            <p className="text-gray-500 mt-1">Quản lý và xem thông tin tất cả người dùng</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FiRefreshCw className="w-5 h-5" />
              Làm mới
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
            <div className="mr-3 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            <div>{error}</div>
          </div>
        )}

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
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
                  <h3 className="font-medium text-gray-900 mb-3">Lọc người dùng</h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Vai trò
                      </label>
                      <select
                        id="role"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                      >
                        <option value="all">Tất cả vai trò</option>
                        <option value="admin">Quản trị viên</option>
                        <option value="user">Người dùng</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái
                      </label>
                      <select
                        id="status"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Chờ duyệt</option>
                        <option value="blocked">Đã khóa</option>
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
                        <option value="nameAsc">Tên A-Z</option>
                        <option value="nameDesc">Tên Z-A</option>
                        <option value="emailAsc">Email A-Z</option>
                        <option value="emailDesc">Email Z-A</option>
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
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

        {/* Active filters */}
        {(roleFilter !== "all" || statusFilter !== "all" || sortBy !== "nameAsc" || searchQuery) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {roleFilter !== "all" && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Vai trò:</span>
                <span className="font-medium">{formatRole(roleFilter).text}</span>
                <button onClick={() => setRoleFilter("all")} className="ml-2 text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>
            )}
            {statusFilter !== "all" && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Trạng thái:</span>
                <span className="font-medium">{formatStatus(statusFilter).text}</span>
                <button onClick={() => setStatusFilter("all")} className="ml-2 text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>
            )}
            {sortBy !== "nameAsc" && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Sắp xếp:</span>
                <span className="font-medium">
                  {sortBy === "nameDesc"
                    ? "Tên Z-A"
                    : sortBy === "emailAsc"
                      ? "Email A-Z"
                      : sortBy === "emailDesc"
                        ? "Email Z-A"
                        : sortBy === "newest"
                          ? "Mới nhất"
                          : "Cũ nhất"}
                </span>
                <button onClick={() => setSortBy("nameAsc")} className="ml-2 text-gray-500 hover:text-gray-700">
                  &times;
                </button>
              </div>
            )}
            {searchQuery && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100">
                <span className="mr-1">Tìm kiếm:</span>
                <span className="font-medium">{searchQuery}</span>
                <button onClick={() => setSearchQuery("")} className="ml-2 text-gray-500 hover:text-gray-700">
                  &times;
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
          Hiển thị {filteredUsers.length} người dùng {searchQuery && `cho "${searchQuery}"`}
        </div>

        {/* Users table */}
        {currentItems.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <FiUsers className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg">Không tìm thấy người dùng nào</p>
            <p className="text-gray-500 mt-2">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
            {(roleFilter !== "all" || statusFilter !== "all" || sortBy !== "nameAsc" || searchQuery) && (
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Họ tên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số điện thoại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((user, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.role.toLowerCase() === "admin" ? (
                            <FiUserCheck className="h-5 w-5 text-gray-500" />
                          ) : (
                            <FiUser className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.fullname}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${formatRole(user.role).color}`}>
                        {formatRole(user.role).text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${formatStatus(user.status).color}`}>
                        {formatStatus(user.status).text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(user.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
              <span className="font-medium">{Math.min(indexOfLastItem, filteredUsers.length)}</span> trong{" "}
              <span className="font-medium">{filteredUsers.length}</span> người dùng
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
                // Show first page, last page, and pages around current page
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
                  )
                }

                // Show ellipsis
                if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) {
                  return (
                    <span key={page} className="w-10 h-10 flex items-center justify-center">
                      ...
                    </span>
                  )
                }

                return null
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
  )
}
