import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useCookies } from "react-cookie"
import axios, { type AxiosError } from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

interface OrderDetail {
  orderDetailId: number
  productId: number
  productName: string
  quantity: number
  price: number
  images?: string[]
}

interface Order {
  orderId: number
  totalPrice: number
  status: string
  paymentMethod: string
  paymentStatus: string
  createdAt: string
  fullName: string
  email: string
  phone: string
  address: string
  note?: string
  orderDetails: OrderDetail[]
}

interface ReviewInput {
  productId: number
  orderId: number
  rating: number
  comment: string
  mediaUrls: string[]
}

interface Review {
  reviewId: number
  productId: number
  orderId: number
  rating: number
  comment: string
  mediaUrls: string[]
  userEmail: string
  userName?: string
  createdAt: string
}

const API_URL = "http://localhost:8080/api"

export default function OrdersPage() {
  const navigate = useNavigate()
  const [cookies, , removeCookie] = useCookies(["jwt_token"])
  const [user, setUser] = useState<{ email: string; role: string } | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [reviews, setReviews] = useState<ReviewInput[]>([])
  const [existingReviews, setExistingReviews] = useState<Review[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [successMessage, setSuccessMessage] = useState<string>("")
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false)
  const [orderToCancel, setOrderToCancel] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        if (!cookies.jwt_token) {
          throw new Error("Vui lòng đăng nhập để xem đơn hàng.")
        }

        setIsLoading(true)

        // Fetch user data
        const userResponse = await axios.get(`${API_URL}/auth/user`, {
          headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          withCredentials: true,
        })

        const userData = {
          email: userResponse.data.email,
          role: userResponse.data.role.toUpperCase(),
        }
        setUser(userData)

        if (userData.role !== "CUSTOMER") {
          throw new Error("Chỉ khách hàng mới có thể xem đơn hàng.")
        }

        // Fetch user orders
        const ordersResponse = await axios.get(`${API_URL}/orders/user/${userData.email}`, {
          headers: { Authorization: `Bearer ${cookies.jwt_token}` },
          withCredentials: true,
        })

        setOrders(ordersResponse.data)
        toast.success(ordersResponse.data.length ? "Đã tải danh sách đơn hàng!" : "Không tìm thấy đơn hàng.", {
          position: "top-right",
          autoClose: 3000,
        })
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>
        let errorMessage = "Không thể lấy danh sách đơn hàng. Vui lòng thử lại."
        if (axiosError.response?.status === 401) {
          removeCookie("jwt_token", { path: "/" })
          setUser(null)
          errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
          navigate("/login")
        } else if (axiosError.response?.status === 403) {
          errorMessage = "Bạn không có quyền xem đơn hàng này."
        } else if (axiosError.message) {
          errorMessage = axiosError.message
        }
        setError(errorMessage)
        toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndOrders()
  }, [cookies.jwt_token, navigate, removeCookie])

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage, { position: "top-right", autoClose: 3000 })
      setSuccessMessage("")
    }
  }, [successMessage])

  const fetchExistingReviews = async (orderId: number) => {
    try {
      const response = await axios.get(`${API_URL}/reviews/order/${orderId}`, {
        headers: { Authorization: `Bearer ${cookies.jwt_token}` },
        withCredentials: true,
      })
      setExistingReviews(
        response.data.map((review: any) => ({
          reviewId: review.reviewId,
          productId: review.productId,
          orderId: review.orderId,
          rating: review.rating,
          comment: review.comment || "",
          mediaUrls: review.media ? review.media.map((m: any) => m.mediaUrl) : [],
          userEmail: review.userEmail || "",
          userName: review.userName || "",
          createdAt: review.createdAt,
        })),
      )
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const errorMessage = axiosError.response?.data?.message || "Không thể lấy danh sách đánh giá."
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
    }
  }

  const handleConfirmReceived = async (orderId: number) => {
    try {
      setIsSubmitting(true)
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/confirm-received`,
        {},
        { headers: { Authorization: `Bearer ${cookies.jwt_token}` }, withCredentials: true },
      )
      setSuccessMessage("Xác nhận đã nhận hàng thành công!")
      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? { ...order, status: response.data.status, paymentStatus: response.data.paymentStatus }
            : order,
        ),
      )
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: response.data.status,
          paymentStatus: response.data.paymentStatus,
        })
        fetchExistingReviews(orderId)
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      let errorMessage = axiosError.response?.data?.message || "Không thể xác nhận nhận hàng."
      if (axiosError.response?.status === 401) {
        removeCookie("jwt_token", { path: "/" })
        navigate("/login")
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
      } else if (axiosError.response?.status === 400) {
        errorMessage = axiosError.response.data?.message || "Không thể xác nhận nhận hàng."
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelOrder = async (orderId: number) => {
    try {
      setIsSubmitting(true)
      const response = await axios.put(
        `${API_URL}/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${cookies.jwt_token}` }, withCredentials: true },
      )
      setSuccessMessage("Hủy đơn hàng thành công!")
      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? { ...order, status: response.data.status, paymentStatus: response.data.paymentStatus }
            : order,
        ),
      )
      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          status: response.data.status,
          paymentStatus: response.data.paymentStatus,
        })
      }
      setShowCancelConfirm(false)
      setOrderToCancel(null)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      let errorMessage = axiosError.response?.data?.message || "Không thể hủy đơn hàng."
      if (axiosError.response?.status === 401) {
        removeCookie("jwt_token", { path: "/" })
        navigate("/login")
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
      } else if (axiosError.response?.status === 400) {
        errorMessage = axiosError.response.data?.message || "Không thể hủy đơn hàng."
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingSubmit = async (productId: number, orderId: number) => {
    if (!selectedOrder) return

    const reviewInput = reviews.find((r) => r.productId === productId && r.orderId === orderId)
    if (!reviewInput || reviewInput.rating === 0) {
      toast.error("Vui lòng chọn số sao để đánh giá.", { position: "top-right", autoClose: 3000 })
      return
    }

    try {
      setIsSubmitting(true)
      const response = await axios.post(
        `${API_URL}/reviews/create`,
        {
          productId,
          orderId,
          rating: reviewInput.rating,
          comment: reviewInput.comment || "",
          mediaUrls: reviewInput.mediaUrls || [],
        },
        { headers: { Authorization: `Bearer ${cookies.jwt_token}` }, withCredentials: true },
      )
      setSuccessMessage("Đánh giá đã được gửi thành công!")
      setExistingReviews((prev) => [
        ...prev,
        {
          reviewId: response.data.reviewId,
          productId,
          orderId,
          rating: response.data.rating,
          comment: response.data.comment || "",
          mediaUrls: response.data.media ? response.data.media.map((m: any) => m.mediaUrl) : [],
          userEmail: user?.email || "",
          userName: user?.email.split("@")[0],
          createdAt: new Date().toISOString(),
        },
      ])
      setReviews((prev) => prev.filter((r) => !(r.productId === productId && r.orderId === orderId)))

      // Check if all products are reviewed
      const allReviewed = selectedOrder.orderDetails.every((item) =>
        [...existingReviews, response.data].some(
          (review) => review.productId === item.productId && review.orderId === orderId,
        ),
      )
      if (allReviewed) {
        const completeResponse = await axios.put(
          `${API_URL}/orders/${orderId}/complete`,
          {},
          { headers: { Authorization: `Bearer ${cookies.jwt_token}` }, withCredentials: true },
        )
        setSuccessMessage("Đơn hàng đã được hoàn thành!")
        setOrders((prev) =>
          prev.map((order) => (order.orderId === orderId ? { ...order, status: completeResponse.data.status } : order)),
        )
        setSelectedOrder({ ...selectedOrder, status: completeResponse.data.status })
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      let errorMessage = axiosError.response?.data?.message || "Không thể gửi đánh giá."
      if (axiosError.response?.status === 401) {
        removeCookie("jwt_token", { path: "/" })
        navigate("/login")
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."
      }
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReviewChange = (productId: number, orderId: number, field: string, value: any) => {
    setReviews((prev) => {
      const existingReview = prev.find((r) => r.productId === productId && r.orderId === orderId)
      if (existingReview) {
        return prev.map((r) => (r.productId === productId && r.orderId === orderId ? { ...r, [field]: value } : r))
      }
      return [...prev, { productId, orderId, rating: 0, comment: "", mediaUrls: [], [field]: value }]
    })
  }

  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order)
    setReviews([])
    await fetchExistingReviews(order.orderId)

    // On mobile, scroll to top when selecting an order
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const formatOrderStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return {
          text: "Chờ xác nhận",
          color: "bg-yellow-100 text-yellow-800 border border-yellow-200",
          icon: (
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        }
      case "confirmed":
        return {
          text: "Đã xác nhận",
          color: "bg-blue-100 text-blue-800 border border-blue-200",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        }
      case "delivered":
        return {
          text: "Đang giao",
          color: "bg-purple-100 text-purple-800 border border-purple-200",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        }
      case "received":
        return {
          text: "Đã giao",
          color: "bg-green-100 text-green-800 border border-green-200",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        }
      case "completed":
        return {
          text: "Hoàn thành",
          color: "bg-green-600 text-white border border-green-700",
          icon: (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        }
      case "cancelled":
        return {
          text: "Đã hủy",
          color: "bg-red-100 text-red-800 border border-red-200",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        }
      default:
        return {
          text: status,
          color: "bg-gray-100 text-gray-700 border border-gray-300",
          icon: null,
        }
    }
  }

  const formatPaymentStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return {
          text: "Đã thanh toán",
          color: "bg-green-600 text-white border border-green-700",
          icon: (
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        }
      case "pending":
        return {
          text: "Chưa thanh toán",
          color: "bg-yellow-100 text-yellow-800 border border-yellow-200",
          icon: (
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        }
      case "failed":
        return {
          text: "Thất bại",
          color: "bg-red-100 text-red-800 border border-red-200",
          icon: (
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
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        }
      case "refunded":
        return {
          text: "Đã hoàn tiền",
          color: "bg-blue-100 text-blue-800 border border-blue-200",
          icon: (
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
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          ),
        }
      default:
        return {
          text: status,
          color: "bg-gray-100 text-gray-700 border border-gray-300",
          icon: null,
        }
    }
  }

  const formatPaymentMethod = (method: string) => {
    switch (method.toLowerCase()) {
      case "cod":
        return {
          text: "Tiền mặt (COD)",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
          ),
        }
      case "vnpay":
        return {
          text: "Thanh toán VNPay",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-gray-600"
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
          ),
        }
      default:
        return {
          text: method,
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-gray-600"
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
          ),
        }
    }
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/placeholder-product.jpg"
  }

  const filteredOrders = orders.filter((order) => {
    if (activeTab === "all") return true
    return order.status.toLowerCase() === activeTab.toLowerCase()
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-black rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-800 font-medium text-lg">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 text-center bg-white min-h-screen">
        <ToastContainer position="top-right" autoClose={3000} />
        <div className="max-w-md mx-auto bg-white p-10 rounded-xl shadow-lg border border-gray-200">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-500"
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 text-lg mb-8">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300 shadow-sm font-medium"
            >
              Thử lại
            </button>
            {error.includes("đăng nhập") && (
              <Link
                to="/login"
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-300 font-medium"
              >
                Đăng nhập lại
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen pb-12">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="bg-black text-white shadow-md">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Đơn hàng của bạn</h1>
              <p className="text-gray-400 mt-1">Theo dõi và quản lý các đơn hàng của bạn tại đây.</p>
            </div>
            <Link
              to="/"
              className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors duration-300 shadow-sm flex items-center justify-center font-medium group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-300"
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
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 overflow-hidden border border-gray-200">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: "all", label: "Tất cả", color: "bg-gray-100 hover:bg-gray-200" },
              { id: "pending", label: formatOrderStatus("pending").text, color: "bg-yellow-50 hover:bg-yellow-100" },
              { id: "confirmed", label: formatOrderStatus("confirmed").text, color: "bg-blue-50 hover:bg-blue-100" },
              {
                id: "delivered",
                label: formatOrderStatus("delivered").text,
                color: "bg-purple-50 hover:bg-purple-100",
              },
              { id: "received", label: formatOrderStatus("received").text, color: "bg-green-50 hover:bg-green-100" },
              { id: "completed", label: formatOrderStatus("completed").text, color: "bg-green-100 hover:bg-green-200" },
              { id: "cancelled", label: formatOrderStatus("cancelled").text, color: "bg-red-50 hover:bg-red-100" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-lg whitespace-nowrap flex items-center transition-all duration-300 ${
                  activeTab === tab.id
                    ? tab.id === "all"
                      ? "bg-black text-white shadow-sm"
                      : formatOrderStatus(tab.id).color.replace("border", "")
                    : tab.color + " text-gray-700"
                }`}
              >
                {tab.id !== "all" && formatOrderStatus(tab.id).icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-gray-100">
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
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-600 text-lg mb-8">Bạn chưa có đơn hàng nào trong danh mục này.</p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300 shadow-sm font-medium"
            >
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - Order List */}
            <div className={`${isMobile && selectedOrder ? "hidden" : ""} lg:w-1/3 xl:w-1/4 order-2 lg:order-1`}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Danh sách đơn hàng</h3>
                  <p className="text-sm text-gray-500 mt-1">Tổng cộng: {filteredOrders.length} đơn hàng</p>
                </div>

                <div className="divide-y divide-gray-200 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
                      <Link
                        to="/"
                        className="mt-4 inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300 text-sm font-medium"
                      >
                        Bắt đầu mua sắm
                      </Link>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div
                        key={order.orderId}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200 ${
                          selectedOrder?.orderId === order.orderId ? "bg-gray-50 border-l-4 border-l-black" : ""
                        }`}
                        onClick={() => handleSelectOrder(order)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">Đơn #{order.orderId}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center ${
                              formatOrderStatus(order.status).color
                            }`}
                          >
                            {formatOrderStatus(order.status).icon}
                            {formatOrderStatus(order.status).text}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <p className="text-sm font-medium text-gray-900">
                            {order.totalPrice.toLocaleString("vi-VN")} VNĐ
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-[120px]">{order.fullName}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Main Content - Order Details */}
            <div className="lg:w-2/3 xl:w-3/4 order-1 lg:order-2">
              {/* Mobile view - Back button */}
              {isMobile && selectedOrder && (
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center hover:bg-gray-200 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Quay lại danh sách
                </button>
              )}

              {selectedOrder ? (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 mr-2 text-gray-700"
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
                          Chi tiết đơn hàng #{selectedOrder.orderId}
                        </h2>
                        <p className="text-gray-500 mt-1">
                          Đặt ngày: {new Date(selectedOrder.createdAt).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.status.toLowerCase() === "delivered" && (
                          <button
                            onClick={() => handleConfirmReceived(selectedOrder.orderId)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-sm flex items-center"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            Xác nhận đã nhận
                          </button>
                        )}
                        {(selectedOrder.status.toLowerCase() === "pending" ||
                          selectedOrder.status.toLowerCase() === "confirmed") && (
                          <button
                            onClick={() => {
                              setOrderToCancel(selectedOrder.orderId)
                              setShowCancelConfirm(true)
                            }}
                            className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors duration-300 shadow-sm flex items-center"
                            disabled={isSubmitting}
                          >
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Hủy đơn hàng
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Trạng thái đơn hàng
                        </h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${formatOrderStatus(selectedOrder.status).color}`}
                        >
                          {formatOrderStatus(selectedOrder.status).icon}
                          {formatOrderStatus(selectedOrder.status).text}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
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
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Trạng thái thanh toán
                        </h3>
                        <span
                          className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${formatPaymentStatus(selectedOrder.paymentStatus).color}`}
                        >
                          {formatPaymentStatus(selectedOrder.paymentStatus).icon}
                          {formatPaymentStatus(selectedOrder.paymentStatus).text}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
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
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          Phương thức thanh toán
                        </h3>
                        <div className="flex items-center text-gray-700">
                          {formatPaymentMethod(selectedOrder.paymentMethod).icon}
                          {formatPaymentMethod(selectedOrder.paymentMethod).text}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="md:col-span-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
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
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Thông tin giao hàng
                        </h3>
                        <div className=" grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-gray-400 mt-0.5"
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
                              <p className="text-gray-900 font-medium">{selectedOrder.fullName}</p>
                              <p className="text-gray-500">{selectedOrder.email}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-gray-400 mt-0.5"
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
                            <p className="text-gray-900 font-medium">{selectedOrder.phone}</p>
                          </div>
                          <div className="flex items-start md:col-span-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2 text-gray-400 mt-0.5"
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
                            <p className="text-gray-700">{selectedOrder.address}</p>
                          </div>
                          {selectedOrder.note && (
                            <div className="flex items-start md:col-span-2">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 mr-2 text-gray-400 mt-0.5"
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
                              <p className="text-gray-700">{selectedOrder.note}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-gray-700"
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
                        Sản phẩm đã đặt
                      </h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Sản phẩm
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Giá
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Số lượng
                                </th>
                                <th
                                  scope="col"
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  Tổng
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedOrder.orderDetails.map((item) => {
                                const existingReview = existingReviews.find(
                                  (review) =>
                                    review.productId === item.productId && review.orderId === selectedOrder.orderId,
                                )
                                const reviewInput = reviews.find(
                                  (r) => r.productId === item.productId && r.orderId === selectedOrder.orderId,
                                )

                                return (
                                  <tr key={item.orderDetailId}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                                          <img
                                            src={
                                              item.images && item.images.length > 0
                                                ? item.images[0]
                                                : "/placeholder-product.jpg"
                                            }
                                            alt={item.productName}
                                            className="h-full w-full object-cover"
                                            onError={handleImageError}
                                          />
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {item.price.toLocaleString("vi-VN")} VNĐ
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{item.quantity}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-gray-900">
                                        {(item.quantity * item.price).toLocaleString("vi-VN")} VNĐ
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                            <tfoot className="bg-gray-50">
                              <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-sm font-medium text-gray-500">
                                  Tổng cộng:
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-gray-900">
                                  {selectedOrder.totalPrice.toLocaleString("vi-VN")} VNĐ
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Reviews Section */}
                    {selectedOrder.status.toLowerCase() === "received" && (
                      <div className="mt-8 border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-gray-700"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                          Đánh giá sản phẩm
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedOrder.orderDetails.map((item) => {
                            const existingReview = existingReviews.find(
                              (review) =>
                                review.productId === item.productId && review.orderId === selectedOrder.orderId,
                            )
                            const reviewInput = reviews.find(
                              (r) => r.productId === item.productId && r.orderId === selectedOrder.orderId,
                            )

                            return (
                              <div
                                key={`review-${item.orderDetailId}`}
                                className="border border-gray-200 rounded-lg p-4 bg-white"
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                                    <img
                                      src={
                                        item.images && item.images.length > 0
                                          ? item.images[0]
                                          : "/placeholder-product.jpg"
                                      }
                                      alt={item.productName}
                                      className="h-full w-full object-cover"
                                      onError={handleImageError}
                                    />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{item.productName}</p>
                                    <p className="text-sm text-gray-500">
                                      {item.quantity} x {item.price.toLocaleString("vi-VN")} VNĐ
                                    </p>
                                  </div>
                                </div>

                                {!existingReview ? (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-2">Đánh giá sản phẩm</p>
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          onClick={() =>
                                            handleReviewChange(item.productId, selectedOrder.orderId, "rating", star)
                                          }
                                          className={`w-7 h-7 text-lg ${
                                            (reviewInput?.rating || 0) >= star ? "text-yellow-500" : "text-gray-300"
                                          } hover:scale-110 transition-transform duration-100`}
                                        >
                                          ★
                                        </button>
                                      ))}
                                    </div>
                                    <textarea
                                      className="mt-2 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm bg-white text-gray-700"
                                      placeholder="Viết đánh giá của bạn..."
                                      rows={3}
                                      value={reviewInput?.comment || ""}
                                      onChange={(e) =>
                                        handleReviewChange(
                                          item.productId,
                                          selectedOrder.orderId,
                                          "comment",
                                          e.target.value,
                                        )
                                      }
                                    />
                                    <button
                                      onClick={() => handleRatingSubmit(item.productId, selectedOrder.orderId)}
                                      className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-sm text-sm font-medium flex items-center"
                                      disabled={isSubmitting}
                                    >
                                      {isSubmitting ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                      ) : (
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
                                            d="M5 13l4 4L19 7"
                                          />
                                        </svg>
                                      )}
                                      Gửi đánh giá
                                    </button>
                                  </div>
                                ) : (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-1">Đánh giá của bạn</p>
                                    <div className="flex items-center gap-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                          key={star}
                                          className={`text-lg ${
                                            existingReview.rating >= star ? "text-yellow-500" : "text-gray-300"
                                          }`}
                                        >
                                          ★
                                        </span>
                                      ))}
                                      <span className="text-xs text-gray-500 ml-2">
                                        {new Date(existingReview.createdAt).toLocaleDateString("vi-VN")}
                                      </span>
                                    </div>
                                    {existingReview.comment && (
                                      <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        {existingReview.comment}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
                  <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-gray-100">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-lg">Chọn một đơn hàng để xem chi tiết.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-gray-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Xác nhận hủy đơn hàng</h3>
            <p className="text-gray-600 mb-8 text-center">
              Bạn có chắc chắn muốn hủy đơn hàng #{orderToCancel}? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setShowCancelConfirm(false)
                  setOrderToCancel(null)
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors duration-300 font-medium"
              >
                Không, giữ lại
              </button>
              <button
                onClick={() => orderToCancel && handleCancelOrder(orderToCancel)}
                className="px-6 py-3 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors duration-300 shadow-sm font-medium flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-red-800 border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                Có, hủy đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
