import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

interface Address {
    addressId: number;
    fullName: string;
    phone: string;
    addressLine: string;
    ward: string;
    district: string;
    province: string;
    city: string;
    postalCode: string;
    createdAt: string;
}

type SortOrder = "asc" | "desc";

export default function AddressPage() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchAddresses = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await axios.get("http://localhost:8080/api/address/all", {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json; charset=UTF-8",
                    },
                    withCredentials: true,
                });

                const formattedAddresses = res.data.map((addr: any) => ({
                    addressId: addr.addressId,
                    fullName: addr.fullName,
                    phone: addr.phone,
                    addressLine: addr.addressLine,
                    ward: addr.ward,
                    district: addr.district,
                    province: addr.province,
                    city: addr.city || "",
                    postalCode: addr.postalCode || "",
                    createdAt: addr.createdAt,
                }));

                setAddresses(formattedAddresses);
            } catch (err: any) {
                let errorMessage = "Lỗi khi lấy địa chỉ";
                if (axios.isAxiosError(err) && err.response) {
                    const errorData = err.response.data;
                    errorMessage =
                        typeof errorData === "string"
                            ? errorData
                            : errorData?.error || errorData?.message || "Lỗi từ server";
                } else {
                    errorMessage = err.message || "Lỗi hệ thống";
                }
                setError(errorMessage);
                console.error("Lỗi khi lấy địa chỉ:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAddresses();
    }, []);

    const handleSortToggle = () => {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    const filteredAddresses = addresses
        .filter((addr) =>
            addr.fullName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) =>
            sortOrder === "asc"
                ? a.fullName.localeCompare(b.fullName)
                : b.fullName.localeCompare(a.fullName)
        );

    const totalPages = Math.ceil(filteredAddresses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAddresses.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (loading) {
        return <div className="text-center py-10">Đang tải...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center justify-between">
                    {error}
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-2 md:space-y-0">
                <h1 className="text-2xl font-bold">Quản lý địa chỉ</h1>
                <Link
                    to="/address/add"
                    className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 flex items-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 mr-2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Thêm địa chỉ
                </Link>
            </div>

            <div className="bg-white shadow-sm rounded-lg p-4 md:p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tìm kiếm theo tên người dùng
                        </label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-black text-sm"
                            placeholder="Nhập tên..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchQuery("");
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleSortToggle}
                            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm"
                        >
                            Sắp xếp: {sortOrder === "asc" ? "A → Z" : "Z → A"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Họ tên
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Số điện thoại
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Địa chỉ
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thành phố
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Mã bưu điện
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ngày tạo
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                                    Không tìm thấy địa chỉ nào
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((addr) => (
                                <tr key={addr.addressId} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 break-words max-w-xs">{addr.fullName}</td>
                                    <td className="px-4 py-4">{addr.phone}</td>
                                    <td className="px-4 py-4 whitespace-normal break-words max-w-xs">
                                        {addr.addressLine}, {addr.ward}, {addr.district}, {addr.province}
                                    </td>
                                    <td className="px-4 py-4">{addr.city}</td>
                                    <td className="px-4 py-4">{addr.postalCode || "N/A"}</td>
                                    <td className="px-4 py-4">
                                        {new Date(addr.createdAt).toLocaleString("vi-VN", {
                                            day: "numeric",
                                            month: "numeric",
                                            year: "numeric",
                                            hour: "numeric",
                                            minute: "numeric",
                                            hour12: true,
                                        })}
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>

                {filteredAddresses.length > 0 && (
                    <div className="px-4 py-4 bg-white border-t border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center gap-2 text-sm">
                        <div className="text-gray-700">
                            Hiển thị <b>{indexOfFirstItem + 1}</b> đến{" "}
                            <b>{Math.min(indexOfLastItem, filteredAddresses.length)}</b> trong{" "}
                            <b>{filteredAddresses.length}</b> địa chỉ
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md ${
                                    currentPage === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                « Trước
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`px-3 py-1 rounded-md ${
                                        currentPage === i + 1
                                            ? "bg-black text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded-md ${
                                    currentPage === totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                Sau »
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}