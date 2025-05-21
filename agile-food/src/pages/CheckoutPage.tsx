import type React from "react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useCookies } from "react-cookie";

interface Address {
  addressId: number;
  address: string;
  city: string;
  postalCode: string;
  createdAt: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  images: string[];
  inStock?: number;
}

interface User {
  fullName: string;
  email: string;
  phone: string;
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [useManualAddress, setUseManualAddress] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    city: "",
    paymentMethod: "cod",
    note: "",
    couponCode: "",
  });
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponId, setCouponId] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [cookies] = useCookies(["jwt_token"]);
  const token = cookies.jwt_token;

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);

    // Fetch user information from /auth/me
    const fetchUserInfo = async () => {
      try {
        if (!token) {
          toast.error("Vui lòng đăng nhập để tiếp tục thanh toán.", {
            position: "top-right",
            autoClose: 3000,
          });
          navigate("/login");
          return;
        }

        const userResponse = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        const user: User = userResponse.data;
        setFormData((prev) => ({
          ...prev,
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
        }));
      } catch (err: any) {
        console.error("Lỗi khi lấy thông tin người dùng:", err);
        if (err.response?.status === 401 || err.response?.data?.error === "Không tìm thấy người dùng") {
          toast.error("Phiên đăng nhập hết hạn hoặc không tìm thấy người dùng. Vui lòng đăng nhập lại.", {
            position: "top-right",
            autoClose: 3000,
          });
          navigate("/login");
        } else {
          toast.error("Không thể tải thông tin người dùng. Vui lòng thử lại.", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      }
    };

    // Fetch addresses
    const fetchAddresses = async () => {
      try {
        if (!token) return;

        const res = await axios.get(`${API_URL}/address`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        const formattedAddresses = res.data.map((addr: any) => ({
          addressId: addr.addressId,
          address: addr.address,
          city: addr.city,
          postalCode: addr.postalCode || "",
          createdAt: addr.createdAt,
        }));

        setAddresses(formattedAddresses);

        // Check if there’s a selected address in localStorage
        const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress") || "{}");
        if (selectedAddress.addressId) {
          setSelectedAddressId(selectedAddress.addressId);
          setFormData((prev) => ({
            ...prev,
            address: selectedAddress.address,
            city: selectedAddress.city,
            district: selectedAddress.postalCode, // Assume postalCode is district
          }));
          setUseManualAddress(false);
        }
      } catch (err: any) {
        console.error("Lỗi khi lấy địa chỉ:", err);
        toast.error("Không thể tải danh sách địa chỉ.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    fetchUserInfo();
    fetchAddresses();
  }, [token, navigate]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const addressId = Number.parseInt(e.target.value);
    setSelectedAddressId(addressId);

    if (addressId === 0) {
      setUseManualAddress(true);
      setFormData((prev) => ({
        ...prev,
        address: "",
        district: "",
        city: "",
      }));
    } else {
      setUseManualAddress(false);
      const selected = addresses.find((addr) => addr.addressId === addressId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          address: selected.address,
          district: selected.postalCode,
          city: selected.city,
        }));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "/placeholder-product.jpg";
  };

  const applyCoupon = async () => {
    if (!formData.couponCode) {
      toast.error("Vui lòng nhập mã coupon!");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/coupons/validate?code=${formData.couponCode}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });

      if (response.status === 200) {
        const coupon = response.data;
        setCouponId(coupon.couponId);
        setDiscountPercentage(coupon.discountPercentage);
        setCouponApplied(true);
        const discount = (subtotal * coupon.discountPercentage) / 100;
        toast.success(
          `Áp dụng mã coupon thành công! Giảm giá ${coupon.discountPercentage}% (Tiết kiệm ${discount.toLocaleString()}đ)`,
          { position: "top-right", autoClose: 3000 }
        );
      }
    } catch (error: any) {
      console.error("Lỗi khi áp dụng mã coupon:", error);
      toast.error("Mã coupon không hợp lệ hoặc đã hết hạn!", { position: "top-right", autoClose: 3000 });
      setCouponId(null);
      setDiscountPercentage(0);
      setCouponApplied(false);
    }
  };

  const removeCoupon = () => {
    setCouponId(null);
    setDiscountPercentage(0);
    setCouponApplied(false);
    setFormData((prev) => ({
      ...prev,
      couponCode: "",
    }));
    toast.info("Đã hủy áp dụng mã coupon!", { position: "top-right", autoClose: 3000 });
  };

  const validateForm = () => {
    if (!formData.fullName) return "Vui lòng nhập họ và tên.";
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) return "Vui lòng nhập email hợp lệ.";
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) return "Vui lòng nhập số điện thoại hợp lệ (10 chữ số).";
    if (!formData.address) return "Vui lòng nhập địa chỉ.";
    if (!formData.district) return "Vui lòng nhập mã bưu điện.";
    if (!formData.city) return "Vui lòng chọn tỉnh/thành phố.";

    // Validate address against selectedAddress in localStorage
    const selectedAddress = JSON.parse(localStorage.getItem("selectedAddress") || "{}");
    if (selectedAddress.addressId) {
      const fullAddress = `${formData.address}, ${formData.district}, ${formData.city}`;
      const storedAddress = `${selectedAddress.address}, ${selectedAddress.postalCode}, ${selectedAddress.city}`;
      if (fullAddress !== storedAddress) {
        return (
          <div>
            Địa chỉ nhập vào không khớp với địa chỉ đã chọn. Vui lòng sử dụng địa chỉ:
            <br />
            <strong>{storedAddress}</strong>
            <br />
            hoặc cập nhật địa chỉ trong hồ sơ.
          </div>
        );
      }
    }

    return null;
  };

  const checkStockAvailability = async () => {
    try {
      const outOfStockItems: { name: string; inStock: number; requested: number }[] = [];

      for (const item of cartItems) {
        const response = await axios.get(`${API_URL}/products/${item.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        const inStock = response.data.quantity;
        if (item.quantity > inStock) {
          outOfStockItems.push({ name: item.name, inStock, requested: item.quantity });
        }
      }

      if (outOfStockItems.length > 0) {
        return (
          <div>
            <p>Các sản phẩm sau vượt quá số lượng tồn kho:</p>
            <ul className="list-disc pl-5">
              {outOfStockItems.map((item, index) => (
                <li key={index}>
                  {item.name}: Yêu cầu {item.requested}, chỉ còn {item.inStock} trong kho.
                </li>
              ))}
            </ul>
            <p>Vui lòng điều chỉnh số lượng.</p>
          </div>
        );
      }

      return null;
    } catch (error) {
      console.error("Lỗi khi kiểm tra số lượng tồn kho:", error);
      return "Không thể kiểm tra số lượng tồn kho. Vui lòng thử lại sau.";
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError, { position: "top-right", autoClose: 3000 });
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống, vui lòng thêm sản phẩm trước khi thanh toán!", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    // Check stock availability
    const stockError = await checkStockAvailability();
    if (stockError) {
      toast.error(stockError, { position: "top-right", autoClose: 3000 });
      return;
    }

    setIsSubmitting(true);

    const orderData = {
      userId: null,
      totalPrice: total,
      couponId: couponId,
      status: "pending",
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentMethod === "cod" ? "UNPAID" : "PAID",
      transactionId: formData.paymentMethod !== "cod" ? `TRANS-${Date.now()}` : null,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: `${formData.address}, ${formData.district}, ${formData.city}`,
      note: formData.note,
      orderDetails: cartItems.map((item) => ({
        productId: Number.parseInt(item.id),
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const response = await axios.post(`${API_URL}/checkout`, orderData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.status === 200) {
        const orderResponse = response.data;
        toast.success(
          <>
            <strong>Đã đặt hàng thành công!</strong>
            <br />
            Mã đơn hàng: {orderResponse.orderId}
          </>,
          { autoClose: 2000, position: "top-right" }
        );

        localStorage.removeItem("cart");
        localStorage.removeItem("selectedAddress");
        setCartItems([]);
        setTimeout(() => {
          navigate("/", { state: { order: orderResponse } });
        }, 3000);
      }
    } catch (error: any) {
      console.error("Lỗi khi đặt hàng:", error);
      if (error.response) {
        if (error.response.status === 403 || error.response.status === 401) {
          toast.error("Bạn cần đăng nhập để đặt hàng. Chuyển hướng đến trang đăng nhập...", {
            position: "top-right",
            autoClose: 2000,
          });
          setTimeout(() => navigate("/login"), 2000);
        } else if (error.response.status === 500) {
          toast.error("Lỗi server: Không thể xử lý đơn hàng. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          const errorMessage = error.response.data || `Lỗi ${error.response.status}: Có lỗi xảy ra khi đặt hàng.`;
          toast.error(errorMessage, { position: "top-right", autoClose: 3000 });
        }
      } else if (error.request) {
        toast.error(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc đảm bảo backend đang chạy trên cổng 8080!",
          { position: "top-right", autoClose: 3000 }
        );
      } else {
        toast.error("Đã xảy ra lỗi: " + error.message, { position: "top-right", autoClose: 3000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercentage) / 100;
  const shippingFee = subtotal > 200000 ? 0 : 30000;
  const total = subtotal - discountAmount + shippingFee;

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Thanh toán</h1>
          <Link to="/cart" className="text-sm text-gray-600 hover:text-black flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại giỏ hàng
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-xl font-semibold mb-4">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-600 mb-6">Vui lòng thêm sản phẩm vào giỏ hàng trước khi thanh toán.</p>
            <Link
              to="/#products"
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 inline-block transition duration-200"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <form onSubmit={handleSubmit} className="lg:w-2/3 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold mb-6 flex items-center">
                  <span className="bg-black text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-3">
                    1
                  </span>
                  Thông tin giao hàng
                </h2>

                {addresses.length > 0 && (
                  <div className="mb-6">
                    <label htmlFor="addressSelect" className="block text-sm font-medium text-gray-700 mb-1">
                      Chọn địa chỉ có sẵn
                    </label>
                    <select
                      id="addressSelect"
                      value={selectedAddressId || 0}
                      onChange={handleAddressChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value={0}>Nhập địa chỉ thủ công</option>
                      {addresses.map((addr) => (
                        <option key={addr.addressId} value={addr.addressId}>
                          {`${addr.address}, ${addr.city}${addr.postalCode ? `, ${addr.postalCode}` : ""}`}
                        </option>
                      ))}
                    </select>
                    <Link to="/address" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
                      Quản lý địa chỉ
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Nguyễn Văn A"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="example@gmail.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="098xxxxxxx"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!useManualAddress}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${
                        !useManualAddress ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="">-- Chọn Tỉnh/Thành phố --</option>
                      <option value="HCM">TP. Hồ Chí Minh</option>
                      <option value="HN">Hà Nội</option>
                      <option value="DN">Đà Nẵng</option>
                      <option value="CT">Cần Thơ</option>
                      <option value="HP">Hải Phòng</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!useManualAddress}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${
                        !useManualAddress ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      placeholder="Số nhà, tên đường"
                    />
                  </div>
                  

                  <div>
                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                      Mã bưu điện <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      disabled={!useManualAddress}
                      className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black ${
                        !useManualAddress ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                      placeholder="95000"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú đơn hàng (tùy chọn)
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black h-24"
                    placeholder="Ghi chú về đơn hàng, ví dụ: thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                  />
                </div>
              </div>

              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold mb-6 flex items-center">
                  <span className="bg-black text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-3">
                    2
                  </span>
                  Mã giảm giá
                </h2>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      id="couponCode"
                      name="couponCode"
                      value={formData.couponCode}
                      onChange={handleChange}
                      disabled={couponApplied}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Nhập mã giảm giá (ví dụ: AGILE10)"
                    />
                  </div>
                  {couponApplied ? (
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition duration-200"
                    >
                      Hủy
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition duration-200"
                    >
                      Áp dụng
                    </button>
                  )}
                </div>

                {couponApplied && (
                  <div className="mt-3 flex items-center text-green-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>
                      Mã giảm giá đã được áp dụng: Giảm {discountPercentage}% (Tiết kiệm{" "}
                      {discountAmount.toLocaleString()}đ)
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold mb-6 flex items-center">
                  <span className="bg-black text-white w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-3">
                    3
                  </span>
                  Phương thức thanh toán
                </h2>

                <div className="space-y-4">
                  <div className="relative border border-gray-200 rounded-md p-4 flex items-center">
                    <input
                      type="radio"
                      id="cod"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleChange}
                      className="h-5 w-5 text-black focus:ring-black"
                    />
                    <label htmlFor="cod" className="ml-3 flex items-center cursor-pointer flex-1">
                      <div className="bg-yellow-100 p-2 rounded-md mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-yellow-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium block">Thanh toán khi nhận hàng (COD)</span>
                        <span className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</span>
                      </div>
                    </label>
                  </div>

                  <div className="relative border border-gray-200 rounded-md p-4 flex items-center">
                    <input
                      type="radio"
                      id="credit_card"
                      name="paymentMethod"
                      value="credit_card"
                      checked={formData.paymentMethod === "credit_card"}
                      onChange={handleChange}
                      className="h-5 w-5 text-black focus:ring-black"
                    />
                    <label htmlFor="credit_card" className="ml-3 flex items-center cursor-pointer flex-1">
                      <div className="bg-blue-100 p-2 rounded-md mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div>
                        <span className="font-medium block">Thẻ tín dụng</span>
                        <span className="text-sm text-gray-500">Thanh toán an toàn với thẻ tín dụng</span>
                      </div>
                    </label>
                  </div>

                  <div className="relative border border-gray-200 rounded-md p-4 flex items-center">
                    <input
                      type="radio"
                      id="vnpay"
                      name="paymentMethod"
                      value="vnpay"
                      checked={formData.paymentMethod === "vnpay"}
                      onChange={handleChange}
                      className="h-5 w-5 text-black focus:ring-black"
                    />
                    <label htmlFor="vnpay" className="ml-3 flex items-center cursor-pointer flex-1">
                      <div className="bg-green-100 p-2 rounded-md mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-green-600"
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
                      <div>
                        <span className="font-medium block">Thanh toán VNPay</span>
                        <span className="text-sm text-gray-500">Thanh toán qua ví điện tử VNPay</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition duration-200 flex items-center justify-center ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    <>Đặt hàng ({total.toLocaleString()}đ)</>
                  )}
                </button>
                <p className="text-sm text-gray-500 text-center mt-3">
                  Bằng cách nhấn "Đặt hàng", bạn đồng ý với{" "}
                  <Link to="/terms" className="text-black underline">
                    điều khoản và điều kiện
                  </Link>{" "}
                  của chúng tôi.
                </p>
              </div>
            </form>

            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold mb-4">Đơn hàng của bạn</h2>
                  <p className="text-sm text-gray-500 mb-4">{cartItems.length} sản phẩm trong giỏ hàng</p>

                  <div className="max-h-80 overflow-y-auto pr-2 -mr-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center py-3 border-b border-gray-100 last:border-0">
                        <div className="h-16 w-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                          <img
                            src={item.images && item.images.length > 0 ? item.images[0] : "/placeholder-product.jpg"}
                            alt={item.name}
                            className="h-full w-full object-cover"
                            onError={handleImageError}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-sm font-medium">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            {item.price.toLocaleString()}đ x {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{(item.price * item.quantity).toLocaleString()}đ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 bg-gray-50">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tạm tính</span>
                      <span>{subtotal.toLocaleString()}đ</span>
                    </div>

                    {couponApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá ({discountPercentage}%)</span>
                        <span>-{discountAmount.toLocaleString()}đ</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-gray-600">Phí vận chuyển</span>
                      <span>
                        {shippingFee > 0 ? (
                          `${shippingFee.toLocaleString()}đ`
                        ) : (
                          <span className="text-green-600">Miễn phí</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Tổng cộng</span>
                      <span>{total.toLocaleString()}đ</span>
                    </div>
                    {subtotal > 200000 ? (
                      <p className="text-green-600 text-sm mt-2">✓ Bạn đã được miễn phí vận chuyển</p>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">
                        Mua thêm {(200000 - subtotal).toLocaleString()}đ để được miễn phí vận chuyển
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-6 border-t border-gray-100">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-md mr-3 mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Chính sách đổi trả</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Đổi trả miễn phí trong vòng 7 ngày nếu sản phẩm bị lỗi do nhà sản xuất.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-md mr-3 mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Giao hàng nhanh</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Giao hàng trong vòng 2 giờ trong nội thành TP.HCM và Hà Nội.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-yellow-100 p-2 rounded-md mr-3 mt-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-yellow-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">Thanh toán an toàn</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Thanh toán an toàn với nhiều phương thức thanh toán khác nhau.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}