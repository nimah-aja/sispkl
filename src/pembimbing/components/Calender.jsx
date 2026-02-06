import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import calender from "../../assets/calendar.svg";
import arrow from "../../assets/arrow.svg";
import { Clock, Palette, Edit2, Trash2, ChevronLeft } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

// Import service untuk tahun ajaran dan kegiatan
import { getActiveTahunAjaran } from "../../utils/services/admin/tahun_ajaran";
import {getActiveKegiatanPKL} from "../../utils/services/pembimbing/kegiatan";

dayjs.locale("id");

const CalendarWrapper = ({ pklData }) => {
  const [expanded, setExpanded] = useState(false);
  const today = dayjs().format("dddd, DD MMM YYYY");

  return (
    <div>
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
  const [tahunAjaranList, setTahunAjaranList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [eventsOnSelectedDay, setEventsOnSelectedDay] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);
  const otherInputRef = useRef(null);
  const READ_ONLY = true;


  const [newEvent, setNewEvent] = useState({
    id: null,
    title: "",
    jenisKegiatan: "Pembekalan",
    startDate: "",
    endDate: "",
    color: "#8b5cf6",
    tahunAjaranId: "",
    description: "",
  });

  const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const mappedTodayIndex = dayjs().day() === 0 ? 6 : dayjs().day() - 1;

  const jenisKegiatanOptions = [
    { value: "Pembekalan", label: "Pembekalan" },
    { value: "Pengantaran", label: "Pengantaran" },
    { value: "Monitoring1", label: "Monitoring 1" },
    { value: "Monitoring2", label: "Monitoring 2" },
    { value: "Penjemputan", label: "Penjemputan" },
  ];


  // LOCAL STORAGE FUNCTIONS
  const STORAGE_KEY = "calendar_kegiatan_pkl";

  const saveEventsToLocalStorage = (eventsToSave) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsToSave));
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  };

  const loadEventsFromLocalStorage = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return [];
    }
  };

  // Load tahun ajaran dari API
  useEffect(() => {
    loadTahunAjaran();
  }, []);

  // Load data kegiatan berdasarkan tahun ajaran
  useEffect(() => {
    if (tahunAjaranList.length > 0 && newEvent.tahunAjaranId) {
      loadKegiatanFromAPI(newEvent.tahunAjaranId);
    }
  }, [tahunAjaranList, newEvent.tahunAjaranId]);

  // Load data tahun ajaran
  const loadTahunAjaran = async () => {
    try {
      const data = await getActiveTahunAjaran();
      const dataArray = Array.isArray(data) ? data : [data].filter(Boolean);
      setTahunAjaranList(dataArray);
      
      if (dataArray.length > 0) {
        const aktif = dataArray.find(item => item.status === 'aktif') || dataArray[0];
        setNewEvent(prev => ({
          ...prev,
          tahunAjaranId: aktif.id
        }));
      }
    } catch (error) {
      console.error("Error loading tahun ajaran:", error);
      setTahunAjaranList([]);
      toast.error("Gagal memuat tahun ajaran");
    }
  };

  // Load kegiatan dari API
  const loadKegiatanFromAPI = async (tahunAjaranId) => {
    setLoading(true);
    try {
      const kegiatanList = await getActiveKegiatanPKL(tahunAjaranId);
      setApiAvailable(true);
      
      // Convert API data ke format event untuk calendar
      const apiEvents = kegiatanList.map(kegiatan => {
        const start = dayjs(kegiatan.tanggal_mulai);
        const end = dayjs(kegiatan.tanggal_selesai);
        const eventsArray = [];
        
        // Generate event untuk setiap hari dalam rentang tanggal
        let current = start;
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          eventsArray.push({
            id: `kegiatan-${kegiatan.id}-${current.format('YYYYMMDD')}`,
            dbId: kegiatan.id,
            date: current.format("YYYY-MM-DD"),
            title: kegiatan.jenis_kegiatan,
            jenisKegiatan: kegiatan.jenis_kegiatan,
            startDate: kegiatan.tanggal_mulai,
            endDate: kegiatan.tanggal_selesai,
            color: getColorByJenisKegiatan(kegiatan.jenis_kegiatan),
            tahunAjaranId: kegiatan.tahun_ajaran_id,
            tahunAjaranNama: tahunAjaranList.find(t => t.id === kegiatan.tahun_ajaran_id)?.nama || "",
            description: kegiatan.deskripsi || "",
            source: "api"
          });
          current = current.add(1, 'day');
        }
        
        return eventsArray;
      }).flat();
      
      // Load dari localStorage
      const localEvents = loadEventsFromLocalStorage();
      
      // Gabungkan dengan event PKL default
      const pklEvents = generatePKLEvents();
      setEvents([...pklEvents, ...apiEvents, ...localEvents]);
      
    } catch (error) {
      console.error("Error loading kegiatan:", error);
      setApiAvailable(false);
      
      // Fallback ke localStorage
      const localEvents = loadEventsFromLocalStorage();
      const pklEvents = generatePKLEvents();
      setEvents([...pklEvents, ...localEvents]);
      
      toast.error("API tidak tersedia, menggunakan data lokal");
    } finally {
      setLoading(false);
    }
  };

  // Helper function untuk menentukan warna berdasarkan jenis kegiatan
  const getColorByJenisKegiatan = (jenisKegiatan) => {
    const colorMap = {
      'Pembekalan': '#EC933A',
      'Pengantaran': '#641E21',
      'Monitoring1': '#8b5cf6',
      'Monitoring2': '#3B82F6',
      'Penjemputan': '#F87171',
    };
    
    if (colorMap[jenisKegiatan]) {
      return colorMap[jenisKegiatan];
    }
    
    for (const [key, color] of Object.entries(colorMap)) {
      if (jenisKegiatan.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    
    return '#8b5cf6';
  };

  // Generate event PKL dari data PKL siswa
  const generatePKLEvents = () => {
    if (!pklData || pklData.status !== "Approved") return [];

    const start = dayjs(pklData.tanggal_mulai);
    const end = dayjs(pklData.tanggal_selesai);

    return [
      {
        id: `pkl-start-${Date.now()}`,
        dbId: null,
        date: start.format("YYYY-MM-DD"),
        title: "PKL Mulai",
        jenisKegiatan: "Pembekalan",
        startDate: start.format("YYYY-MM-DD"),
        endDate: start.format("YYYY-MM-DD"),
        color: "#EC933A",
        tahunAjaranId: newEvent.tahunAjaranId || "",
        description: "Mulai Praktik Kerja Lapangan",
        source: "system"
      },
      {
        id: `pkl-end-${Date.now() + 1}`,
        dbId: null,
        date: end.format("YYYY-MM-DD"),
        title: "PKL Selesai",
        jenisKegiatan: "penjemputan",
        startDate: end.format("YYYY-MM-DD"),
        endDate: end.format("YYYY-MM-DD"),
        color: "#F87171",
        tahunAjaranId: newEvent.tahunAjaranId || "",
        description: "Selesai Praktik Kerja Lapangan",
        source: "system"
      },
    ];
  };

  // Focus input lainnya ketika dipilih
  useEffect(() => {
    if (showOtherInput && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [showOtherInput]);

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
    setEditingEvent(null);
    setShowOtherInput(false);
    setNewEvent({
      id: null,
      title: "",
      jenisKegiatan: "Pembekalan",
      startDate: day.format("YYYY-MM-DD"),
      endDate: day.format("YYYY-MM-DD"),
      color: "#8b5cf6",
      tahunAjaranId: tahunAjaranList.find(t => t.status === 'aktif')?.id || (tahunAjaranList[0]?.id || ""),
      description: "",
    });
    setShowModal(true);
  };

  const handleEditEvent = async (event) => {
    setEditingEvent(event);
    
    const isOther = !jenisKegiatanOptions.some(opt => 
      opt.label.toLowerCase() === event.title.toLowerCase() && opt.value !== "lainnya"
    );
    
    setNewEvent({
      id: event.id,
      dbId: event.dbId,
      title: event.title,
      jenisKegiatan: isOther ? "lainnya" : (event.jenisKegiatan || "Pembekalan"),
      startDate: event.startDate || event.date,
      endDate: event.endDate || event.date,
      color: event.color || "#8b5cf6",
      tahunAjaranId: event.tahunAjaranId || (tahunAjaranList.find(t => t.status === 'aktif')?.id || ""),
      description: event.description || "",
    });
    
    setShowOtherInput(isOther);
    setShowModal(true);
  };

  const handleDeleteEvent = async (eventId, dbId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus acara ini?")) return;
    
    try {
      // Cari event yang akan dihapus
      const eventToDelete = events.find(e => e.id === eventId);
      if (!eventToDelete) return;
      
      const isLocalEvent = eventToDelete.source === "local";
      const isApiEvent = eventToDelete.source === "api";
      
      // Hapus dari API jika event dari API dan API tersedia
      if (isApiEvent && apiAvailable && dbId) {
        try {
          await deleteKegiatanPKL(dbId);
          toast.success("Acara berhasil dihapus dari server");
        } catch (apiError) {
          console.error("Error deleting from API:", apiError);
          toast.warning("Gagal menghapus dari server");
        }
      }
      
      // Hapus event dari state UI berdasarkan base ID
      const baseEventId = eventId.split('-')[0];
      const updatedEvents = events.filter(event => {
        const eventBaseId = event.id.split('-')[0];
        return eventBaseId !== baseEventId;
      });
      
      // Update state
      setEvents(updatedEvents);
      
      // Update modal jika sedang terbuka
      if (showEventsModal) {
        const updatedEventsOnDay = updatedEvents.filter(
          event => event.date === selectedDate.format("YYYY-MM-DD")
        );
        setEventsOnSelectedDay(updatedEventsOnDay);
      }
      
      // Jika event lokal, update localStorage
      if (isLocalEvent) {
        // Ambil semua events lokal dari state yang baru
        const updatedLocalEvents = updatedEvents.filter(event => event.source === "local");
        saveEventsToLocalStorage(updatedLocalEvents);
        toast.success("Acara berhasil dihapus dari penyimpanan lokal");
      } else {
        toast.success("Acara berhasil dihapus");
      }
      
    } catch (error) {
      console.error("Error deleting kegiatan:", error);
      toast.error("Gagal menghapus acara");
    }
  };

  const saveEvent = async () => {
    try {
      // Validasi judul
      let eventTitle = "";
      let jenisKegiatanValue = "";
      
      if (newEvent.jenisKegiatan === "lainnya") {
        if (!newEvent.title.trim()) {
          toast.error("Mohon isi judul untuk kegiatan lainnya!");
          return;
        }
        eventTitle = newEvent.title;
        jenisKegiatanValue = newEvent.title;
      } else {
        const selectedOption = jenisKegiatanOptions.find(opt => opt.value === newEvent.jenisKegiatan);
        eventTitle = selectedOption ? selectedOption.label : newEvent.jenisKegiatan;
        jenisKegiatanValue = newEvent.jenisKegiatan;
      }

      // Validasi tanggal
      if (dayjs(newEvent.endDate).isBefore(dayjs(newEvent.startDate))) {
        toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai!");
        return;
      }

      // Prepare payload
      const apiPayload = {
        deskripsi: newEvent.description || "",
        jenis_kegiatan: jenisKegiatanValue,
        tahun_ajaran_id: newEvent.tahunAjaranId,
        tanggal_mulai: newEvent.startDate,
        tanggal_selesai: newEvent.endDate,
      };

      let savedDbId = null;
      let isLocal = false;
      
      if (apiAvailable) {
        try {
          if (editingEvent && editingEvent.dbId) {
            // UPDATE ke API
            const updated = await updateKegiatanPKL(editingEvent.dbId, apiPayload);
            savedDbId = updated.id || editingEvent.dbId;
            toast.success("Acara berhasil diperbarui di server");
          } else if (!editingEvent) {
            // CREATE ke API
            const created = await createKegiatanPKL(apiPayload);
            savedDbId = created.id;
            toast.success("Acara berhasil dibuat di server");
          }
        } catch (apiError) {
          console.error("API Error, falling back to localStorage:", apiError);
          setApiAvailable(false);
          isLocal = true;
          savedDbId = editingEvent?.dbId || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          toast.warning("API tidak tersedia, menyimpan di lokal");
        }
      } else {
        isLocal = true;
        savedDbId = editingEvent?.dbId || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        toast.success(editingEvent ? "Acara berhasil diperbarui (lokal)" : "Acara berhasil dibuat (lokal)");
      }

      // Hapus event lama dari UI jika editing
      let eventsAfterRemoval = [...events];
      if (editingEvent) {
        const baseEventId = editingEvent.id.split('-')[0];
        eventsAfterRemoval = events.filter(e => {
          const eventBaseId = e.id.split('-')[0];
          return eventBaseId !== baseEventId;
        });
      }

      // Generate event untuk setiap hari dalam rentang tanggal
      const start = dayjs(newEvent.startDate);
      const end = dayjs(newEvent.endDate);
      const eventId = newEvent.id || `event-${Date.now()}`;

      const newEvents = [];
      let current = start;
      
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        newEvents.push({
          id: `${eventId}-${current.format('YYYYMMDD')}`,
          dbId: savedDbId,
          date: current.format("YYYY-MM-DD"),
          title: eventTitle,
          jenisKegiatan: jenisKegiatanValue,
          startDate: newEvent.startDate,
          endDate: newEvent.endDate,
          color: newEvent.color,
          tahunAjaranId: newEvent.tahunAjaranId,
          tahunAjaranNama: tahunAjaranList.find(t => t.id === newEvent.tahunAjaranId)?.nama || "",
          description: newEvent.description,
          source: isLocal ? "local" : "api"
        });
        current = current.add(1, 'day');
      }

      // Tambahkan ke state UI
      const finalEvents = [...eventsAfterRemoval, ...newEvents];
      setEvents(finalEvents);
      
      // Simpan ke localStorage jika ini event lokal
      if (isLocal) {
        // Filter hanya events lokal dari final events
        const localEventsToSave = finalEvents.filter(event => event.source === "local");
        saveEventsToLocalStorage(localEventsToSave);
      }

      setShowModal(false);
      resetForm();
      
    } catch (error) {
      console.error("Error saving kegiatan:", error);
      toast.error("Gagal menyimpan acara");
    }
  };

  const resetForm = () => {
    setNewEvent({
      id: null,
      dbId: null,
      title: "",
      jenisKegiatan: "Pembekalan",
      startDate: "",
      endDate: "",
      color: "#8b5cf6",
      tahunAjaranId: tahunAjaranList.find(t => t.status === 'aktif')?.id || (tahunAjaranList[0]?.id || ""),
      description: "",
    });
    setShowOtherInput(false);
    setEditingEvent(null);
  };

  const handleJenisKegiatanChange = (value) => {
    if (value === "lainnya") {
      setShowOtherInput(true);
      setNewEvent({
        ...newEvent,
        jenisKegiatan: value,
        title: ""
      });
    } else {
      setShowOtherInput(false);
      setNewEvent({
        ...newEvent,
        jenisKegiatan: value,
        title: ""
      });
    }
  };

  const handleBackToDropdown = () => {
    setShowOtherInput(false);
    setNewEvent({
      ...newEvent,
      jenisKegiatan: "Pembekalan",
      title: ""
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

  const getJenisKegiatanLabel = (value) => {
    if (value === "lainnya") return "Kegiatan Lainnya";
    const option = jenisKegiatanOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-6">
      {/* LEFT SIDE */}
      <div className="px-4 pb-4 pt-5 bg-white rounded-2xl shadow-sm border border-[#641E21]">
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
                onClick={() => openEventsModal(day)}
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
          {monthEvents.slice(0, 5).map((ev) => (
            <span
              key={ev.id}
              className="px-3 py-1 text-sm text-white rounded-full"
              style={{ backgroundColor: ev.color }}
            >
              {ev.title}
            </span>
          ))}
          {monthEvents.length > 5 && (
            <span className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-full">
              +{monthEvents.length - 5} lagi
            </span>
          )}
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
                  <div className="flex-1">
                    <p className="font-semibold truncate">{ev.title}</p>
                    <p className="text-sm text-gray-600">
                      {getJenisKegiatanLabel(ev.jenisKegiatan)} • {ev.tahunAjaranNama || "Tahun Ajaran"}
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

      {/* MODAL ADD/EDIT EVENT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center !z-[9999]">
          <div className="bg-[#641E21] w-[480px] overflow-hidden rounded-lg">
            {/* HEADER */}
            <div className="flex justify-between items-center px-5 py-4">
              <div className="flex items-center gap-3 w-full">
                <span className="!text-white text-3xl font-bold">
                  {editingEvent ? "✎" : "+"}
                </span>
                
                {showOtherInput ? (
                  // MODE INPUT TEKS (Ketika pilih Lainnya)
                  <div className="flex items-center gap-2 w-full">
                    <button
                      onClick={handleBackToDropdown}
                      className="!bg-transparent text-white hover:bg-white/10 p-1 rounded-full transition"
                      title="Kembali ke pilihan"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <input
                      ref={otherInputRef}
                      type="text"
                      placeholder="Masukkan judul kegiatan lainnya..."
                      className="flex-1 px-3 py-2 !text-white rounded-lg focus:outline-none text-lg font-semibold"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({
                        ...newEvent,
                        title: e.target.value
                      })}
                    />
                  </div>
                ) : (
                  // MODE DROPDOWN
                  <div className="flex-1">
                    <select
                      value={newEvent.jenisKegiatan}
                      onChange={(e) => handleJenisKegiatanChange(e.target.value)}
                      className="w-full px-3 !text-white py-2 rounded-lg focus:outline-none text-lg font-semibold bg-[#641E21]"
                    >
                      {jenisKegiatanOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-[#641E21]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-white text-2xl !bg-transparent !font-bold -ml-2"
              >
                ✕
              </button>
            </div>

            {/* API STATUS NOTIFICATION */}
            {!apiAvailable && (
              <div className="px-5 pb-2">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-2">
                  <p className="text-yellow-300 text-sm font-medium">
                     Mode Offline - Data akan disimpan secara lokal
                  </p>
                </div>
              </div>
            )}

            {/* INFORMASI JIKA PILIH LAINNYA */}
            {showOtherInput && (
              <div className="px-5 pb-2">
                <p className="text-white/80 text-sm">
                  Ketik judul kegiatan lainnya di atas
                </p>
              </div>
            )}

            {/* BODY */}
            <div className="px-5 py-4 space-y-4">
              {/* TANGGAL MULAI & SELESAI */}
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">Tanggal :</span>
                <div className="flex gap-2 flex-1">
                  <input
                    type="date"
                    className="!text-white px-3 py-2 rounded-lg focus:outline-none flex-1 bg-[#641E21] border border-white/30"
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      startDate: e.target.value
                    })}
                  />
                  
                  <span className="text-white self-center">s/d</span>
                  <input
                    type="date"
                    className="px-3 !text-white py-2 rounded-lg focus:outline-none flex-1 bg-[#641E21] border border-white/30"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      endDate: e.target.value
                    })}
                  />
                </div>
              </div>

              {/* TAHUN AJARAN */}
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">Tahun Ajaran :</span>
                <div className="flex-1 bg-[#641E21] border border-white/30 px-3 py-2 rounded-lg">
                  <select
                    value={newEvent.tahunAjaranId}
                    onChange={(e) => setNewEvent({
                      ...newEvent,
                      tahunAjaranId: e.target.value
                    })}
                    className="w-full focus:outline-none !text-white bg-[#641E21]"
                  >
                    <option value="" className="text-gray-400">Pilih Tahun Ajaran</option>
                    {tahunAjaranList.map(tahun => (
                      <option key={tahun.id} value={tahun.id} className="!text-white">
                        {tahun.nama} {tahun.status === 'aktif' ? '(Aktif)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COLOR PICKER */}
              <div className="flex items-center gap-3 ">
                <Palette className="text-white" size={20} /> <span className="!text-white"> : </span>
                <div className="flex items-center gap-2 bg-[#641E21] border border-white/30 px-3 py-2 rounded-lg w-full">
                  <input
                    type="color"
                    value={newEvent.color}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, color: e.target.value })
                    }
                    className="w-10 h-8 p-0 border-none cursor-pointer bg-transparent"
                  />
                  <span className="text-sm font-semibold !text-white">
                    {newEvent.color}
                  </span>
                </div>
              </div>

              {/* DESKRIPSI */}
              <div className="flex items-start gap-3">
                <span className="text-white font-medium mt-2">Deskripsi :</span>
                <textarea
                  placeholder="Tambahkan Deskripsi (opsional)..."
                  className="flex-1 px-3 py-2 !text-white !placeholder-gray-400 rounded-lg focus:outline-none h-20 resize-none bg-[#641E21] border border-white/30"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({
                    ...newEvent,
                    description: e.target.value
                  })}
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="bg-white py-1 text-center border border-[#E1D6C4]">
              <button
                onClick={saveEvent}
                className="text-[#EC933A] font-bold text-lg w-full !bg-transparent"
              >
                {editingEvent ? "Update Acara" : "Buat Acara"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LIST EVENTS dengan edit/delete */}
      {showEventsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center !z-[9999]">
          <div className="bg-white p-6 rounded-xl w-96 max-h-[80vh] overflow-hidden flex flex-col">
            <h3 className="font-bold mb-3 text-lg">
              Acara – {selectedDate.format("DD MMMM YYYY")}
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 mb-4">
              {eventsOnSelectedDay.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Tidak ada acara pada hari ini.</p>
              ) : (
                eventsOnSelectedDay.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-lg mb-3 text-white relative"
                    style={{ backgroundColor: ev.color }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{ev.title}</p>
                        <p className="text-sm opacity-90">
                          {ev.source === "local" && " (Lokal)"}
                          {ev.source === "system" && " (Sistem)"}
                        </p>
                        <p className="text-sm opacity-90">
                          {ev.tahunAjaranNama || "Tahun Ajaran"}
                        </p>
                        {ev.description && (
                          <p className="text-sm mt-1 opacity-80">{ev.description}</p>
                        )}
                        <p className="text-xs mt-2 opacity-75">
                          {dayjs(ev.startDate).format("DD MMM")} - {dayjs(ev.endDate).format("DD MMM YYYY")}
                        </p>
                      </div>
                      {/* <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowEventsModal(false);
                            handleEditEvent(ev);
                          }}
                          className="!bg-white/30 text-white p-1.5 rounded hover:bg-white/40 transition"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.dbId)}
                          className="!bg-white/30 text-white p-1.5 rounded hover:bg-white/40 transition"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div> */}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t">
              {/* <button
                onClick={() => {
                  setShowEventsModal(false);
                  handleDayClick(selectedDate);
                }}
                className="flex-1 py-2 !bg-[#641E21] !text-white rounded-lg hover:bg-[#7a2529] transition"
              >
                + Tambah Acara
              </button> */}
              <button
                onClick={() => setShowEventsModal(false)}
                className="flex-1 py-2 !bg-gray-200 !text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarWrapper;