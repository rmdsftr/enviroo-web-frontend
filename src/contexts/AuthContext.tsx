import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { UserData, LoginRequest } from "../types/auth.type";
import { AuthService } from "../services/auth.service";
import { useNavigate } from "react-router-dom";
import type { CoreUser, ActiveAdmin } from "../types/users.type";
import { UsersService } from "../services/users.service";

interface AuthContextType {
  user: UserData | null;
  activeUser: CoreUser | null;
  activeAdmin: ActiveAdmin | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  refreshActiveAdmin: () => Promise<void>;
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

  const [activeAdmin, setActiveAdmin] = useState<ActiveAdmin | null>(null);

  const refreshActiveAdmin = async () => {
    if (!user || user.role === "superadmin" || !user.identity_id) {
      setActiveAdmin(null);
      return;
    }
    try {
      const res = await UsersService.getActiveAdmin(user.identity_id);
      const data = res?.data;
      if (data?.nama_bank) {
        setActiveAdmin({
          nama_bank: data.nama_bank,
          jenis_bank: data.jenis_bank,
          photo_url: data.photo_url || null,
        });
      }
    } catch (err: unknown) {
      console.error("Failed to fetch bank info:", err);
    }
  };

  useEffect(() => {
    refreshActiveAdmin();
  }, [user]);

  const login = async (data: LoginRequest) => {
    const response = await AuthService.login(data);
    const userData: UserData = {
      user_id: response.data.user_id,
      nama: response.data.nama,
      email: response.data.email,
      role: response.data.role,
      bank_id: response.data.bank_id,
      identity_id: response.data.identity_id,
    };
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
    setActiveAdmin(null);
    localStorage.removeItem("userData");
    AuthService.logout().catch(console.error);
    navigate("/");
  };

  const authValue = useMemo(() => ({
    user,
    login,
    logout,
    activeUser,
    activeAdmin,
    refreshUser,
    refreshActiveAdmin,
    isAuthenticated
  }), [user, activeUser, activeAdmin, isAuthenticated]);

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
