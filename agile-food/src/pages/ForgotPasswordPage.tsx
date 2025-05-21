import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { FiMail, FiKey, FiLock, FiArrowLeft, FiSend, FiCheck, FiLoader, FiAlertCircle } from "react-icons/fi"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [step, setStep] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOTP = async () => {
    if (!email) {
      setMessage("Vui lòng nhập địa chỉ email")
      setIsSuccess(false)
      toast.error("Vui lòng nhập địa chỉ email", { position: "top-right", autoClose: 3000 })
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setMessage("Địa chỉ email không hợp lệ")
      setIsSuccess(false)
      toast.error("Địa chỉ email không hợp lệ", { position: "top-right", autoClose: 3000 })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await axios.post(`${API_URL}/auth/send-otp`, { email })
      setMessage(res.data.message || "Mã OTP đã được gửi đến email của bạn")
      setIsSuccess(true)
      toast.success("Mã OTP đã được gửi đến email của bạn", { position: "top-right", autoClose: 3000 })
      setStep(2)
      setCountdown(60)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Lỗi khi gửi OTP. Vui lòng thử lại."
      setMessage(errorMessage)
      setIsSuccess(false)
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otp) {
      setMessage("Vui lòng nhập mã OTP")
      setIsSuccess(false)
      toast.error("Vui lòng nhập mã OTP", { position: "top-right", autoClose: 3000 })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp })
      setMessage(res.data.message || "Mã OTP hợp lệ. Vui lòng tạo mật khẩu mới.")
      setIsSuccess(true)
      toast.success("Mã OTP hợp lệ", { position: "top-right", autoClose: 3000 })
      setStep(3)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn"
      setMessage(errorMessage)
      setIsSuccess(false)
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!newPassword) {
      setMessage("Vui lòng nhập mật khẩu mới")
      setIsSuccess(false)
      toast.error("Vui lòng nhập mật khẩu mới", { position: "top-right", autoClose: 3000 })
      return
    }

    if (newPassword.length < 8) {
      setMessage("Mật khẩu phải có ít nhất 8 ký tự")
      setIsSuccess(false)
      toast.error("Mật khẩu phải có ít nhất 8 ký tự", { position: "top-right", autoClose: 3000 })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp")
      setIsSuccess(false)
      toast.error("Mật khẩu xác nhận không khớp", { position: "top-right", autoClose: 3000 })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword,
      })
      setMessage(res.data.message || "Đặt lại mật khẩu thành công. Đang chuyển hướng đến đăng nhập...")
      setIsSuccess(true)
      toast.success("Đặt lại mật khẩu thành công", { position: "top-right", autoClose: 3000 })
      setTimeout(() => navigate("/login"), 2000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Lỗi khi đặt lại mật khẩu. Vui lòng thử lại."
      setMessage(errorMessage)
      setIsSuccess(false)
      toast.error(errorMessage, { position: "top-right", autoClose: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-600"}`}>
          1
        </div>
        <div className={`w-12 h-1 ${step >= 2 ? "bg-gray-900" : "bg-gray-200"}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-600"}`}>
          2
        </div>
        <div className={`w-12 h-1 ${step >= 3 ? "bg-gray-900" : "bg-gray-200"}`}></div>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-600"}`}>
          3
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">Quên mật khẩu</h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === 1
                ? "Nhập email để nhận mã xác thực"
                : step === 2
                ? "Nhập mã OTP đã được gửi đến email của bạn"
                : "Tạo mật khẩu mới cho tài khoản của bạn"}
            </p>
          </div>

          {renderStepIndicator()}

          {message && (
            <div className={`mb-6 p-4 rounded-md flex items-start ${isSuccess ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              <div className="mr-3 mt-0.5">
                {isSuccess ? (
                  <FiCheck className="h-5 w-5 text-green-500" />
                ) : (
                  <FiAlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <p>{message}</p>
            </div>
          )}

          <div className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                      placeholder="example@gmail.com"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {loading ? (
                      <FiLoader className="h-5 w-5 text-gray-300 animate-spin" />
                    ) : (
                      <FiSend className="h-5 w-5 text-gray-300" />
                    )}
                  </span>
                  {loading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Mã OTP
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiKey className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                      placeholder="Nhập mã OTP"
                    />
                  </div>
                  {countdown > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      Gửi lại mã sau {countdown} giây
                    </p>
                  )}
                  {countdown === 0 && (
                    <button
                      onClick={handleSendOTP}
                      disabled={loading}
                      className="mt-2 text-sm text-gray-900 hover:text-gray-800 font-medium"
                    >
                      Gửi lại mã OTP
                    </button>
                  )}
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {loading ? (
                      <FiLoader className="h-5 w-5 text-gray-300 animate-spin" />
                    ) : (
                      <FiCheck className="h-5 w-5 text-gray-300" />
                    )}
                  </span>
                  {loading ? "Đang xác thực..." : "Xác thực OTP"}
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Mật khẩu mới
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                      placeholder="Nhập mật khẩu mới"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-500 focus:outline-none"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Xác nhận mật khẩu
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm"
                      placeholder="Xác nhận mật khẩu mới"
                    />
                  </div>
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 ${
                    loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {loading ? (
                      <FiLoader className="h-5 w-5 text-gray-300 animate-spin" />
                    ) : (
                      <FiCheck className="h-5 w-5 text-gray-300" />
                    )}
                  </span>
                  {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                </button>
              </>
            )}

            <div className="flex items-center justify-center">
              <Link
                to="/login"
                className="flex items-center text-sm font-medium text-gray-900 hover:text-gray-800"
              >
                <FiArrowLeft className="mr-2" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}