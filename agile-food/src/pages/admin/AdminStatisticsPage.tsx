import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

type OrderStatisticsResponse = {
    date: string;
    totalOrders: number;
    totalRevenue: number;
};

const OrderStatisticsPage: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [year, setYear] = useState<number>(currentYear);
    const [month, setMonth] = useState<number>(currentMonth);
    const [statistics, setStatistics] = useState<OrderStatisticsResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `http://localhost:8080/api/orders/statistics`,
                {
                    params: { year, month },
                    withCredentials: true,
                }
            );
            setStatistics(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy thống kê:", error);
            toast.error("Không thể lấy thống kê đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, [year, month]);

    const handleFilter = () => {
        fetchStatistics();
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Thống kê đơn hàng</h2>

            <div className="flex gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Năm</label>
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Tháng</label>
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        {[...Array(12)].map((_, index) => (
                            <option key={index + 1} value={index + 1}>
                                Tháng {index + 1}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={handleFilter}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Lọc
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Đang tải thống kê...</p>
            ) : statistics.length === 0 ? (
                <p>Không có dữ liệu thống kê.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border border-gray-200">
                        <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-4 py-2">Ngày</th>
                            <th className="border px-4 py-2">Tổng đơn hàng</th>
                            <th className="border px-4 py-2">Tổng doanh thu (VNĐ)</th>
                        </tr>
                        </thead>
                        <tbody>
                        {statistics.map((stat, index) => (
                            <tr key={index}>
                                <td className="border px-4 py-2">{stat.date}</td>
                                <td className="border px-4 py-2">{stat.totalOrders}</td>
                                <td className="border px-4 py-2">
                                    {stat.totalRevenue.toLocaleString("vi-VN")} đ
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrderStatisticsPage;
