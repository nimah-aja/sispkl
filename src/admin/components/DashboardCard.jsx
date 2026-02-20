export default function DashboardCard({ item, onClick }) {
  const isKonsentrasi = item.title === "Konsentrasi Keahlian";

  return (
    <div
      onClick={onClick}
      className={`
        bg-[#641E21] rounded-xl p-6 text-white cursor-pointer
        transform transition duration-300 active:-translate-y-2
        active:shadow-[0_8px_30px_rgba(255,255,255,0.7)]
        shadow-[0_8px_0_rgba(255,255,255,1)]
        h-36
      `}
    >
      <div className="flex items-center h-full gap-20">
        {/* icon - ukuran tetap */}
        <div className="w-20 h-20 bg-[#EC933A] rounded-lg flex items-center justify-center flex-shrink-0">
          <img src={item.icon} alt={item.title} className="w-10 h-10" />
        </div>

        {/* text container - mengambil sisa ruang */}
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-sm opacity-90 break-words mb-1">
            {item.title}
          </h3>
          <p className="text-4xl font-bold leading-tight">{item.value}</p>
        </div>
      </div>
    </div>
  );
}