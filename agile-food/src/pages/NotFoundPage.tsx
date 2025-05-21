import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <p className="text-xl mb-8">Không tìm thấy trang</p>
      <p className="text-gray-600 mb-8 text-center max-w-lg">
        Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không có sẵn.
      </p>
      <Link
        to="/"
        className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800"
      >
        Quay lại trang chủ
      </Link>
    </div>
  );
}
