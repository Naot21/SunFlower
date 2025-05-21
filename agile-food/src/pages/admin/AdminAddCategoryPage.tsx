import  React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiSave, FiX, FiUpload, FiTrash2, FiArrowLeft } from "react-icons/fi";

export default function AdminAddCategoryPage() {
  const [name, setName] = useState("");
  const [img, setImg] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

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
          setImg(result.info.secure_url);
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

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Tên danh mục không được để trống";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation
    setTouched({ name: true });

    const errors = validate();
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

      const categoryData = {
        name: name.trim(),
        img: img || null,
      };

      await axios.post(
        "http://localhost:8080/api/admin/categories/create",
        categoryData,
        { withCredentials: true }
      );

      toast.success(
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span>Thêm danh mục thành công!</span>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );

      setName("");
      setImg("");

      setTimeout(() => {
        navigate("/admin/categories");
      }, 1500);
    } catch (error: any) {
      toast.error(
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error.response?.data || "Lỗi khi thêm danh mục"}</span>
        </div>,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <ToastContainer />
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Thêm danh mục mới</h1>
            <p className="text-gray-500 mt-1">Điền thông tin để thêm danh mục mới vào hệ thống</p>
          </div>
          <Link to="/admin/categories" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
            <FiArrowLeft className="mr-2" />
            Quay lại danh sách
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên danh mục <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setTouched({ ...touched, name: true });
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent border-gray-300"
                placeholder="Nhập tên danh mục"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh (tùy chọn)</label>
              <div className="border border-gray-300 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <input
                    type="text"
                    value={img}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    placeholder="URL hình ảnh từ Cloudinary"
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
                  {img && (
                    <button
                      type="button"
                      onClick={() => setImg("")}
                      className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                    >
                      <FiTrash2 className="mr-2" />
                      Xóa
                    </button>
                  )}
                </div>
                {img ? (
                  <div className="mt-2 relative">
                    <img
                      src={img || "/placeholder.svg"}
                      alt="Preview"
                      className="h-64 object-contain rounded-md mx-auto border border-gray-200"
                    />
                  </div>
                ) : (
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Tải lên hoặc kéo thả hình ảnh danh mục vào đây</p>
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
              onClick={() => navigate("/admin/categories")}
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
                  Lưu danh mục
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}