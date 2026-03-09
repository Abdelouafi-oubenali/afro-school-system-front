import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="bg-ice text-navy flex min-h-screen font-sans">
            <Sidebar />
            <div className="ml-64 flex-1 flex flex-col min-h-screen">
                <Header />
                <div className="p-8 flex-1 space-y-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
