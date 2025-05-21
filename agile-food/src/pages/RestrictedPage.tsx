
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { useCookies } from "react-cookie";

interface User {
  fullName: string;
  email: string;
  phone: string;
  role: "ADMIN" | "CUSTOMER";
}

interface OutletContext {
  token: string | undefined;
  setShowSuccessModal: (show: boolean) => void;
}

export default function RestrictedPage() {
  const { token: contextToken } = useOutletContext<OutletContext>();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cookies] = useCookies(["jwt_token"]);
  const navigate = useNavigate();

  const token = contextToken || cookies.jwt_token;

  const fetchUser = async () => {
    if (!token) {
      setMessage("Vui lòng đăng nhập để truy cập trang này.");
      setLoading(false);
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      console.log("Fetching user with token:", token);
      const response = await axios.get<User>(
        "http://localhost:8080/api/auth/me",
        {
          withCredentials: true,
        }
      );
      console.log("Response /api/auth/me:", response.data);
      setUser(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      console.error("Error fetching user:", {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
      const errorStatus = axiosError.response?.status;
      if (errorStatus === 401) {
        setMessage("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (errorStatus === 403) {
        setMessage("Bạn không có quyền truy cập. Vui lòng liên hệ quản trị viên.");
      } else if (errorStatus === 500) {
        setMessage("Lỗi server. Vui lòng thử lại sau.");
      } else {
        setMessage(axiosError.response?.data?.error || "Không thể tải thông tin người dùng.");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Trang hạn chế truy cập</h1>

        {message && (
          <p className="text-lg mb-4 text-red-500">{message}</p>
        )}

        {user ? (
          user.role === "CUSTOMER" ? (
            <p className="text-lg text-red-500">
              Bạn không có quyền truy cập vào trang này.
            </p>
          ) : (
            <div>
              <p className="text-lg text-green-600 mb-4">
                Chào mừng {user.fullName}! Bạn có quyền truy cập với vai trò ADMIN.
              </p>
              <p className="text-gray-600">
                Đây là nội dung chỉ dành cho ADMIN. Bạn có thể thực hiện các hành động quản trị tại đây.
              </p>
            </div>
          )
        ) : (
          <p className="text-lg text-gray-600">
            Đang xử lý... Bạn sẽ được chuyển hướng nếu không có quyền.
          </p>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-6 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm transition duration-200"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
