import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios, { AxiosError } from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FiMail, FiLoader, FiCheckCircle, FiAlertCircle } from "react-icons/fi"

export default function VerifyPage() {
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const verifyToken = async () => {
      const params = new URLSearchParams(location.search)
      const token = params.get("token")

      if (token) {
        setLoading(true)
        try {
          const response = await axios.get(`http://localhost:8080/api/auth/verify?token=${token}`, {
            withCredentials: true,
          })

          setSuccess("Tài khoản của bạn đã được xác minh thành công!")
          toast.success(
            <div className="flex items-center">
              <FiCheckCircle className="w-5 h-5 mr-2" />
              <span>Tài khoản đã được xác minh!</span>
            </div>,
            {
              position: "top-right",
              autoClose: 3000,
            }
          )
          setTimeout(() => navigate("/login"), 3000)
        } catch (err) {
          const axiosError = err as AxiosError<{ error?: string }>
          const errorMessage =
            axiosError.response?.data?.error || "Lỗi xác minh tài khoản. Vui lòng thử lại."
          setError(errorMessage)
          toast.error(
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              <span>{errorMessage}</span>
            </div>,
            {
              position: "top-right",
              autoClose: 5000,
            }
          )
        } finally {
          setLoading(false)
        }
      } else {
        setSuccess("Vui lòng kiểm tra email của bạn để xác minh tài khoản.")
        toast.info(
          <div className="flex items-center">
            <FiMail className="w-5 h-5 mr-2" />
            <span>Email xác minh đã được gửi. Kiểm tra hộp thư của bạn!</span>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
          }
        )
      }
    }

    verifyToken()
  }, [location.search, navigate])

  const handleResendEmail = async () => {
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      await axios.post(
        "http://localhost:8080/api/auth/resend-verification",
        {},
        {
          withCredentials: true,
        }
      )
      setSuccess("Email xác minh đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.")
      toast.success(
        <div className="flex items-center">
          <FiMail className="w-5 h-5 mr-2" />
          <span>Email xác minh đã được gửi lại!</span>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
        }
      )
    } catch (err) {
      const axiosError = err as AxiosError<{ error?: string }>
      const errorMessage =
        axiosError.response?.data?.error || "Không thể gửi lại email. Vui lòng thử lại sau."
      setError(errorMessage)
      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="w-5 h-5 mr-2" />
          <span>{errorMessage}</span>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
        }
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-md p-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Xác minh tài khoản</h2>
          <p className="mt-2 text-sm text-gray-600">
            Kiểm tra email của bạn để xác minh tài khoản và bắt đầu sử dụng dịch vụ.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center">
            <FiLoader className="w-8 h-8 text-gray-600 animate-spin" />
            <span className="ml-2 text-gray-600">Đang xử lý...</span>
          </div>
        )}

        {success && !loading && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <div className="flex items-center">
              <FiCheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!loading && (
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Không nhận được email? Kiểm tra thư rác hoặc gửi lại email xác minh.
            </p>
            <button
              onClick={handleResendEmail}
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <FiMail className="h-5 w-5 text-gray-300" />
              </span>
              {loading ? "Đang gửi..." : "Gửi lại email xác minh"}
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Đã xác minh?{" "}
            <a href="/login" className="font-medium text-black hover:text-gray-800">
              Đăng nhập ngay
            </a>
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  )
}