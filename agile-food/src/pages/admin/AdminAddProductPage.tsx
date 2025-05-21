import  React from "react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FiSave, FiX, FiUpload, FiTrash2, FiArrowLeft } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ProductForm {
  categoryId: number | null;
  categoryName: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  quantity: number;
  imageUrl: string;
}

interface Category {
  categoryId: number;
  name: string;
}

export default function AdminAddProductPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProductForm>({
    categoryId: null,
    categoryName: "",
    name: "",
    description: "",
    price: 0,
    available: true,
    quantity: 0,
    imageUrl: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  const API_URL = "http://localhost:8080/api/admin";
  const API_URL2 = "http://localhost:8080/api";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL2}/categories/all`, {
          withCredentials: true,
        });
        setCategories(response.data);
      } catch (err) {
        toast.error(
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              Không thể tải danh mục: {axios.isAxiosError(err) ? err.response?.data || err.message : "Lỗi không xác định"}
            </span>
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      }
    };
    fetchCategories();
  }, []);

  const openUploadWidget = () => {
    setUploadingImage(true);
    window.cloudinary.openUploadWidget(
      {
        cloudName: "dcah2ffln",
        uploadPreset: "ml_default",
        sources: ["local", "url", "camera", "google_drive", "dropbox"],
        multiple: false,
        cropping: true,
      },
      (error, result) => {
        setUploadingImage(false);
        if (!error && result && result.event === "success") {
          setFormData({ ...formData, imageUrl: result.info.secure_url });
        } else if (error) {
          toast.error(
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Lỗi khi tải ảnh lên: {error.message}</span>
            </div>,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        }
      }
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setTouched({ ...touched, [name]: true });
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "number" ? Number.parseFloat(value) || 0 : value,
      };
      if (name === "categoryId") {
        const selectedCategory = categories.find((cat) => cat.categoryId === Number.parseInt(value));
        newData.categoryId = value ? Number.parseInt(value) : null;
        newData.categoryName = selectedCategory ? selectedCategory.name : "";
      } else if (name === "available") {
        newData.available = value === "true";
      }
      return newData;
    });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name) errors.name = "Tên sản phẩm không được để trống";
    if (!formData.categoryId) errors.categoryId = "Vui lòng chọn danh mục";
    if (formData.price <= 0) errors.price = "Giá phải lớn hơn 0";
    if (formData.quantity < 0) errors.quantity = "Số lượng không được âm";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();

    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((error) => {
        toast.error(
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>,
          {
            position: "top-right",
            autoClose: 3000,
          }
        );
      });
      return;
    }

    try {
      setLoading(true);

      const productData = {
        categoryId: formData.categoryId,
        categoryName: formData.categoryName,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        available: formData.available,
        quantity: formData.quantity,
        imageUrls: formData.imageUrl ? [formData.imageUrl] : [],
      };

      await axios.post(`${API_URL}/products/create`, productData, {
        withCredentials: true,
      });

      toast.success(
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Sản phẩm đã được thêm thành công!</span>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );

      setTimeout(() => {
        navigate("/admin/products");
      }, 1500);
    } catch (err) {
      toast.error(
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            Không thể thêm sản phẩm: {axios.isAxiosError(err) ? err.response?.data || err.message : "Lỗi không xác định"}
          </span>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
      console.error("Submit error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
            <p className="text-gray-500 mt-1">Điền thông tin để thêm sản phẩm mới vào hệ thống</p>
          </div>
          <Link
            to="/admin/products"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Quay lại danh sách
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên sản phẩm <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={formData.categoryId || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
                  min="capacities"
                  step="1000"
                  placeholder="Nhập giá sản phẩm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">đ</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
                min="0"
                placeholder="Nhập số lượng"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                rows={4}
                placeholder="Nhập mô tả sản phẩm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh</label>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg/[0.03]"
                    placeholder="URL hình ảnh"
                  />
                  <button
                    type="button"
                    onClick={openUploadWidget}
                    disabled={uploadingImage}
                    className={`ml-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center ${
                      uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {uploadingImage ? (
                      <>
                        <div className="mr-2 w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <FiUpload className="mr-2" />
                        Tải ảnh
                      </>
                    )}
                  </button>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: "" })}
                      className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <FiTrash2 className="mr-2" />
                      Xóa
                    </button>
                  )}
                </div>
                {formData.imageUrl ? (
                  <div className="mt-2 relative">
                    <img
                      src={formData.imageUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="h-64 object-contain rounded-md mx-auto border border-gray-200"
                    />
                  </div>
                ) : (
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Tải lên hoặc kéo thả hình ảnh sản phẩm vào đây</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF tối đa 5MB</p>
                    <button
                      type="button"
                      onClick={openUploadWidget}
                      disabled={uploadingImage}
                      className={`mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center ${
                        uploadingImage ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {uploadingImage ? "Đang tải..." : "Chọn hình ảnh"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <FiX className="mr-2" />
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center ${
                loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <div className="mr-2 w-4 h-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Lưu sản phẩm
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}