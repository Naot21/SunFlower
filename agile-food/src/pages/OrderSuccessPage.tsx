// import { Link, useLocation, useNavigate } from "react-router-dom";
// import { useEffect } from "react";
//
// export default function OrderSuccessPage() {
//   const location = useLocation();
//   const navigate = useNavigate();
//
//   const orderData = location.state;
//
//   useEffect(() => {
//     if (!orderData) {
//       // Nếu không có dữ liệu đơn hàng, quay về trang chủ
//       navigate("/");
//     }
//   }, [orderData, navigate]);
//
//   if (!orderData) return null;
//
//   return (
//     <div className="container mx-auto px-4 py-8">
//       <div className="bg-white rounded-lg shadow-md overflow-hidden p-6 max-w-3xl mx-auto">
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
//             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-green-600">
//               <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
//             </svg>
//           </div>
//           <h1 className="text-3xl font-bold mb-2">Đặt hàng thành công!</h1>
//           <p className="text-gray-600">
//             Cám ơn bạn đã mua hàng tại Agile Food. Đơn hàng của bạn đã được tiếp nhận và sẽ được xử lý trong thời gian sớm nhất.
//           </p>
//         </div>
//
//         <div className="border p-4 rounded-md mb-6">
//           <h2 className="text-lg font-semibold mb-4">Thông tin đơn hàng</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <p className="text-gray-600 mb-1">Mã đơn hàng:</p>
//               <p className="font-medium">{orderData.orderId}</p>
//             </div>
//             <div>
//               <p className="text-gray-600 mb-1">Ngày đặt hàng:</p>
//               <p className="font-medium">{orderData.orderDate}</p>
//             </div>
//             <div>
//               <p className="text-gray-600 mb-1">Tổng tiền:</p>
//               <p className="font-medium">{orderData.totalAmount.toLocaleString()}đ</p>
//             </div>
//             <div>
//               <p className="text-gray-600 mb-1">Phương thức thanh toán:</p>
//               <p className="font-medium">{orderData.paymentMethod}</p>
//             </div>
//           </div>
//         </div>
//
//         <div className="border p-4 rounded-md mb-6">
//           <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <p className="text-gray-600 mb-1">Họ tên:</p>
//               <p className="font-medium">{orderData.customer.name}</p>
//             </div>
//             <div>
//               <p className="text-gray-600 mb-1">Số điện thoại:</p>
//               <p className="font-medium">{orderData.customer.phone}</p>
//             </div>
//             <div>
//               <p className="text-gray-600 mb-1">Email:</p>
//               <p className="font-medium">{orderData.customer.email}</p>
//             </div>
//             <div>
//               <p className="text-gray-600 mb-1">Địa chỉ:</p>
//               <p className="font-medium">{orderData.customer.address}</p>
//             </div>
//           </div>
//         </div>
//
//         <div className="border p-4 rounded-md mb-8">
//           <h2 className="text-lg font-semibold mb-4">Sản phẩm đã đặt</h2>
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-50 text-left">
//                 <tr>
//                   <th className="py-2 px-4 font-medium">Sản phẩm</th>
//                   <th className="py-2 px-4 font-medium text-right">Giá</th>
//                   <th className="py-2 px-4 font-medium text-right">SL</th>
//                   <th className="py-2 px-4 font-medium text-right">Thành tiền</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {orderData.items.map((item, index) => (
//                   <tr key={`${item.name}-${index}`}>
//                     <td className="py-2 px-4">{item.name}</td>
//                     <td className="py-2 px-4 text-right">{item.price.toLocaleString()}đ</td>
//                     <td className="py-2 px-4 text-right">{item.quantity}</td>
//                     <td className="py-2 px-4 text-right font-medium">
//                       {(item.price * item.quantity).toLocaleString()}đ
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//
//         <div className="text-center">
//           <p className="text-sm text-gray-600 mb-6">
//             Bạn sẽ nhận được email xác nhận đơn hàng tại địa chỉ: <span className="font-medium">{orderData.customer.email}</span>
//           </p>
//
//           <div className="flex flex-col sm:flex-row gap-4 justify-center">
//             <Link to="/" className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800">
//               Quay lại trang chủ
//             </Link>
//             <Link to="/don-hang" className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-50">
//               Xem đơn hàng của tôi
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
