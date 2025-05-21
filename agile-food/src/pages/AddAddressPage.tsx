import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import axios from "axios"
import { useCookies } from "react-cookie"
import { motion } from "framer-motion"
import { toast, ToastContainer } from "react-toastify"

// Danh sách tỉnh thành
const vietnamProvinces = [
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cần Thơ",
  "Cao Bằng",
  "Đà Nẵng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Dương",
  "Hải Phòng",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "TP. Hồ Chí Minh",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
]

export default function AddAddressPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    postalCode: "", // Thay district thành postalCode
  })
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [cookies] = useCookies(["jwt_token"])

  useEffect(() => {
    if (!cookies.jwt_token) {
      navigate("/login")
    }
  }, [cookies, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const validateForm = () => {
    if (!formData.address.trim()) {
      setError("Địa chỉ chi tiết không được để trống")
      return false
    }
    if (!formData.city) {
      setError("Vui lòng chọn tỉnh/thành phố")
      return false
    }
    if (!formData.postalCode.trim()) {
      setError("Mã bưu điện không được để trống")
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const token = cookies.jwt_token
      if (!token) throw new Error("Vui lòng đăng nhập để thêm địa chỉ")

      const response = await axios.post(
          "http://localhost:8080/api/address",
          {
            address: formData.address.trim(),
            city: formData.city,
            postalCode: formData.postalCode.trim(), // Thay district thành postalCode
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json; charset=UTF-8",
            },
            withCredentials: true,
          },
      )

      setSuccessMessage("Thêm địa chỉ thành công!")
      toast.success("Thêm địa chỉ thành công!")
      setTimeout(() => navigate("/address"), 1500)
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const errorMsg =
            typeof err.response.data === "string" ? err.response.data : err.response.data?.message || "Lỗi từ máy chủ"
        setError(errorMsg)
        toast.error(errorMsg)
        if (err.response.status === 401) {
          setError("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại")
          toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại")
        }
      } else {
        setError("Lỗi hệ thống")
        toast.error("Lỗi hệ thống")
      }
      console.error("Lỗi khi thêm địa chỉ:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-4 md:px-8 py-8 flex flex-col items-center"
      >
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex items-center">
            <button
                onClick={() => navigate("/address")}
                className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Quay lại"
            >
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Thêm địa chỉ mới</h1>
          </div>

          {error && (
              <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-start"
              >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                  <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </motion.div>
          )}

          {successMessage && (
              <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-start"
              >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                  <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                  />
                </svg>
                <span>{successMessage}</span>
              </motion.div>
          )}

          <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onSubmit={handleSubmit}
              className="bg-white shadow-md rounded-lg p-6 w-full"
          >
            <div className="mb-5">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Nhập số nhà, tên đường, phường/xã..."
                  rows={3}
                  required
              />
            </div>

            <div className="mb-5">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                Tỉnh/Thành phố <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-lg appearance-none focus:ring-2 focus:ring-black focus:border-black transition-colors pr-10"
                    required
                >
                  <option value="">-- Chọn tỉnh/thành phố --</option>
                  {vietnamProvinces.map((province) => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Mã bưu điện <span className="text-red-500">*</span>
              </label>
              <input
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Ví dụ: 100000"
                  required
              />
              <p className="mt-1 text-xs text-gray-500">Nhập mã bưu điện, ví dụ: 100000</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                  type="button"
                  onClick={() => navigate("/address")}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                  disabled={loading}
              >
                Hủy
              </button>
              <button
                  type="submit"
                  disabled={loading}
                  className={`px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center ${
                      loading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
              >
                {loading && (
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                )}
                {loading ? "Đang xử lý..." : "Thêm địa chỉ"}
              </button>
            </div>
          </motion.form>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </motion.div>
  )
}