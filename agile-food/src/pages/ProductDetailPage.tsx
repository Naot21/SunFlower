import type React from "react";
import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiShoppingBag, FiHeart, FiShare2, FiChevronRight, FiMinus, FiPlus, FiArrowLeft, FiCheck } from "react-icons/fi";
import { useCookies } from "react-cookie";

interface ReviewMediaResponse {
  mediaId: number;
  mediaUrl: string;
}

interface ReviewResponse {
  reviewId: number;
  userId: number;
  userName: string;
  productId: number;
  orderId: number;
  rating: number;
  comment: string;
  createdAt: string;
  media: ReviewMediaResponse[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: number;
  categoryName: string;
  inStock: boolean;
  images: string[];
  createdAt: string;
  quantity: number;
  description?: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface User {
  id: number;
  email: string;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "reviews">("description");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [cookies, , removeCookie] = useCookies(["jwt_token"]);
  const token = cookies.jwt_token;
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setUser({ id: response.data.id, email: response.data.email });
    } catch (err: any) {
      console.error("Error fetching user:", err);
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

  const fetchFavoriteStatus = async () => {
    if (!user || !id) return;
    try {
      const response = await axios.get(`${API_URL}/favorites/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const favorites = response.data;
      const favorite = favorites.find((fav: any) => fav.productId === parseInt(id));
      if (favorite) {
        setIsFavorite(true);
        setFavoriteId(favorite.favoriteId);
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (err: any) {
      console.error("Error fetching favorite status:", err);
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

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/products/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      const fetchedProduct = response.data;
      setProduct(fetchedProduct);
      setSelectedImage(fetchedProduct.images[0] || "https://via.placeholder.com/150");

      if (fetchedProduct.categoryId && fetchedProduct.id) {
        fetchRelatedProducts(fetchedProduct.categoryId, fetchedProduct.id);
      }
    } catch (err: any) {
      setError("Không thể tải chi tiết sản phẩm");
      if (err.response?.status === 401) {
        setError("Vui lòng đăng nhập để xem chi tiết sản phẩm.");
        setTimeout(() => navigate("/login"), 1500);
      } else if (err.response?.status === 404) {
        setError("Sản phẩm không tồn tại.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const response = await axios.get(`${API_URL}/reviews/product/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      setReviews(response.data);
      if (response.data.length === 0) {
        setReviewsError("Chưa có đánh giá nào cho sản phẩm này.");
      }
    } catch (err: any) {
      setReviewsError("Không thể tải đánh giá. Vui lòng thử lại sau.");
      if (err.response?.status === 401) {
        setReviewsError("Vui lòng đăng nhập để xem đánh giá.");
      } else if (err.response?.status === 404) {
        setReviewsError("Không tìm thấy đánh giá cho sản phẩm này.");
      }
      console.error("Error fetching reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchRelatedProducts = async (categoryId: number, excludeId: string) => {
    try {
      const response = await axios.get(`${API_URL}/products/related`, {
        params: {
          categoryId,
          excludeId,
          limit: 4,
        },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });

      const products = response.data;
      if (products.length === 0) {
        setRelatedProducts([]);
        toast.info(
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>Không tìm thấy sản phẩm liên quan trong danh mục này.</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
        );
        return;
      }

      setRelatedProducts(products);
    } catch (err: any) {
      console.error("Không thể tải sản phẩm liên quan:", err);
      setRelatedProducts([]);
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
      } else {
        toast.error(
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>Không thể tải sản phẩm liên quan. Vui lòng thử lại sau.</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
        );
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!token || !user) {
      toast.error(
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích</span>
        </div>,
        { position: "top-right", autoClose: 3000 }
      );
      navigate("/login");
      return;
    }

    try {
      if (isFavorite) {
        await axios.delete(`${API_URL}/favorites/delete/${favoriteId}`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setIsFavorite(false);
        setFavoriteId(null);
        toast.info(
          <div className="flex items-center">
            <FiHeart className="mr-2 text-lg" />
            <span>Đã xóa sản phẩm khỏi danh sách yêu thích</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
        );
      } else {
        const response = await axios.post(
          `${API_URL}/favorites/create`,
          {
            userId: user.id,
            productId: parseInt(id!),
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setIsFavorite(true);
        setFavoriteId(response.data.favoriteId);
        toast.success(
          <div className="flex items-center">
            <FiHeart className="mr-2 text-lg text-red-500" />
            <span>Đã thêm sản phẩm vào danh sách yêu thích</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
        );
      }
    } catch (err: any) {
      console.error("Error toggling favorite:", err);
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
      } else {
        toast.error("Không thể thay đổi trạng thái yêu thích");
      }
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    }
    fetchProduct();
    fetchReviews();
    setQuantity(1);
  }, [id, token]);

  useEffect(() => {
    if (user && id) {
      fetchFavoriteStatus();
    }
  }, [user, id]);

  const increaseQuantity = () => {
    if (product && quantity < product.quantity) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = async () => {
    if (!product || !product.inStock || product.quantity === 0) return;

    try {
      // Kiểm tra số lượng tồn kho
      const response = await axios.get(`${API_URL}/products/${product.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      const inStock = response.data.quantity;

      if (quantity > inStock) {
        toast.error(
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{`Sản phẩm "${product.name}" chỉ còn ${inStock} đơn vị trong kho.`}</span>
          </div>,
          { position: "top-right", autoClose: 3000 }
        );
        return;
      }

      setIsAddingToCart(true);

      const cartItem: CartItem = {
        ...product,
        quantity: quantity,
      };

      const existingCart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItemIndex = existingCart.findIndex((item) => item.id === product.id);

      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].quantity += quantity;
      } else {
        existingCart.push(cartItem);
      }

      localStorage.setItem("cart", JSON.stringify(existingCart));

      toast.success(
        <div className="flex items-center">
          <FiCheck className="mr-2 text-lg" />
          <span>
            Đã thêm <strong>{quantity}</strong> {product.name} vào giỏ hàng!
          </span>
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

      setTimeout(() => {
        setIsAddingToCart(false);
      }, 1000);
    } catch (err: any) {
      toast.error("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!", {
        position: "top-right",
        autoClose: 3000,
      });
      console.error(err);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://via.placeholder.com/150";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-red-500 mx-auto mb-4"
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
          <h2 className="text-2xl font-bold mb-4">Không thể tải sản phẩm</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => fetchProduct()}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Thử lại
            </button>
            <Link to="/" className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-gray-400 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy sản phẩm</h2>
          <p className="text-gray-600 mb-6">Sản phẩm này không tồn tại hoặc đã bị xóa.</p>
          <Link
            to="/"
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors inline-block"
          >
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = !product.inStock || product.quantity === 0;

  return (
    <div className="bg-white">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link to="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <FiArrowLeft className="mr-2" />
              <span>Quay lại trang chủ</span>
            </Link>

            <nav className="flex items-center space-x-1 text-sm text-gray-500">
              <Link to="/" className="hover:text-gray-900 transition-colors">
                Trang chủ
              </Link>
              <FiChevronRight className="h-4 w-4" />
              <Link to="/san-pham" className="hover:text-gray-900 transition-colors">
                Sản phẩm
              </Link>
              <FiChevronRight className="h-4 w-4" />
              <Link
                to={`/san-pham/${product.categoryName.toLowerCase().replace(/\s+/g, "-")}`}
                className="hover:text-gray-900 transition-colors"
              >
                {product.categoryName}
              </Link>
              <FiChevronRight className="h-4 w-4" />
              <span className="text-gray-900 font-medium truncate max-w-[150px]">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          <div>
            <div className="mb-4 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt={product.name}
                className="w-full h-[400px] object-contain p-4"
                onError={handleImageError}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  className={`border rounded-lg overflow-hidden transition-all ${
                    image === selectedImage
                      ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-20 object-cover"
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                  {product.categoryName}
                </span>
                {isOutOfStock ? (
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">Hết hàng</span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Còn hàng
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-gray-900">{product.price.toLocaleString()}đ</span>
                {product.price > 100000 && (
                  <span className="text-lg text-gray-500 line-through">{(product.price * 1.1).toLocaleString()}đ</span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <span>Số lượng tồn kho:</span>
                <span className="font-medium">{product.quantity}</span>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-gray-700 leading-relaxed">
                {product.description || "Chưa có mô tả chi tiết về sản phẩm này."}
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="mb-6">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng
                </label>
                <div className="flex items-center">
                  <button
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || isOutOfStock}
                    className={`flex items-center justify-center w-10 h-10 rounded-l-lg border border-r-0 ${
                      quantity <= 1 || isOutOfStock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FiMinus />
                  </button>
                  <input
                    type="number"
                    id="quantity"
                    value={quantity}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value);
                      //tùy chỉnh số lượng
                      if (!isNaN(value) && value >= 1 && value ) {
                        setQuantity(value);
                      }
                      // 
                    }}
                    min="1"
                    max={product.quantity}
                    disabled={isOutOfStock}
                    className="w-16 h-10 border-y text-center focus:outline-none focus:ring-0 disabled:bg-gray-100"
                  />
                  <button
                    onClick={increaseQuantity}
                    disabled={quantity >= product.quantity || isOutOfStock}
                    className={`flex items-center justify-center w-10 h-10 rounded-r-lg border border-l-0 ${
                      quantity >= product.quantity || isOutOfStock
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAddingToCart}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    isOutOfStock
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : isAddingToCart
                      ? "bg-green-600 text-white"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {isAddingToCart ? (
                    <>
                      <FiCheck className="text-lg" />
                      Đã thêm vào giỏ
                    </>
                  ) : (
                    <>
                      <FiShoppingBag className="text-lg" />
                      {isOutOfStock ? "Hết hàng" : "Thêm vào giỏ hàng"}
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg transition-colors ${
                      isFavorite ? "bg-red-100 text-red-500" : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <FiHeart className={`text-lg ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <FiShare2 className="text-lg" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Cam kết chất lượng</h3>
                  <p className="text-sm text-gray-600">Sản phẩm chính hãng, đảm bảo chất lượng</p>
                </div>
              </div>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
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
                </div>
                <div>
                  <h3 className="font-medium">Giao hàng nhanh chóng</h3>
                  <p className="text-sm text-gray-600">Giao hàng trong vòng 24h đối với nội thành</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <div className="border-b border-gray-200 mb-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("description")}
                className={`pb-4 font-medium text-sm transition-colors ${
                  activeTab === "description"
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Mô tả sản phẩm
              </button>
              <button
                onClick={() => setActiveTab("specifications")}
                className={`pb-4 font-medium text-sm transition-colors ${
                  activeTab === "specifications"
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Thông tin sản phẩm
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`pb-4 font-medium text-sm transition-colors ${
                  activeTab === "reviews"
                    ? "border-b-2 border-gray-900 text-gray-900"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Đánh giá
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            {activeTab === "description" ? (
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-4">Mô tả chi tiết</h3>
                {product.description ? (
                  <div className="text-gray-700 leading-relaxed">
                    <p>{product.description}</p>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-500 italic">
                    Chưa có mô tả chi tiết cho sản phẩm này.
                  </div>
                )}
              </div>
            ) : activeTab === "specifications" ? (
              <div>
                <h3 className="text-xl font-semibold mb-4">Thông số kỹ thuật</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 divide-y divide-gray-200">
                    <div className="grid grid-cols-3 p-4 bg-gray-50">
                      <div className="font-medium">Tên sản phẩm</div>
                      <div className="col-span-2">{product.name}</div>
                    </div>
                    <div className="grid grid-cols-3 p-4">
                      <div className="font-medium">Danh mục</div>
                      <div className="col-span-2">{product.categoryName}</div>
                    </div>
                    <div className="grid grid-cols-3 p-4 bg-gray-50">
                      <div className="font-medium">Giá bán</div>
                      <div className="col-span-2">{product.price.toLocaleString()}đ</div>
                    </div>
                    <div className="grid grid-cols-3 p-4">
                      <div className="font-medium">Số lượng tồn kho</div>
                      <div className="col-span-2">{product.quantity}</div>
                    </div>
                    <div className="grid grid-cols-3 p-4 bg-gray-50">
                      <div className="font-medium">Trạng thái</div>
                      <div className="col-span-2">
                        {isOutOfStock ? (
                          <span className="text-red-600">Hết hàng</span>
                        ) : (
                          <span className="text-green-600">Còn hàng</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 p-4">
                      <div className="font-medium">Ngày cập nhật</div>
                      <div className="col-span-2">{new Date(product.createdAt).toLocaleDateString("vi-VN")}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold mb-4">Đánh giá sản phẩm</h3>
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                    <span className="ml-2 text-gray-600">Đang tải đánh giá...</span>
                  </div>
                ) : reviewsError ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-500 italic">{reviewsError}</div>
                ) : reviews.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-500 italic">
                    Chưa có đánh giá nào cho sản phẩm này.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.reviewId} className="border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-800">{review.userName}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-lg ${
                                  star <= review.rating ? "text-yellow-400" : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{review.comment || "Không có bình luận."}</p>
                        {review.media && review.media.length > 0 && (
                          <div className="flex gap-2 flex-wrap mb-2">
                            {review.media.map((media) => (
                              <a
                                key={media.mediaId}
                                href={media.mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block"
                              >
                                {media.mediaUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                                  <img
                                    src={media.mediaUrl}
                                    alt="Review media"
                                    className="w-20 h-20 object-cover rounded-md border border-gray-200"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <video
                                    src={media.mediaUrl}
                                    className="w-20 h-20 object-cover rounded-md border border-gray-200"
                                    controls
                                  />
                                )}
                              </a>
                            ))}
                          </div>
                        )}
                        <p className="text-gray-500 text-xs">
                          {new Date(review.createdAt).toLocaleDateString("vi-VN")} -{" "}
                          {new Date(review.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/products/${relatedProduct.id}`}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-300 border border-gray-100"
                >
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={relatedProduct.images[0] || "https://via.placeholder.com/150"}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={handleImageError}
                    />
                    {(!relatedProduct.inStock || relatedProduct.quantity === 0) && (
                      <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        Hết hàng
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2 h-12">{relatedProduct.name}</h3>
                    <p className="text-gray-500 text-sm mb-2">{relatedProduct.categoryName}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{relatedProduct.price.toLocaleString()}đ</span>
                      <span className="text-sm text-gray-500">
                        Còn {relatedProduct.quantity !== undefined ? relatedProduct.quantity : "?"} sản phẩm
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}