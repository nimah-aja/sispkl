export default function DashboardCard({ item, onClick }) {
  const isKonsentrasi = item.title === "Konsentrasi Keahlian";

  return (
    <div
      onClick={onClick}
      className={`
        bg-[#641E21] rounded-xl p-10 text-white
        transform transition duration-300 active:-translate-y-2
        active:shadow-[0_8px_30px_rgba(255,255,255,0.7)]
        shadow-[0_8px_0_rgba(255,255,255,1)]
        ${isKonsentrasi ? "pt-10" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        {/* icon */}
        <div className="w-20 h-15 bg-[#EC933A] rounded-lg flex items-center justify-center">
          <img src={item.icon} alt={item.title} />
        </div>

        {/* text */}
        <div className={isKonsentrasi ? "mt-2" : ""}>
          <h3 className="text-sm opacity-90 mb-2">
            {item.title}
          </h3>
          <p className="text-4xl font-bold">{item.value}</p>
        </div>
      </div>
    </div>
  );
}
