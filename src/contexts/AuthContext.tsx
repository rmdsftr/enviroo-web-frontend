import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { UserData, LoginRequest } from "../types/auth.type";
import { AuthService } from "../services/auth.service";
import { useNavigate } from "react-router-dom";
import type { CoreUser } from "../types/users.type";
import { UsersService } from "../services/users.service";

interface AuthContextType {
  user: UserData | null;
  activeUser: CoreUser | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("userData");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user data");
      }
    }
  }, []);
  
  const isAuthenticated = !!user;

  useEffect(() => {
    let interval: any;

    if (isAuthenticated) {
      // Refresh token setiap 14 menit (karena access token backend 15 menit)
      interval = setInterval(async () => {
        try {
          await AuthService.refreshToken();
          console.log("Token refreshed automatically");
        } catch (error) {
          console.error("Failed to refresh token automatically", error);
        }
      }, 14 * 60 * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated]);

  const [activeUser, setActiveUser] = useState<CoreUser | null>(null);

  const refreshUser = async() => {
    if (!user?.user_id) return;
    const res = await UsersService.getActiveUser(user.user_id);
    setActiveUser(res.data)
  }


  const login = async (data: LoginRequest) => {
    const response = await AuthService.login(data);
    const userData = response.data;
    const role = userData.role?.toLowerCase() || "";

    if (["superadmin", "admin_bsi", "admin_bsu", "admin_bsm"].includes(role)) {
      setUser(userData);
      localStorage.setItem("userData", JSON.stringify(userData));

      if (role === "superadmin") {
        navigate("/superadmin");
      } else if (role === "admin_bsi") {
        navigate("/bsi");
      } else if (role === "admin_bsu") {
        navigate("/bsu");
      } else if (role === "admin_bsm") {
        navigate("/bsm");
      }
    } else {
      setUser(null);
      localStorage.removeItem("userData");
      navigate("/unauthorized");
    }
  };

  useEffect(() => {
    if (!user?.user_id) return;

    refreshUser();
  }, [user?.user_id]);

  const logout = () => {
    setUser(null);
    setActiveUser(null);
    localStorage.removeItem("userData");
    AuthService.logout().catch(console.error);
    navigate("/");
  };

  const authValue = useMemo(() => ({
    user,
    login,
    logout,
    activeUser,
    refreshUser,
    isAuthenticated
  }), [user, activeUser, isAuthenticated]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
