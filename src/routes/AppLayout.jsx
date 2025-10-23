import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";


export default function AppLayout() {
    const { pathname } = useLocation();
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="px-6 py-4 border-b bg-white sticky top-0 z-40">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="text-lg font-semibold">Pelu Admin</div>
                    <nav className="flex gap-2">
                        <NavButton to="/" label="Dashboard" active={pathname === "/"} />
                        <NavButton to="/customers" label="Clientes" active={pathname.startsWith("/customers")} />
                    </nav>
                </div>
            </header>
            <main className="px-6 py-6">
                <div className="max-w-10xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}


function NavButton({ to, label, active }) {
    return (
        <NavLink
            to={to}
            className={`px-3 py-2 text-sm rounded-xl border transition ${active ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
        >
            {label}
        </NavLink>
    );
}