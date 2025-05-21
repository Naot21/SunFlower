import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useCookies } from "react-cookie"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import { motion, AnimatePresence } from "framer-motion"

interface Address {
  addressId: number
  address: string
  city: string
  postalCode: string 
  createdAt: string
}

export default function Address() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState<number | null>(null)
  const itemsPerPage = 5
  const navigate = useNavigate()
  const [cookies] = useCookies(["jwt_token"])

  useEffect(() => {
    const fetchAddresses = async () => {
      setLoading(true)
      setError(null)

      try {
        const token = cookies.jwt_token
        if (!token) {
          setError("Vui lòng đăng nhập để xem địa chỉ")
          navigate("/login")
          return
        }

        const res = await axios.get("http://localhost:8080/api/address", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json; charset=UTF-8",
          },
          withCredentials: true,
        })

        const formattedAddresses = res.data.map((addr: any) => ({
          addressId: addr.addressId,
          address: addr.address,
          city: addr.city,
          postalCode: addr.postalCode || "", 
          createdAt: addr.createdAt,
        }))

        setAddresses(formattedAddresses)
      } catch (err: any) {
        let errorMessage = "Lỗi khi lấy danh sách địa chỉ"
        if (axios.isAxiosError(err) && err.response) {
          const errorData = err.response.data
          errorMessage =
              typeof errorData === "string" ? errorData : errorData?.error || errorData?.message || "Lỗi từ máy chủ"
          if (err.response.status === 401) {
            errorMessage = "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại"
          }
        } else {
          errorMessage = err.message || "Lỗi hệ thống"
        }
        setError(errorMessage)
        console.error("Lỗi khi lấy địa chỉ:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAddresses()
  }, [cookies.jwt_token, navigate])

  const handleDeleteAddress = async (id: number) => {
    setDeleteLoading(id)
    try {
      const token = cookies.jwt_token
      if (!token) {
        setError("Vui lòng đăng nhập để xóa địa chỉ")
        navigate("/login")
        return
      }

      await axios.delete(`http://localhost:8080/api/address/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      })

      setAddresses(addresses.filter((addr) => addr.addressId !== id))
      setError(null)
      toast.success("Xóa địa chỉ thành công")
    } catch (err: any) {
      let errorMessage = "Lỗi khi xóa địa chỉ"
      if (axios.isAxiosError(err) && err.response) {
        const errorData = err.response.data
        errorMessage =
            typeof errorData === "string" ? errorData : errorData?.error || errorData?.message || "Lỗi từ máy chủ"
        if (err.response.status === 401) {
          errorMessage = "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại"
        }
      } else {
        errorMessage = err.message || "Lỗi hệ thống"
      }
      toast.error(errorMessage)
      console.error("Lỗi khi xóa địa chỉ:", err)
    } finally {
      setDeleteLoading(null)
      setShowConfirmModal(null)
    }
  }

  const handleSelectAddress = (addr: Address) => {
    localStorage.setItem("selectedAddress", JSON.stringify(addr))
    toast.success("Đã chọn địa chỉ thành công")
    navigate("/checkout")
  }

  const totalPages = Math.ceil(addresses.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = addresses.slice(indexOfFirstItem, indexOfLastItem)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  if (loading) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-black rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600">Đang tải danh sách địa chỉ...</p>
        </div>
    )
  }

  if (error) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="bg-red-50 text-red-600 p-6 rounded-lg max-w-md text-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-4 text-red-500"
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
            <h3 className="text-lg font-semibold mb-2">Đã xảy ra lỗi</h3>
            <p className="mb-4">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
    )
  }

  return (
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Danh sách địa chỉ của tôi</h1>
              <p className="text-gray-500 mt-1">Quản lý các địa chỉ giao hàng của bạn</p>
            </div>
            <Link
                to="/address/add"
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center shadow-sm"
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 mr-2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Thêm địa chỉ mới
            </Link>
          </div>

          {addresses.length === 0 ? (
              <div className="bg-white shadow-sm rounded-lg p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-10 w-10 text-gray-400"
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
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có địa chỉ nào</h3>
                <p className="text-gray-500 mb-6">Bạn chưa thêm địa chỉ nào vào tài khoản của mình</p>
                <Link
                    to="/address/add"
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                  <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm địa chỉ đầu tiên
                </Link>
              </div>
          ) : (
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Địa chỉ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tỉnh/Thành phố
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã bưu điện
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
                    <AnimatePresence>
                      {currentItems.map((addr) => (
                          <motion.tr
                              key={addr.addressId}
                              className="hover:bg-gray-50 transition-colors"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              layout
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{addr.address}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">
                            {addr.city}
                          </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {addr.postalCode || "N/A"} 
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(addr.createdAt).toLocaleDateString("vi-VN", {
                                day: "numeric",
                                month: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-3">
                                <Link
                                    to={`/address/view/${addr.addressId}`}
                                    className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded-full hover:bg-blue-50"
                                    title="Xem chi tiết"
                                >
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke="currentColor"
                                      className="w-5 h-5"
                                  >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                </Link>
                                <Link
                                    to={`/address/update/${addr.addressId}`}
                                    className="text-green-600 hover:text-green-900 transition-colors p-1 rounded-full hover:bg-green-50"
                                    title="Chỉnh sửa"
                                >
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke="currentColor"
                                      className="w-5 h-5"
                                  >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                    />
                                  </svg>
                                </Link>
                                <button
                                    onClick={() => setShowConfirmModal(addr.addressId)}
                                    className="text-red-600 hover:text-red-900 transition-colors p-1 rounded-full hover:bg-red-50"
                                    title="Xóa"
                                    disabled={deleteLoading === addr.addressId}
                                >
                                  {deleteLoading === addr.addressId ? (
                                      <svg
                                          className="animate-spin h-5 w-5"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                      >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                      </svg>
                                  ) : (
                                      <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          strokeWidth={1.5}
                                          stroke="currentColor"
                                          className="w-5 h-5"
                                      >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                      </svg>
                                  )}
                                </button>
                                <button
                                    onClick={() => handleSelectAddress(addr)}
                                    className="text-yellow-600 hover:text-yellow-900 transition-colors p-1 rounded-full hover:bg-yellow-50"
                                    title="Chọn địa chỉ"
                                >
                                  <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={1.5}
                                      stroke="currentColor"
                                      className="w-5 h-5"
                                  >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                      ))}
                    </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-gray-700 order-2 sm:order-1">
                        Hiển thị <span className="font-medium">{indexOfFirstItem + 1}</span> đến{" "}
                        <span className="font-medium">{Math.min(indexOfLastItem, addresses.length)}</span> trong{" "}
                        <span className="font-medium">{addresses.length}</span> địa chỉ
                      </div>
                      <div className="flex space-x-2 order-1 sm:order-2">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded-md ${
                                currentPage === 1
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => paginate(page)}
                                className={`px-3 py-1 rounded-md transition-colors ${
                                    currentPage === page ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                              {page}
                            </button>
                        ))}
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded-md ${
                                currentPage === totalPages
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                            }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                )}
              </div>
          )}
        </motion.div>

        <AnimatePresence>
          {showConfirmModal !== null && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                  <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 transition-opacity"
                      onClick={() => setShowConfirmModal(null)}
                  >
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                  </motion.div>

                  <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>

                  <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
                  >
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                          <svg
                              className="h-6 w-6 text-red-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                          >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">Xác nhận xóa địa chỉ</h3>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button
                          type="button"
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                          onClick={() => handleDeleteAddress(showConfirmModal)}
                          disabled={deleteLoading !== null}
                      >
                        {deleteLoading !== null ? "Đang xóa..." : "Xóa"}
                      </button>
                      <button
                          type="button"
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                          onClick={() => setShowConfirmModal(null)}
                          disabled={deleteLoading !== null}
                      >
                        Hủy
                      </button>
                    </div>
                  </motion.div>
                </div>
              </div>
          )}
        </AnimatePresence>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
  )
}