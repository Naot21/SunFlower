import React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiTrash2, FiShoppingBag, FiHeart } from "react-icons/fi";
import { useCookies } from "react-cookie";

interface Favorite {
    favoriteId: number;
    productId: number;
    productName: string;
    productPrice?: number;
    createdAt: string;
    images?: string[];
    inStock?: boolean; // Thêm trường để hiển thị trạng thái tồn kho
}

interface User {
    id: number;
    email: string;
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [cookies, , removeCookie] = useCookies(["jwt_token"]);
    const token = cookies.jwt_token;
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

    useEffect(() => {
        if (!token) {
            toast.error(
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>Vui lòng đăng nhập để xem danh sách yêu thích</span>
                </div>,
                { position: "top-right", autoClose: 3000 }
            );
            navigate("/login");
            setLoading(false);
            return;
        }

        // Lấy thông tin người dùng
        const fetchUser = async () => {
            try {
                const response = await axios.get(`${API_URL}/auth/user`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
                setUser({ id: response.data.id, email: response.data.email });
            } catch (err: any) {
                console.error("Error fetching user:", err);
                toast.error(
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>Không thể lấy thông tin người dùng</span>
                    </div>,
                    { position: "top-right", autoClose: 3000 }
                );
                if (err.response?.status === 401) {
                    removeCookie("jwt_token", { path: "/" });
                    setUser(null);
                    navigate("/login");
                }
                setLoading(false);
            }
        };

        fetchUser();
    }, [token, navigate, removeCookie]);

    useEffect(() => {
        if (!user) return;

        const loadFavorites = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/favorites/user/${user.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
                setFavorites(response.data);
            } catch (err: any) {
                console.error("Error loading favorites:", err);
                toast.error(
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>Không thể tải danh sách yêu thích</span>
                    </div>,
                    { position: "top-right", autoClose: 3000 }
                );
                if (err.response?.status === 401) {
                    removeCookie("jwt_token", { path: "/" });
                    setUser(null);
                    navigate("/login");
                    toast.error(
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.</span>
                        </div>,
                        { position: "top-right", autoClose: 3000 }
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        loadFavorites();
    }, [user, token, navigate, removeCookie]);

    const handleRemoveFromFavorites = async (favoriteId: number) => {
        if (!token) {
            toast.error(
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>Vui lòng đăng nhập để xóa sản phẩm khỏi danh sách yêu thích</span>
                </div>,
                { position: "top-right", autoClose: 3000 }
            );
            navigate("/login");
            return;
        }

        try {
            await axios.delete(`${API_URL}/favorites/${favoriteId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            const updatedFavorites = favorites.filter((item) => item.favoriteId !== favoriteId);
            setFavorites(updatedFavorites);
            toast.info(
                <div className="flex items-center">
                    <FiTrash2 className="mr-2 text-lg" />
                    <span>Đã xóa sản phẩm khỏi danh sách yêu thích</span>
                </div>,
                { position: "top-right", autoClose: 3000 }
            );
        } catch (err: any) {
            console.error("Error removing favorite:", err);
            toast.error(
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>Không thể xóa sản phẩm khỏi danh sách yêu thích</span>
                </div>,
                { position: "top-right", autoClose: 3000 }
            );
            if (err.response?.status === 401) {
                removeCookie("jwt_token", { path: "/" });
                setUser(null);
                navigate("/login");
                toast.error(
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span>Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.</span>
                    </div>,
                    { position: "top-right", autoClose: 3000 }
                );
            }
        }
    };

    const handleAddToCart = (favorite: Favorite) => {
        if (favorite.inStock === false) {
            toast.error(
                <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>Sản phẩm hiện đã hết hàng</span>
                </div>,
                { position: "top-right", autoClose: 3000 }
            );
            return;
        }

        const cartItem = {
            id: favorite.productId.toString(),
            name: favorite.productName,
            price: favorite.productPrice || 0,
            quantity: 1,
            images: favorite.images || [],
            categoryName: "",
            inStock: favorite.inStock !== false,
        };

        const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
        const existingItemIndex = existingCart.findIndex((item: { id: string }) => item.id === cartItem.id);

        if (existingItemIndex >= 0) {
            existingCart[existingItemIndex].quantity += 1;
        } else {
            existingCart.push(cartItem);
        }

        localStorage.setItem("cart", JSON.stringify(existingCart));

        toast.success(
            <div className="flex items-center">
                <FiShoppingBag className="mr-2 text-lg" />
                <span>Đã thêm sản phẩm vào giỏ hàng</span>
            </div>,
            { position: "top-right", autoClose: 3000 }
        );
    };

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = "https://via.placeholder.com/150";
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                    <p className="text-gray-600">Đang tải danh sách yêu thích...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Danh sách yêu thích</h1>
                <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                    Tiếp tục mua sắm
                </Link>
            </div>

            {favorites.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="text-red-500 text-6xl mb-4">
                        <FiHeart className="mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold mb-4">Danh sách yêu thích trống</h2>
                    <p className="text-gray-600 mb-6">Bạn chưa thêm sản phẩm nào vào danh sách yêu thích.</p>
                    <Link
                        to="/#products"
                        className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 inline-block transition duration-200"
                    >
                        Khám phá sản phẩm
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {favorites.map((favorite) => (
                        <div
                            key={favorite.favoriteId}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md overflow-hidden transition-all duration-300 border border-gray-100"
                        >
                            <Link to={`/products/${favorite.productId}`} className="block relative overflow-hidden h-48">
                                <img
                                    src={favorite.images?.[0] || "https://via.placeholder.com/150"}
                                    alt={favorite.productName}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                    onError={handleImageError}
                                />
                                {favorite.inStock === false && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                        Hết hàng
                                    </div>
                                )}
                            </Link>

                            <div className="p-4">
                                <Link to={`/products/${favorite.productId}`} className="block">
                                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 h-12">{favorite.productName}</h3>
                                    <div className="font-bold text-gray-900 mb-4">
                                        {typeof favorite.productPrice === "number" ? favorite.productPrice.toLocaleString() : "N/A"}đ
                                    </div>
                                </Link>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAddToCart(favorite)}
                                        disabled={favorite.inStock === false}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                                            favorite.inStock === false
                                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                : "bg-gray-900 text-white hover:bg-gray-800"
                                        }`}
                                    >
                                        <FiShoppingBag className="text-lg" />
                                        <span>Thêm vào giỏ</span>
                                    </button>

                                    <button
                                        onClick={() => handleRemoveFromFavorites(favorite.favoriteId)}
                                        className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 hover:text-red-500 transition-colors"
                                    >
                                        <FiTrash2 className="text-lg" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}