import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight } from "lucide-react";

import "dayjs/locale/id";
import calender from "../../assets/calendar.svg";
import arrow from "../../assets/arrow.svg";
import { Clock, Palette } from "lucide-react";

dayjs.locale("id");

/* ===================== WRAPPER ===================== */
const CalendarWrapper = ({ pklData, kegiatan = [] }) => {
  // const [expanded, setExpanded] = useState(false);
  const today = dayjs().format("dddd, DD MMM YYYY");

  return (
    <div>
        <div className="mt-4">
          <CalendarPKL pklData={pklData} kegiatan={kegiatan} />
        </div>
    </div>
  );
};

/* ===================== CALENDAR ===================== */
const CalendarPKL = ({ pklData, kegiatan = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [eventsOnSelectedDay, setEventsOnSelectedDay] = useState([]);

  const [newEvent, setNewEvent] = useState({
    title: "",
    timeStart: "",
    timeEnd: "",
    color: "#8b5cf6",
  });

  const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const mappedTodayIndex = dayjs().day() === 0 ? 6 : dayjs().day() - 1;

  /* ===== PKL START & END ===== */
  useEffect(() => {
    if (!pklData || pklData.status !== "Approved") return;

    const pklEvents = [
      {
        id: "pkl-start",
        date: dayjs(pklData.tanggal_mulai).format("YYYY-MM-DD"),
        title: "PKL Mulai",
        color: "#EC933A",
      },
      {
        id: "pkl-end",
        date: dayjs(pklData.tanggal_selesai).format("YYYY-MM-DD"),
        title: "PKL Selesai",
        color: "#F87171",
      },
    ];

    setEvents((prev) => {
      const filtered = prev.filter((e) => !e.id.startsWith("pkl-"));
      return [...filtered, ...pklEvents];
    });
  }, [pklData]);

  /* ===== KEGIATAN DARI API ===== */
  useEffect(() => {
    if (!kegiatan.length) return;

    const kegiatanEvents = [];

    kegiatan.forEach((item) => {
      const start = dayjs(item.tanggal_mulai);
      const end = dayjs(item.tanggal_selesai);

      let current = start.clone();

      while (current.isSame(end) || current.isBefore(end)) {
        kegiatanEvents.push({
          id: `kegiatan-${item.id}-${current.format("YYYY-MM-DD")}`,
          date: current.format("YYYY-MM-DD"),
          title: item.jenis_kegiatan,
          description: item.deskripsi,
          color:
            item.jenis_kegiatan === "Pembekalan"
              ? "#3B82F6"
              : item.jenis_kegiatan?.includes("Monitoring")
              ? "#10B981"
              : "#F59E0B",
        });

        current = current.add(1, "day");
      }
    });

    setEvents((prev) => {
      const ids = new Set(prev.map((e) => e.id));
      return [...prev, ...kegiatanEvents.filter((e) => !ids.has(e.id))];
    });
  }, [kegiatan]);


  /* ===== CALENDAR LOGIC ===== */
  const start = currentMonth.startOf("month").startOf("week");
  const end = currentMonth.endOf("month").endOf("week");
  const days = [];
  let d = start;
  while (d.isBefore(end) || d.isSame(end)) {
    days.push(d);
    d = d.add(1, "day");
  }

  const todayEvents = events.filter(
    (e) => e.date === dayjs().format("YYYY-MM-DD")
  );

  const upcomingEvents = events
    .filter((e) => dayjs(e.date).isAfter(dayjs(), "day"))
    .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)))
    .slice(0, 5);

  const openEventsModal = (day) => {
    setSelectedDate(day);
    setEventsOnSelectedDay(
      events.filter((e) => e.date === day.format("YYYY-MM-DD"))
    );
    setShowEventsModal(true);
  };

  // pindah bulan
  const prevMonth = () => {
    setCurrentMonth((prev) => prev.subtract(1, "month"));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => prev.add(1, "month"));
  };
      

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
      {/* LEFT */}
      <div className="flex flex-col gap-6">
        {/* HARI INI */}
        <div className="bg-white rounded-2xl border-2 border-[#641E21] p-5">
          <h3 className="font-bold text-lg text-center mb-4">Acara Hari Ini</h3>
          {todayEvents.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Tidak ada acara hari ini
            </p>
          ) : (
            todayEvents.map((e) => (
              <div key={e.id} className="flex gap-3 mb-3">
                <span
                  className="w-2 rounded-full"
                  style={{ backgroundColor: e.color }}
                />
                <div>
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-xs text-gray-600">{e.description}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MENDATANG */}
        <div className="bg-white rounded-2xl border-2 border-[#641E21] p-5">
          <h3 className="font-bold text-lg text-center mb-4">
            Acara Mendatang
          </h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Tidak ada acara
            </p>
          ) : (
            upcomingEvents.map((e) => (
              <div key={e.id} className="flex gap-3 mb-3">
                <span
                  className="w-2 rounded-full"
                  style={{ backgroundColor: e.color }}
                />
                <div>
                  <p className="font-semibold">{e.title} - {dayjs(e.date).format("DD MMM YYYY")}</p>
                  <p className="text-xs text-gray-600">
                    {e.description}
                  </p>
                </div>
              </div>
            ))
          )}

        </div>
      </div>

      {/* RIGHT */}
      <div className="bg-white rounded-2xl border border-[#641E21] p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1 hover:text-purple-600 !bg-transparent">
            <ChevronLeft size={20} />
          </button>

          <h2 className="font-bold text-lg">
            {currentMonth.format("MMMM YYYY")}
          </h2>

          <button onClick={nextMonth} className="p-1 hover:text-purple-600 !bg-transparent">
            <ChevronRight size={20} />
          </button>
        </div>


        <div className="grid grid-cols-7 text-center font-semibold mb-2">
          {weekdayLabels.map((d, i) => (
            <div
              key={d}
              className={i === mappedTodayIndex ? "text-purple-700" : ""}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayEvents = events.filter(
              (e) => e.date === day.format("YYYY-MM-DD")
            );

            const isToday = day.isSame(dayjs(), "day");

            return (
              <div
                key={day.format()}
                className="p-2 border h-24 rounded-xl cursor-pointer hover:bg-purple-50"
                onClick={() => openEventsModal(day)}
              >
                <div
                  className={`${
                    isToday
                      ? "font-extrabold text-lg text-purple-700"
                      : "font-bold"
                  }`}
                >
                  {day.date()}
                </div>

                {dayEvents.slice(0, 2).map((e) => (
                  <div
                    key={e.id}
                    className="text-xs text-white rounded px-1 truncate mt-1"
                    style={{ backgroundColor: e.color }}
                  >
                    {e.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-purple-700 font-bold">
                    +{dayEvents.length - 2}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL LIST */}
      {showEventsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-xl w-80">
            <h3 className="font-bold mb-3">
              {selectedDate.format("DD MMMM YYYY")}
            </h3>
            {eventsOnSelectedDay.map((e) => (
              <div
                key={e.id}
                className="p-2 mb-2 rounded text-white"
                style={{ backgroundColor: e.color }}
              >
                {e.title}
              </div>
            ))}
            <button
              onClick={() => setShowEventsModal(false)}
              className="w-full mt-2 bg-[#EC933A] text-white py-2 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWrapper;
