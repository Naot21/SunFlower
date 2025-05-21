import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios, { type AxiosError } from "axios";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { FiMail, FiUser, FiPhone, FiCheckCircle, FiAlertCircle, FiLoader } from "react-icons/fi";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
}

interface Errors {
  [key: string]: string | undefined;
  fullName?: string;
  email?: string;
  phone?: string;
  form?: string;
}

interface User {
  fullName: string;
  email: string;
  phone: string;
  status: string; // Added to store account status (PENDING or ACTIVE)
}

export default function UpdateProfilePage() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const [cookies] = useCookies(["jwt_token"]);
  const navigate = useNavigate();

  const token = cookies.jwt_token;

  const fetchUser = async () => {
    if (!token) {
      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="w-5 h-5 mr-2" />
          Vui lòng đăng nhập để tiếp tục.
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
      setTimeout(() => navigate("/login"), 3000);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch user info including status from /api/auth/user
      const response = await axios.get<{
        fullname: string;
        email: string;
        phone: string;
        status: string;
      }>("http://localhost:8080/api/auth/user", {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = {
        fullName: response.data.fullname || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        status: response.data.status || "PENDING",
      };
      setUser(userData);
      setFormData({
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const errorStatus = axiosError.response?.status;
      if (errorStatus === 401) {
        toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        setTimeout(() => navigate("/login"), 3000);
      } else if (errorStatus === 403) {
        toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            Bạn không có quyền truy cập. Vui lòng liên hệ quản trị viên.
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      } else if (errorStatus === 500) {
        toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            Lỗi server. Vui lòng thử lại sau.
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      } else {
        toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            {axiosError.response?.data?.error || "Không thể tải thông tin người dùng."}
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Họ và tên không được để trống";
    else if (formData.fullName.length < 2 || formData.fullName.length > 100)
      newErrors.fullName = "Họ và tên phải từ 2 đến 100 ký tự";
    if (!formData.email.trim()) {
      newErrors.email = "Email không được để trống";
    } else if (!/^[A-Za-z0-9+_.-]+@(.+)$/.test(formData.email)) {
      newErrors.email = "Email không đúng định dạng";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^0[0-9]{9}$/.test(formData.phone.replace(/\s+/g, ""))) {
      newErrors.phone = "Số điện thoại phải có 10 chữ số và bắt đầu bằng 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json; charset=UTF-8",
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      };

      const res = await axios.put(
        "http://localhost:8080/api/auth/update-profile",
        payload,
        {
          withCredentials: true,
          headers,
        }
      );

      toast.success(
        <div className="flex items-center">
          <FiCheckCircle className="w-5 h-5 mr-2" />
          {res.data.message || "Cập nhật thông tin thành công!"}
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      if (user) {
        const updatedUser = {
          ...user,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          status: user.status,
        };
        setUser(updatedUser);
      }
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      setIsSubmitting(false);
      const axiosError = error as AxiosError<{ error?: string }>;
      if (axiosError.response) {
        const { status, data } = axiosError.response;
        if (status === 400) {
          setErrors({ form: data?.error || "Thông tin cập nhật không hợp lệ." });
          toast.error(
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              {data?.error || "Vui lòng kiểm tra lại thông tin."}
            </div>,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        } else if (status === 401) {
          toast.error(
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.
            </div>,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
          setTimeout(() => navigate("/login"), 3000);
        } else if (status === 403) {
          toast.error(
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              Bạn không có quyền cập nhật thông tin. Vui lòng liên hệ quản trị viên.
            </div>,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        } else if (status === 500) {
          toast.error(
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              Lỗi server. Vui lòng thử lại sau.
            </div>,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        } else {
          toast.error(
            <div className="flex items-center">
              <FiAlertCircle className="w-5 h-5 mr-2" />
              {data?.error || "Cập nhật thất bại. Vui lòng thử lại."}
            </div>,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        }
      } else if (axiosError.request) {
        toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      } else {
        toast.error(
          <div className="flex items-center">
            <FiAlertCircle className="w-5 h-5 mr-2" />
            {axiosError.message || "Đã xảy ra lỗi không xác định."}
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      }
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendError("");
    setResendSuccess("");

    try {
      const res = await axios.post(
        "http://localhost:8080/api/auth/resend-verification",
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResendSuccess(res.data.message || "Email xác minh đã được gửi lại.");
      toast.success(
        <div className="flex items-center">
          <FiMail className="w-5 h-5 mr-2" />
          {res.data.message || "Email xác minh đã được gửi lại!"}
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const errorMessage =
        axiosError.response?.data?.error || "Không thể gửi lại email. Vui lòng thử lại sau.";
      setResendError(errorMessage);
      toast.error(
        <div className="flex items-center">
          <FiAlertCircle className="w-5 h-5 mr-2" />
          {errorMessage}
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    } finally {
      setResendLoading(false);
    }
  };

  const handleRetry = () => {
    fetchUser();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FiLoader className="w-12 h-12 text-black animate-spin" />
        <p className="text-gray-600 ml-3">Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
          <p className="mt-2 text-sm text-gray-600">Cập nhật thông tin cá nhân của bạn</p>
        </div>

        {!user ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <FiAlertCircle className="text-red-500 text-5xl mb-4" />
            <p className="text-gray-800 font-medium mb-6">Không thể tải thông tin người dùng</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleRetry}
                className="w-full bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:bg-gray-500 transition duration-200"
              >
                Thử lại
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition duration-200"
              >
                Đăng nhập lại
              </button>
            </div>
          </div>
        ) : user.status === "pending" ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <FiAlertCircle className="text-yellow-500 text-5xl mb-4 mx-auto" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Tài khoản chưa được xác minh
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Vui lòng xác minh tài khoản của bạn qua email trước khi cập nhật thông tin. Kiểm tra
                hộp thư hoặc thư rác để tìm email xác minh.
              </p>

              {resendSuccess && (
                <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm">
                  <div className="flex items-center">
                    <FiCheckCircle className="w-5 h-5 mr-2" />
                    <p>{resendSuccess}</p>
                  </div>
                </div>
              )}

              {resendError && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                  <div className="flex items-center">
                    <FiAlertCircle className="w-5 h-5 mr-2" />
                    <p>{resendError}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                  resendLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <span className="flex items-center">
                  {resendLoading ? (
                    <FiLoader className="h-5 w-5 text-gray-300 animate-spin mr-2" />
                  ) : (
                    <FiMail className="h-5 w-5 text-gray-300 mr-2" />
                  )}
                  {resendLoading ? "Đang gửi..." : "Gửi lại email xác minh"}
                </span>
              </button>

              <p className="mt-4 text-sm text-gray-600">
                Đã xác minh?{" "}
                <a
                  href="/login"
                  className="font-medium text-black hover:text-gray-800"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập lại
                </a>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* User info header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center">
                <div className="bg-gray-200 rounded-full h-12 w-12 flex items-center justify-center text-gray-600">
                  <FiUser className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium text-gray-900">{user.fullName}</h2>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {errors.form && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                  <p className="font-medium">Lỗi cập nhật</p>
                  <p>{errors.form}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.fullName ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black`}
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium transition duration-200"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm font-medium transition duration-200 ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <FiLoader className="animate-spin h-4 w-4 text-white mr-2" />
                      Đang cập nhật...
                    </div>
                  ) : (
                    "Cập nhật thông tin"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}