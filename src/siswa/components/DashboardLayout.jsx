import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen w-full">
      
      {/* SIDEBAR FULL HEIGHT */}
      <Sidebar />

      {/* AREA KANAN: HEADER + CONTENT */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <Header />

        {/* CONTENT */}
        <div className="p-6 bg-[#E1D6C4] h-full overflow-auto">
          {children}
        </div>

      </div>
    </div>
  );
}
