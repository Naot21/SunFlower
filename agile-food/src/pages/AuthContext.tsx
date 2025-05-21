// import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
// import { useCookies } from "react-cookie";
// import axios, { AxiosError } from "axios";
//
// interface User {
//     email: string;
//     fullName: string;
//     phone: string;
//     status: string;
//     role: "CUSTOMER" | "ADMIN";
//     createdAt: string;
// }
//
// interface AuthContextType {
//     user: User | null;
//     setUser: (user: User | null) => void;
//     fetchUser: () => Promise<void>;
//     logout: () => Promise<void>;
//     showSuccessModal: boolean;
//     setShowSuccessModal: (value: boolean) => void;
// }
//
// export const AuthContext = createContext<AuthContextType | undefined>(undefined);
//
// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//     const [user, setUser] = useState<User | null>(null);
//     const [, , removeCookie] = useCookies(["jwt_token"]);
//     const [loading, setLoading] = useState(true);
//     const [showSuccessModal, setShowSuccessModal] = useState(false);
//
//     const fetchUser = useCallback(async () => {
//         try {
//             setLoading(true);
//             const response = await axios.get<User>("http://localhost:8080/api/auth/user", {
//                 withCredentials: true,
//             });
//             const userData = {
//                 ...response.data,
//                 role: response.data.role.toUpperCase() as "CUSTOMER" | "ADMIN",
//             };
//             setUser(userData);
//             console.log("Fetched user:", userData); // Debug log
//         } catch (error) {
//             const axiosError = error as AxiosError;
//             console.error("Không thể lấy thông tin người dùng:", axiosError.response?.status);
//             if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
//                 removeCookie("jwt_token", { path: "/" });
//                 setUser(null);
//             }
//         } finally {
//             setLoading(false);
//         }
//     }, [removeCookie]);
//
//     useEffect(() => {
//         fetchUser();
//     }, [fetchUser]);
//
//     const logout = async () => {
//         try {
//             await axios.post(
//                 "http://localhost:8080/api/auth/logout",
//                 {},
//                 {
//                     withCredentials: true,
//                 }
//             );
//         } catch (error) {
//             console.error("Đăng xuất thất bại:", error);
//         } finally {
//             removeCookie("jwt_token", { path: "/" });
//             setUser(null);
//         }
//     };
//
//     return (
//         <AuthContext.Provider value={{ user, setUser, fetchUser, logout, showSuccessModal, setShowSuccessModal }}>
//             {loading ? (
//                 <div className="min-h-screen flex items-center justify-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
//                 </div>
//             ) : (
//                 children
//             )}
//         </AuthContext.Provider>
//     );
// };
//
// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error("useAuth must be used within an AuthProvider");
//     }
//     return context;
// };