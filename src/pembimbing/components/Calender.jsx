import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import calender from "../../assets/calendar.svg";
import arrow from "../../assets/arrow.svg";
import { Clock, Palette } from "lucide-react";



dayjs.locale("id");

const CalendarWrapper = ({ pklData }) => {
  const [expanded, setExpanded] = useState(false);

  const today = dayjs().format("dddd, DD MMM YYYY");

  return (
    <div>
      {/* PREVIEW SELALU ADA */}
      <div
        className="bg-white border border-[#641E21] rounded-xl p-4 
                   shadow-sm cursor-pointer hover:bg-gray-50 transition"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-full flex justify-end">
          <img
            src={arrow}
            alt="arrow icon"
            className={`w-5 h-5 transition-transform duration-300 ${
              expanded ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        <p className="text-gray-700 -mt-4 font-medium">{today}</p>
        <p className="text-sm text-gray-500 mt-1">
          Klik untuk {expanded ? "menyembunyikan" : "melihat"} kalender lengkap
        </p>
      </div>

      {/* FULL CALENDAR */}
      {expanded && (
        <div className="mt-4">
          <CalendarPKL pklData={pklData} />
        </div>
      )}
    </div>
  );
};


const CalendarPKL = ({ pklData }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [eventsOnSelectedDay, setEventsOnSelectedDay] = useState([]);

  const [newEvent, setNewEvent] = useState({
    title: "",
    start: "",
    end: "",
    timeStart: "",
    timeEnd: "",
    color: "#8b5cf6",
  });


  const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const mappedTodayIndex = dayjs().day() === 0 ? 6 : dayjs().day() - 1;

  // Tambahkan event PKL dari API — tandai semua tanggal dari mulai sampai selesai
  useEffect(() => {
    if (!pklData || pklData.status !== "Approved") return;

    const start = dayjs(pklData.tanggal_mulai);
    const end = dayjs(pklData.tanggal_selesai);

    const pklEvents = [
        {
        id: `pkl-start`,
        date: start.format("YYYY-MM-DD"),
        title: "PKL Mulai",
        color: "#EC933A", // warna untuk tanggal mulai
        },
        {
        id: `pkl-end`,
        date: end.format("YYYY-MM-DD"),
        title: "PKL Selesai",
        color: "#F87171", // warna untuk tanggal selesai (bisa beda)
        },
    ];

    setEvents(pklEvents);
    }, [pklData]);


  const prevMonth = () => setCurrentMonth(currentMonth.subtract(1, "month"));
  const nextMonth = () => setCurrentMonth(currentMonth.add(1, "month"));

  const generateDays = () => {
    const start = currentMonth.startOf("month").startOf("week");
    const end = currentMonth.endOf("month").endOf("week");
    const days = [];
    let date = start;

    while (date.isBefore(end) || date.isSame(end)) {
      days.push(date);
      date = date.add(1, "day");
    }

    return days;
  };

  const days = generateDays();

  const handleDayClick = (day) => {
    setSelectedDate(day);
    setShowModal(true);
    setNewEvent({ title: "", start: "", end: "", color: "#8b5cf6" });
  };

  const saveEvent = () => {
    if (!newEvent.title || !newEvent.timeStart || !newEvent.timeEnd) return;

    const selected = selectedDate.format("YYYY-MM-DD");

    const newData = {
      id: Date.now(),
      date: selected,
      start: newEvent.timeStart,
      end: newEvent.timeEnd,
      title: newEvent.title,
      color: newEvent.color,
    };

    setEvents((prev) => [...prev, newData]);
    setShowModal(false);

    setNewEvent({
      title: "",
      start: "",
      end: "",
      timeStart: "",
      timeEnd: "",
      color: "#8b5cf6",
    });
  };



  const openEventsModal = (day) => {
    const list = events.filter((ev) => ev.date === day.format("YYYY-MM-DD"));
    setEventsOnSelectedDay(list);
    setSelectedDate(day);
    setShowEventsModal(true);
  };

  const monthEvents = events.filter(
    (ev) => dayjs(ev.date).format("YYYY-MM") === currentMonth.format("YYYY-MM")
  );

  const todayEvents = events.filter(
    (ev) => ev.date === dayjs().format("YYYY-MM-DD")
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
      {/* LEFT SIDE */}
      <div className="px-4 pb-4 pt-5 bg-white rounded-2xl shadow-sm border border-[#641E2]">
        <div className="flex justify-between items-center mb-1">
          <button
            className="!text-4xl font-bold !bg-transparent leading-none"
            onClick={prevMonth}
          >
            ‹
          </button>
          <h2 className="font-bold text-lg leading-none">
            {currentMonth.format("MMMM YYYY")}
          </h2>
          <button
            className="!text-4xl font-bold !bg-transparent leading-none"
            onClick={nextMonth}
          >
            ›
          </button>
        </div>

        {/* HEADER HARI */}
        <div className="grid grid-cols-7 text-center font-semibold mb-2">
          {weekdayLabels.map((d, i) => (
            <div
              key={d}
              className={
                i === mappedTodayIndex
                  ? "font-extrabold text-purple-700"
                  : "text-gray-700"
              }
            >
              {d}
            </div>
          ))}
        </div>

        {/* DAYS */}
        <div className="grid grid-cols-7 text-center gap-1">
          {days.map((day, idx) => {
            const isToday =
              day.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");
            const dayEvent = events.find(
              (ev) => ev.date === day.format("YYYY-MM-DD")
            );

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(day)}
                className={`p-2 cursor-pointer transition w-10 h-10 mx-auto flex items-center justify-center
                  rounded-full
                  ${day.month() !== currentMonth.month() ? "text-gray-300" : ""}
                  ${isToday ? "border-2 border-purple-600 font-bold" : "hover:bg-purple-200"}`}
                style={{
                  backgroundColor: !isToday && dayEvent ? dayEvent.color : "",
                }}
              >
                {day.date()}
              </div>
            );
          })}
        </div>

        {/* BADGES */}
        <div className="mt-4 flex flex-wrap gap-2">
          {monthEvents.map((ev) => (
            <span
              key={ev.id}
              className="px-3 py-1 text-sm text-white rounded-full"
              style={{ backgroundColor: ev.color }}
            >
              {ev.title}
            </span>
          ))}
        </div>

        {/* ACARA HARI INI */}
        <div className="mt-6 p-4 border rounded-xl bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <img src={calender} alt="Calendar Icon" className="w-5 h-5" />
            <h3 className="font-bold text-lg">Acara Hari Ini</h3>
          </div>

          <div className="max-h-[8rem] overflow-y-auto pr-1">
            {todayEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">Tidak ada acara hari ini.</p>
            ) : (
              todayEvents.map((ev) => (
                <div key={ev.id} className="mb-3 flex items-start gap-2">
                  <div
                    className="w-1.5 rounded-lg"
                    style={{ backgroundColor: ev.color, height: "2.2rem" }}
                  ></div>
                  <div>
                    <p className="font-semibold truncate">{ev.title}</p>
                    <p className="text-sm text-gray-600">
                      {ev.start} – {ev.end}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="p-4 pt-10 bg-white rounded-2xl shadow-sm border border-[#641E21]">
        <h2 className="font-bold text-lg text-center mb-3">
          {currentMonth.format("MMMM YYYY")}
        </h2>

        <div className="grid grid-cols-7 text-center font-semibold mb-2">
          {weekdayLabels.map((d, i) => (
            <div
              key={d}
              className={
                i === mappedTodayIndex
                  ? "font-extrabold text-purple-700"
                  : "text-gray-700"
              }
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const dayEvents = events.filter(
              (ev) => ev.date === day.format("YYYY-MM-DD")
            );
            const firstThree = dayEvents.slice(0, 2);
            const extraCount = dayEvents.length - 2;

            return (
              <div
                key={idx}
                className="p-2 border h-24 relative hover:bg-purple-50 transition rounded-xl cursor-pointer"
                onClick={() => openEventsModal(day)}
              >
                <div className="text-left font-bold text-xl">{day.date()}</div>

                {firstThree.map((ev) => (
                  <div
                    key={ev.id}
                    className="mt-1 text-xs text-white rounded px-1 truncate"
                    style={{ backgroundColor: ev.color }}
                  >
                    {ev.title}
                  </div>
                ))}

                {extraCount > 0 && (
                  <div className="absolute top-1 right-1 text-purple-700 font-bold text-lg">
                    +{extraCount}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL ADD EVENT */}
      {/* MODAL ADD EVENT (UI BARU) */}
        {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center !z-[9999]">
            <div className="bg-[#641E21] w-[480px] overflow-hidden">

            {/* HEADER */}
            <div className="flex justify-between items-center px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-white text-3xl font-bold">+</span>

                <input
                  type="text"
                  placeholder="Judul Acara..."
                  className="bg-transparent pb-1 border-b border-white/50 text-white text-xl font-semibold focus:outline-none placeholder-white/70 w-[370px]"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                />
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-white text-2xl !bg-transparent !font-bold -ml-2"
              >
                ✕
              </button>
            </div>


            {/* <hr className="border-white/30" /> */}

            {/* BODY */}
            <div className="-mt-5 px-5 py-4 space-y-4">

                {/* TIME RANGE */}
                <div className="flex items-center gap-3">
                <Clock className="text-white" size={20} />
                <div className="flex gap-2 items-center bg-white px-3 py-3 rounded-lg min-w-[390px]
max-w-[480px]
">
                    <input
                    type="time"
                    className=" focus:outline-none"
                    value={newEvent.timeStart}
                    onChange={(e) =>
                        setNewEvent({ ...newEvent, timeStart: e.target.value })
                    }
                    />
                    <span>-</span>
                    <input
                    type="time"
                    className="focus:outline-none"
                    value={newEvent.timeEnd}
                    onChange={(e) =>
                        setNewEvent({ ...newEvent, timeEnd: e.target.value })
                    }
                    />
                </div>
                </div>

                {/* COLOR PICKER */}
                <div className="flex items-center gap-3">
                  <Palette className="text-white" size={20} />
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg w-full min-w-[370px]
max-w-[390px]
">
                    <input
                      type="color"
                      value={newEvent.color}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, color: e.target.value })
                      }
                      className="w-10 h-8 p-0 border-none cursor-pointer bg-transparent"
                    />
                    <span className="text-sm font-semibold">
                      {newEvent.color}
                    </span>
                  </div>
                </div>

            </div>

            {/* FOOTER */}
            <div className="bg-white py-3 text-center !border !border-[#E1D6C4] ">
                <button
                onClick={saveEvent}
                className="text-[#EC933A] font-bold text-lg w-full !bg-transparent"
                >
                Buat Acara
                </button>
            </div>
            </div>
        </div>
        )}


      {/* MODAL LIST EVENTS */}
      {showEventsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center !z-[9999]">
          <div className="bg-white p-6 rounded-xl w-80">
            <h3 className="font-bold mb-3">
              Daftar Acara – {selectedDate.format("DD MMMM YYYY")}
            </h3>

            <div className="max-h-[18rem] overflow-y-auto pr-1">
              {eventsOnSelectedDay.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2 rounded mb-2 text-white"
                  style={{ backgroundColor: ev.color }}
                >
                  <p className="font-semibold">{ev.title}</p>
                  <p className="text-sm">
                    {ev.start} – {ev.end}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowEventsModal(false)}
              className="w-full py-2 mt-2 !bg-[#EC933A] !text-white rounded-lg"
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

