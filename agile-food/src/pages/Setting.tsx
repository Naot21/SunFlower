import React, { useState, useEffect } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FiAlertCircle, FiGlobe, FiImage, FiTrash2 } from "react-icons/fi";

const API_URL = "http://localhost:8080/api/settings";

const Setting: React.FC = () => {
    const [cookies, , removeCookie] = useCookies(["jwt_token"]);
    const navigate = useNavigate();
    const [language, setLanguage] = useState("vi");
    const [backgroundType, setBackgroundType] = useState<"color" | "image">("color");
    const [backgroundColor, setBackgroundColor] = useState("#f3f4f6");
    const [backgroundImage, setBackgroundImage] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${API_URL}/get`, {
                    headers: { Authorization: `Bearer ${cookies.jwt_token}` },
                    withCredentials: true,
                });
                const { language, backgroundType, backgroundColor, backgroundImage } = response.data;
                setLanguage(language || "vi");
                setBackgroundType(backgroundType || "color");
                setBackgroundColor(backgroundColor || "#f3f4f6");
                setBackgroundImage(backgroundImage || "");
            } catch (error) {
                toast.error("Không thể tải cài đặt.");
            }
        };
        fetchSettings();
    }, [cookies.jwt_token]);

    const handleLanguageChange = async (lang: string) => {
        setLanguage(lang);
        try {
            await axios.post(
                `${API_URL}/language`,
                { language: lang },
                {
                    headers: { Authorization: `Bearer ${cookies.jwt_token}` },
                    withCredentials: true,
                }
            );
            toast.success("Ngôn ngữ đã được cập nhật.");
            window.location.reload();
        } catch (error) {
            toast.error("Không thể cập nhật ngôn ngữ.");
        }
    };

    const handleBackgroundChange = async () => {
        try {
            await axios.post(
                `${API_URL}/background`,
                { backgroundType, backgroundColor, backgroundImage },
                {
                    headers: { Authorization: `Bearer ${cookies.jwt_token}` },
                    withCredentials: true,
                }
            );
            toast.success("Cài đặt nền đã được cập nhật.");
            window.location.reload();
        } catch (error) {
            toast.error("Không thể cập nhật cài đặt nền.");
        }
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            await axios.delete(`${API_URL}/delete`, {
                headers: { Authorization: `Bearer ${cookies.jwt_token}` },
                withCredentials: true,
            });
            removeCookie("jwt_token", { path: "/" });
            toast.success("Tài khoản đã được xóa thành công.");
            navigate("/login");
        } catch (error) {
            toast.error("Không thể xóa tài khoản.");
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackgroundImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Cài đặt</h1>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FiGlobe className="mr-2" /> Ngôn ngữ
                </h2>
                <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                </select>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <FiImage className="mr-2" /> Tùy chỉnh nền
                </h2>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Loại nền:</label>
                    <select
                        value={backgroundType}
                        onChange={(e) => setBackgroundType(e.target.value as "color" | "image")}
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    >
                        <option value="color">Màu sắc</option>
                        <option value="image">Hình ảnh</option>
                    </select>
                </div>
                {backgroundType === "color" ? (
                    <div className="mb-4">
                        <label className="block mb-2 font-medium">Màu nền:</label>
                        <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-20 h-10 border rounded-lg"
                        />
                    </div>
                ) : (
                    <div className="mb-4">
                        <label className="block mb-2 font-medium">Hình nền:</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="w-full p-2 border rounded-lg"
                        />
                        {backgroundImage && (
                            <img
                                src={backgroundImage}
                                alt="Preview"
                                className="mt-4 w-32 h-32 object-cover rounded-lg"
                            />
                        )}
                    </div>
                )}
                <button
                    onClick={handleBackgroundChange}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                    Lưu cài đặt nền
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-red-600">
                    <FiTrash2 className="mr-2" /> Xóa tài khoản
                </h2>
                <p className="mb-4 text-gray-600">
                    Hành động này không thể hoàn tác. Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.
                </p>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                    Xóa tài khoản
                </button>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Xác nhận xóa tài khoản</h3>
                        <p className="mb-6 text-gray-600">
                            Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className={`bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 ${
                                    loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                            >
                                {loading ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Setting;