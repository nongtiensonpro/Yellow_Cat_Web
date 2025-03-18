"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import NavbarAdmin from "@/components/NavbarAdmin";
import Footer from "@/components/Footer";
import { useKeycloak } from '@react-keycloak/web';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Users {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  realmRoles: string[];
  clientRoles: string[];
  enabled: boolean;
}

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [content, setContent] = useState<React.ReactNode>(children);
  const [darkMode, setDarkMode] = useState(false);
  const [showAdminNav, setShowAdminNav] = useState(true);

  const { keycloak, initialized } = useKeycloak();
  const [user, setUser] = useState<Users | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    const getUserInfo = () => {
      if (!initialized) {
        return; // Đợi cho Keycloak khởi tạo xong
      }

      if (!keycloak.authenticated) {
        setError("Người dùng chưa đăng nhập");
        setLoading(false);
        return;
      }

      try {
        // Lấy thông tin từ tokenParsed đã có sẵn
        const tokenParsed = keycloak.tokenParsed || {};
        const clientId = keycloak.clientId || '';

        // Lấy client roles nếu clientId tồn tại
        const clientRoles = clientId && tokenParsed.resource_access?.[clientId]?.roles || [];

        // Xây dựng đối tượng user từ thông tin trong token
        const userData: Users = {
          id: tokenParsed.sub || '',
          username: tokenParsed.preferred_username || '',
          email: tokenParsed.email || '',
          firstName: tokenParsed.given_name || '',
          lastName: tokenParsed.family_name || '',
          roles: tokenParsed.realm_access?.roles || [],
          realmRoles: tokenParsed.realm_access?.roles || [],
          clientRoles: clientRoles,
          enabled: true
        };

        // Kiểm tra xem người dùng có quyền admin hoặc staff không
        const isAdmin = clientRoles.includes('Admin_Web');
        const isStaff = clientRoles.includes('Staff_Web');
        setHasAdminAccess(isAdmin || isStaff);

        setUser(userData);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin người dùng từ Keycloak:", err);
        setError("Không thể lấy thông tin người dùng. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    getUserInfo();
  }, [keycloak, initialized]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedDarkMode);

    // Lấy trạng thái hiển thị NavbarAdmin từ localStorage nếu có
    const savedShowAdminNav = localStorage.getItem("showAdminNav");
    if (savedShowAdminNav !== null) {
      setShowAdminNav(savedShowAdminNav === "true");
    }
  }, []);

  useEffect(() => {
    // Apply dark mode class when component mounts and when darkMode state changes
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const toggleAdminNav = () => {
    const newState = !showAdminNav;
    setShowAdminNav(newState);
    localStorage.setItem("showAdminNav", newState.toString());
  };

  // Update content when pathname changes
  useEffect(() => {
    setContent(children);
  }, [children, pathname]);


  return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

        {hasAdminAccess && showAdminNav && (
            <NavbarAdmin darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        )}

        {!(hasAdminAccess && showAdminNav) && (
            <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        )}
        <main className="flex-grow container mx-auto px-4 py-8">
          {loading && initialized ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner />
              </div>
          ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
          ) : user && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white">
                      {(() => {
                        if (user.clientRoles.includes('Admin_Web')) {
                          return "Chào mừng Quản lý !";
                        } else if (user.clientRoles.includes('Staff_Web')) {
                          return "Chào mừng Nhân viên !";
                        } else {
                          return "Chào mừng Khách hàng !";
                        }
                      })()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{user.email}</p>
                  </div>

                  {hasAdminAccess && (
                      <div className="flex items-center">
                  <span className="mr-2 text-sm text-gray-600 dark:text-gray-300">
                    Hiển thị menu quản trị:
                  </span>
                        <button
                            onClick={toggleAdminNav}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${showAdminNav ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className="sr-only">Toggle admin navigation</span>
                          <span
                              className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${showAdminNav ? 'translate-x-6' : 'translate-x-1'}`}
                          />
                        </button>
                      </div>
                  )}
                </div>
              </div>
          )}

          {content}
        </main>

        <Footer />
      </div>
  );
}