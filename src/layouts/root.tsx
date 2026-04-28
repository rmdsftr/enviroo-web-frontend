import { Outlet } from "react-router-dom";
import NavbarLayout from "./navbar";
import SidebarLayout from "./sidebar";
import "../styles/layout.css";

export default function RootLayout() {
    return (
        <div className="app-layout">
            <SidebarLayout />
            <div className="app-right">
                <NavbarLayout />
                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
