// import { useState, useEffect } from "react";
// import {Link, useNavigate, useParams} from "react-router-dom";
// import axios from "axios";
//
// interface Address {
//     addressId: string;
//     address: string;
//     city: string;
//     postalCode: string;
//     createdAt: string;
// }
//
// export default function ViewAddressPage() {
//     const { id } = useParams<{ id: string }>();
//     const navigate = useNavigate();
//     const [address, setAddress] = useState<Address | null>(null);
//     const [error, setError] = useState<string | null>(null);
//
//     useEffect(() => {
//         const fetchAddress = async () => {
//             try {
//                 const token = localStorage.getItem("token");
//                 const res = await axios.get(`http://localhost:8080/api/address/${id}`, {
//                     headers: {
//                         "Authorization": `Bearer ${token}`,
//                         "Accept": "application/json; charset=UTF-8",
//                     },
//                     withCredentials: true,
//                 });
//                 setAddress(res.data);
//                 setError(null);
//             } catch (err: any) {
//                 setError(err.response?.data || "Lỗi khi lấy thông tin địa chỉ");
//                 console.error("Lỗi khi lấy thông tin địa chỉ:", err);
//             }
//         };
//         fetchAddress();
//     }, [id]);
//
//     if (!address) {
//         return <div>Loading...</div>;
//     }
//
//     return (
//         <div className="px-4 md:px-8 py-8 flex flex-col items-center">
//             <h1 className="text-xl md:text-2xl font-bold mb-6">Chi tiết địa chỉ</h1>
//
//             {error && (
//                 <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md max-w-2xl w-full">
//                     {error}
//                 </div>
//             )}
//
//             <div className="bg-white shadow-sm rounded-lg p-6 max-w-2xl w-full">
//                 <div className="mb-4">
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
//                     <p className="text-sm text-gray-900">{address.address}</p>
//                 {/*</div>*/}
//
//                 <div className="mb-4">
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
//                     <p className="text-sm text-gray-900">{address.city || "Không có"}</p>
//                 </div>
//
//                 <div className="mb-6">
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Mã bưu điện</label>
//                     <p className="text-sm text-gray-900">{address.postalCode || "Không có"}</p>
//                 </div>
//
//                 <div className="mb-6">
//                     <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tạo</label>
//                     <p className="text-sm text-gray-900">
//                         {new Date(address.createdAt).toLocaleString("vi-VN", {
//                             day: "numeric",
//                             month: "numeric",
//                             year: "numeric",
//                             hour: "numeric",
//                             minute: "numeric",
//                             hour12: true,
//                         })}
//                     </p>
//                 </div>
//
//                 <div className="flex justify-end gap-3">
//                     <button
//                         onClick={() => navigate("/address")}
//                         className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
//                     >
//                         Quay lại
//                     </button>
//                     <Link
//                         to={`/address/update/${address.addressId}`}
//                         className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 text-sm"
//                     >
//                         Cập nhập địa chỉ
//                     </Link>
//                 </div>
//             </div>
//         </div>
//     );
// }
