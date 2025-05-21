import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import axios, { AxiosError } from "axios";
import { useCookies } from "react-cookie";

interface User {
    fullName: string;
    email: string;
    phone: string;
    role: "ADMIN" | "CUSTOMER";
}

export default function ProtectedAdminRoute() {
    const [user, setUser] = useState<User | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [cookies, , removeCookie] = useCookies(["jwt_token"]);
    const token = cookies.jwt_token; // Lấy token trực tiếp từ cookie
    const navigate = useNavigate();

    const fetchUser = async () => {
        if (!token) {
            setMessage("Vui lòng đăng nhập để truy cập trang quản trị.");
            setLoading(false);
            // Chuyển hướng về trang đăng nhập sau 3 giây nếu không có token
            setTimeout(() => navigate("/login"), 3000);
            return;
        }

        try {
            setLoading(true);
            setMessage(null);
            console.log("Fetching user with token:", token);
            const response = await axios.get<User>("http://localhost:8080/api/auth/user", {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`, // Gửi token trong header
                },
            });
            console.log("Response /api/auth/user:", response.data);
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
                // Xóa cookie và chuyển hướng về trang đăng nhập
                removeCookie("jwt_token", { path: "/" });
                setTimeout(() => navigate("/login"), 3000);
            } else if (errorStatus === 403) {
                setMessage("Bạn không có quyền truy cập trang quản trị.");
            } else if (errorStatus === 500) {
                setMessage("Lỗi server. Vui lòng thử lại sau.");
            } else {
                setMessage(axiosError.response?.data?.error || "Không thể xác thực người dùng.");
            }
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [token, navigate, removeCookie]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!user || user.role === "CUSTOMER") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-4">Truy cập bị từ chối</h1>
                    <p className="text-lg text-red-500 mb-4">{message}</p>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => (window.location.href = "/")}
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm transition duration-200"
                        >
                            Về trang chủ
                        </button>
                        {message?.includes("đăng nhập") && (
                            <button
                                onClick={() => navigate("/login")}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm transition duration-200"
                            >
                                Đăng nhập lại
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return <Outlet />;
}