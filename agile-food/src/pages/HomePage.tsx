import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiMenu, FiShoppingBag, FiSearch, FiChevronRight } from "react-icons/fi";
import { useCookies } from "react-cookie";

interface Category {
  categoryId: string;
  name: string;
  img?: string;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  categoryName: string;
  inStock: boolean;
  images: string[];
  createdAt: string;
  quantity: number;
}

interface CartItem extends Product {
  quantity: number;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [showCategories, setShowCategories] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const [cookies] = useCookies(["jwt_token"]);
  const token = cookies.jwt_token;
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/categories/all`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        setCategories(response.data);
        setError(null);
      } catch (err: any) {
        setError("Không thể tải danh mục sản phẩm");
        if (err.response?.status === 401) {
          setError("Vui lòng đăng nhập để xem danh mục.");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [token]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = `${API_URL}/products`;
      const params = new URLSearchParams();

      if (search) {
        params.append("search", search);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });
      setProducts(response.data);
    } catch (err: any) {
      setError("Không thể tải danh liệt sản phẩm");
      if (err.response?.status === 401) {
        setError("Vui lòng đăng nhập để xem sản phẩm.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, token]);

  useEffect(() => {
    if (location.hash === "#products" && productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  const handleAddToCart = async (product: Product, quantityToAdd = 1) => {
    try {
      // Check if user is authenticated
      if (!token) {
        toast.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.", {
          position: "top-right",
          autoClose: 3000,
        });
        navigate("/login");
        return;
      }

      // Verify token by making a request to a protected endpoint
      await axios.get(`${API_URL}/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      // Check stock availability
      const response = await axios.get(`${API_URL}/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      const inStock = response.data.quantity;

      if (quantityToAdd > inStock) {
        toast.error(
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 0 101.414 1.414L10 11.414l1.293 1.293a1 0 001.414-1.414L11.414 10l1.293-1.293a1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {`Sản phẩm "${product.name}" chỉ còn ${inStock} đơn vị trong kho.`}
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
        return;
      }

      const cartItem: CartItem = {
        ...product,
        quantity: quantityToAdd,
      };

      const existingCart: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
      const existingItemIndex = existingCart.findIndex((item) => item.id === product.id);

      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].quantity += quantityToAdd;
      } else {
        existingCart.push(cartItem);
      }

      localStorage.setItem("cart", JSON.stringify(existingCart));

      toast.success(
        <div className="flex items-center">
          <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 0 00-1.414 1.414l2 2a1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {product.name} (x{quantityToAdd}) đã được thêm vào giỏ hàng!
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
    } catch (err: any) {
      let errorMessage = "Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại!";
      if (err.response?.status === 401) {
        errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
        navigate("/login");
      } else if (err.response?.status === 403) {
        errorMessage = "Bạn không có quyền thêm sản phẩm vào giỏ hàng.";
        navigate("/login");
      }
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
      });
      console.error(err);
    }
  };

  const filteredProducts = products.filter((product) =>
    selectedCategory === "Tất cả" ? true : product.categoryName === selectedCategory
  );

  const categoryCounts = products.reduce((acc: Record<string, number>, product) => {
    acc[product.categoryName] = (acc[product.categoryName] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white">
      <ToastContainer />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1563379926898-05f4575a45d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Background"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Đồ ăn vặt ngon, chất lượng cao
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl">
              Khám phá các loại đồ ăn vặt ngon miệng, chất lượng cao với giá cả phải chăng. Giao hàng nhanh chóng đến tận nhà bạn.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#products"
                className="bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors duration-300 inline-flex items-center"
              >
                <FiShoppingBag className="mr-2" />
                Xem sản phẩm
              </a>
              <Link
                to="/gioi-thieu"
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-full font-medium hover:bg-white hover:text-gray-900 transition-colors duration-300 inline-flex items-center"
              >
                Tìm hiểu thêm
                <FiChevronRight className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Danh mục nổi bật</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Khám phá các danh mục đồ ăn vặt đa dạng của chúng tôi, từ đồ ngọt đến đồ mặn, từ đồ khô đến đồ tươi
            </p>
          </div>

          {loading && categories.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : error && categories.length === 0 ? (
            <div className="text-center p-8 bg-red-50 rounded-xl text-red-600 max-w-md mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mx-auto mb-3"
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
              <p className="font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.slice(0, 6).map((category) => (
                <div
                  key={category.categoryId}
                  className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
                  <img
                    src={
                      category.img || "https://via.placeholder.com/300x200?text=" + category.name || "/placeholder.svg"
                    }
                    alt={category.name}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                    <p className="text-gray-200 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {category.description || "Khám phá các sản phẩm trong danh mục này"}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory(category.name);
                        if (productsRef.current) {
                          productsRef.current.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="text-white bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full hover:bg-white hover:text-gray-900 transition-colors duration-300 inline-flex items-center"
                    >
                      Xem sản phẩm
                      <FiChevronRight className="ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {categories.length > 6 && (
            <div className="text-center mt-10">
              <button
                onClick={() => {
                  if (productsRef.current) {
                    productsRef.current.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors"
              >
                Xem tất cả danh mục
                <FiChevronRight className="ml-2" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section ref={productsRef} id="products" className="py-16">
        <div className="container mx-auto px-4 relative">
          {/* Category filter */}
          <div ref={categoryMenuRef} className="relative mb-8 z-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  aria-label="Hiển thị danh mục"
                >
                  <FiMenu className="text-xl" />
                  <span className="font-medium">Danh mục</span>
                </button>
                {selectedCategory !== "Tất cả" && (
                  <div className="ml-4 flex items-center">
                    <span className="text-gray-500">Đang lọc:</span>
                    <span className="ml-2 px-3 py-1 bg-gray-900 text-white rounded-full text-sm flex items-center">
                      {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("Tất cả")}
                        className="ml-2 text-white hover:text-gray-200"
                        aria-label="Xóa bộ lọc"
                      >
                        ×
                      </button>
                    </span>
                  </div>
                )}
              </div>

              <div className="relative">
                <Link
                  to={search ? "/" : "/search"}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <FiSearch className="text-xl" />
                  <span className="font-medium">{search ? "Xóa tìm kiếm" : "Tìm kiếm"}</span>
                </Link>
              </div>
            </div>

            {showCategories && (
              <div className="absolute top-full left-0 mt-2 bg-white border rounded-lg shadow-xl p-4 w-64 max-h-96 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-3 pb-2 border-b">Danh mục sản phẩm</h2>
                <button
                  onClick={() => {
                    setSelectedCategory("Tất cả");
                    setShowCategories(false);
                  }}
                  className={`flex items-center justify-between w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 ${
                    selectedCategory === "Tất cả" ? "bg-gray-100 font-medium" : ""
                  }`}
                >
                  <span>Tất cả sản phẩm</span>
                  <span className="text-sm text-gray-500">{products.length}</span>
                </button>
                {categories.map((category) => {
                  const count = categoryCounts[category.name] || 0;
                  return (
                    <button
                      key={category.categoryId}
                      onClick={() => {
                        setSelectedCategory(category.name);
                        setShowCategories(false);
                      }}
                      className={`flex items-center justify-between w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 ${
                        selectedCategory === category.name ? "bg-gray-100 font-medium" : ""
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className="text-sm text-gray-500">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <h2 className="text-3xl font-bold text-center mb-8">
            {search
              ? `Kết quả tìm kiếm cho "${search}"`
              : selectedCategory !== "Tất cả"
              ? `Sản phẩm thuộc danh mục "${selectedCategory}"`
              : "Tất cả sản phẩm"}
          </h2>

          {loading && products.length === 0 ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : error && products.length === 0 ? (
            <div className="text-center p-8 bg-red-50 rounded-xl text-red-600 max-w-md mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 mx-auto mb-3"
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
              <p className="font-medium">{error}</p>
              <button
                onClick={() => fetchProducts()}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-400 mb-4"
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
                  <h3 className="text-xl font-semibold mb-2">Không tìm thấy sản phẩm nào</h3>
                  <p className="text-gray-500 mb-6">
                    {search
                      ? `Không tìm thấy sản phẩm nào phù hợp với từ khóa "${search}"`
                      : "Không có sản phẩm nào trong danh mục này"}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("Tất cả");
                      if (search) {
                        window.location.href = "/";
                      }
                    }}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Xem tất cả sản phẩm
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group bg-white rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-all duration-300 border border-gray-100"
                    >
                      <div className="relative overflow-hidden h-56">
                        <img
                          src={product.images[0] || "https://via.placeholder.com/150"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {(!product.inStock || product.quantity === 0) && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            Hết hàng
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="bg-gray-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                            {product.categoryName || "Chưa phân loại"}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <Link to={`/products/${product.id}`} className="block group-hover:text-gray-700">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 h-14">{product.name}</h3>
                        </Link>
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-xl">{product.price.toLocaleString()}đ</span>
                          <span className="text-sm text-gray-500">
                            Còn {product.quantity !== undefined ? product.quantity : "?"} sản phẩm
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToCart(product, 1)}
                          className={`w-full py-2 rounded-lg text-white flex items-center justify-center transition-colors ${
                            product.quantity === 0 || !product.inStock
                              ? "bg-gray-300 cursor-not-allowed"
                              : "bg-gray-900 hover:bg-gray-800"
                          }`}
                          disabled={product.quantity === 0 || !product.inStock}
                        >
                          <FiShoppingBag className="mr-2" />
                          {product.quantity === 0 || !product.inStock ? "Hết hàng" : "Thêm vào giỏ"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Tại sao chọn chúng tôi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
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
              <h3 className="text-xl font-semibold mb-2">Giao hàng nhanh chóng</h3>
              <p className="text-gray-600">
                Chúng tôi cam kết giao hàng trong vòng 24 giờ kể từ khi đơn hàng được xác nhận.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Chất lượng đảm bảo</h3>
              <p className="text-gray-600">
                Tất cả sản phẩm của chúng tôi đều được kiểm tra chất lượng nghiêm ngặt trước khi giao đến tay bạn.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
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
              </div>
              <h3 className="text-xl font-semibold mb-2">Đa dạng sản phẩm</h3>
              <p className="text-gray-600">
                Chúng tôi cung cấp hàng trăm loại đồ ăn vặt khác nhau, đáp ứng mọi nhu cầu và sở thích của bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Đăng ký nhận thông tin</h2>
            <p className="text-gray-300 mb-8">
              Đăng ký để nhận thông tin về sản phẩm mới, khuyến mãi đặc biệt và các ưu đãi độc quyền.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-grow px-4 py-3 rounded-lg focus:outline-none text-gray-900"
              />
              <button className="bg-white text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}