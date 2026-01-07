import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ArrowUpRight,
  Loader2,
  Building2,
  CircleDot,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Notebook,
  UserCheck,
  UserCog,
  NotebookText,
  MessageSquareText,
  Bell,
  IdCard,
  School,
  GraduationCap,
  CalendarClock,
} from "lucide-react";

dayjs.extend(relativeTime);

// Components
import Sidebar from "./components/SidebarDashboard";
import Header from "./components/HeaderDashboard";
import Notification from "./components/Notification";
import DashboardCard from "./components/DashboardCard";
import AktivitasTerkini from "./components/AktivitasTerkini";
import Detail from "./components/Detail";
import StatusPengajuan_PKL from "./components/StatusPengajuanPKL";
import QuickActions from "./components/QuickAction";

// assets
import Industri from "../assets/industri.svg";
import PengajuanPKL from "../assets/pengajuan_PKL.svg";
import Pembimbing from "../assets/pembimbing.svg";
import profile from "../assets/profile.svg";
import toast from "react-hot-toast";

// utils
import { getPKLApplications, approvePKLApplication, rejectPKLApplication, } from "../utils/services/kapro/pengajuanPKL";
import { getIndustriPreview } from "../utils/services/kapro/industri";
import { getPembimbingPKL } from "../utils/services/kapro/pembimbing";
import {getGuru} from "../utils/services/admin/get_guru"

export default function KaprodiDashboard() {
  const navigate = useNavigate();
  const [pembimbingOptions, setPembimbingOptions] = useState([]);
  const [detailMode, setDetailMode] = useState("view");// "view" | "approve" | "reject"
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [aktivitas, setAktivitas] = useState([]);
  const [active, setActive] = useState("beranda");
  const [query, setQuery] = useState("");
  const [applications, setApplications] = useState([]);

  const [summary, setSummary] = useState({
    totalIndustri: 0,
    totalPembimbing: 0,
    totalPengajuan: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  });


  // Handler untuk submit detail pengajuan
  const handleSubmitDetail = async (mode, payload) => {
    try {
      const applicationId = detailData?.application?.id;
      if (!applicationId) return;

      if (mode === "approve") {
        await approvePKLApplication(applicationId, {
          tanggal_mulai: payload.tanggal_mulai,
          tanggal_selesai: payload.tanggal_selesai,
          pembimbing_guru_id: Number(payload.pembimbing_id),
          catatan: payload.catatan || null,
        });

        toast.success("Pengajuan PKL berhasil disetujui");
      }

      if (mode === "reject") {
        await rejectPKLApplication(applicationId, {
          catatan: payload.catatan,
        });

        toast.success("Pengajuan PKL berhasil ditolak");
      }

      // 🔥 TUTUP MODAL
      setOpenDetail(false);
      setDetailMode("view");
      setDetailData(null);

      // REFRESH DASHBOARD
      fetchDashboardData();

    } catch (err) {
      console.error(err);

      const apiError = err?.response?.data?.error;

      // ERROR KHUSUS: KUOTA INDUSTRI PENUH
      if (apiError?.code === "PKL_QUOTA_EXCEEDED") {
        toast.error("Kuota industri sudah penuh");
        return;
      }

      // ERROR LAIN (fallback)
      toast.error(
        apiError?.message || "Gagal memproses pengajuan"
      );
    }
  };





  // Handler untuk Quick Actions
 const handleQuickAction = (actionKey) => {
  switch (actionKey) {
    case "pengajuan_pkl":
      navigate("/guru/kaprodi/pengajuanPKL");
      break;

    case "pindah_pkl":
      navigate("/guru/kaprodi/pengajuan_pindah_pkl");
      break;

    case "izin_pkl":
      navigate("/guru/kaprodi/perizinan");
      break;

    default:
      break;
  }
};

  const user = {
    name: localStorage.getItem("nama_guru") || "Guru SMK",
    role: "KAPROG",
  };

  // Format waktu untuk display notifikasi
  const formatWaktu = (time) => {
    const now = dayjs();
    const t = dayjs(time);

    if (!t.isValid()) return "-";

    if (t.isSame(now, "day")) {
      return `Hari ini • ${t.format("HH:mm")}`;
    }

    if (t.isSame(now.subtract(1, "day"), "day")) {
      return `Kemarin • ${t.format("HH:mm")}`;
    }

    return t.format("DD MMMM YYYY • HH:mm");
  };

  // Format waktu untuk detail pengajuan
  const formatWaktuDetail = (time) => {
    const t = dayjs(time);
    if (!t.isValid()) return "-";

    return t.format("DD MMMM YYYY HH:mm");
  };
  
  const fetchDashboardData = async () => {
      try {
        const [
          applicationsRes,
          industriList,
          pembimbingList,
        ] = await Promise.all([
          getPKLApplications(),
          getIndustriPreview(),
          getPembimbingPKL(),
        ]);

        const pembimbingOptions = await getPembimbingPKL();
          setPembimbingOptions(pembimbingOptions);


        const applications = applicationsRes?.data || [];
        setApplications(applications); 

        let approved = 0;
        let rejected = 0;
        let pending = 0;

        applications.forEach((item) => {
          const status = item.application?.status;

          if (status === "Approved") approved++;
          else if (status === "Rejected") rejected++;
          else pending++;
        });

        // ===============================
        // 🔥 BIKIN DATA AKTIVITAS
        // ===============================
        // const aktivitasData = applications.slice(0, 5).map((item) => {
        //   const status = item.application?.status;

        //   let type = "submit";
        //   let description = "Mengajukan PKL";

        //   if (status === "Approved") {
        //     type = "approved";
        //     description = "Pengajuan PKL disetujui";
        //   } else if (status === "Rejected") {
        //     type = "rejected";
        //     description = "Pengajuan PKL ditolak";
        //   }

        //   return {
        //     type,
        //     title: item.siswa_username,
        //     description: `${description} di ${item.industri_nama}`,
        //     time: formatWaktu(item.application.tanggal_permohonan),

        //     // 🔥 KUNCI UTAMA
        //     onClick: async () => {
        //       try {
        //         const allGuru = await getGuru();

        //         const pembimbing = allGuru.find(
        //           (g) => g.id === item.application?.pembimbing_guru_id
        //         );

        //         const kaprog = allGuru.find(
        //           (g) => g.id === item.application?.processed_by
        //         );

        //         setDetailData({
        //           ...item,
        //           namaPembimbing: pembimbing?.nama || "-",
        //           namaKaprog: kaprog?.nama || "-",
        //         });

        //         setOpenDetail(true);
        //       } catch (err) {
        //         console.error("Gagal ambil data guru", err);
        //       }
        //     },


        //     actions:
        //       item.application?.status === "Pending"
        //         ? [
        //             {
        //               label: "Terima",
        //               color: "#EC933A",
        //               onClick: () => {
        //                 console.log("Approve", item.application.id);
        //                 // TODO: panggil API approve
        //               },
        //             },
        //             {
        //               label: "Tolak",
        //               color: "#BC2424",
        //               onClick: () => {
        //                 console.log("Reject", item.application.id);
        //                 // TODO: panggil API reject
        //               },
        //             },
        //           ]
        //         : undefined,

        //   };

        // });

        // const sevenDaysAgo = dayjs().subtract(7, "day");

        const aktivitasData = applications
          .filter((item) =>
            dayjs(item.application?.tanggal_permohonan)
          )
          .sort(
            (a, b) =>
              dayjs(b.application?.tanggal_permohonan).valueOf() -
              dayjs(a.application?.tanggal_permohonan).valueOf()
          )
          .map((item) => {
            const status = item.application?.status;

            let type = "submit";
            let description = "Mengajukan PKL";

            if (status === "Approved") {
              type = "approved";
              description = "Pengajuan PKL disetujui";
            } else if (status === "Rejected") {
              type = "rejected";
              description = "Pengajuan PKL ditolak";
            }

            return {
              type,
              title: item.siswa_username,
              description: `${description} di ${item.industri_nama}`,
              time: formatWaktu(item.application.tanggal_permohonan),

              onClick: async () => {
                try {
                  const allGuru = await getGuru();

                  const pembimbing = allGuru.find(
                    (g) => g.id === item.application?.pembimbing_guru_id
                  );

                  const kaprog = allGuru.find(
                    (g) => g.id === item.application?.processed_by
                  );

                  setDetailData({
                    ...item,
                    namaPembimbing: pembimbing?.nama || "-",
                    namaKaprog: kaprog?.nama || "-",
                  });

                  setOpenDetail(true);
                } catch (err) {
                  console.error("Gagal ambil data guru", err);
                }
              },

              actions:
                status === "Pending"
                  ? [
                      {
                        label: "Terima",
                        color: "#EC933A",
                        onClick: async () => {
                          const allGuru = await getGuru();

                          const pembimbing = allGuru.find(
                            (g) => g.id === item.application?.pembimbing_guru_id
                          );

                          const kaprog = allGuru.find(
                            (g) => g.id === item.application?.processed_by
                          );

                          setDetailData({
                            ...item,
                            namaPembimbing: pembimbing?.nama || "",
                            namaKaprog: kaprog?.nama || "",
                          });

                          setDetailMode("approve");

                          // 🔥 PAKSA buka SETELAH mode siap
                          setTimeout(() => setOpenDetail(true), 0);

                        },
                      },
                      {
                        label: "Tolak",
                        color: "#BC2424",
                        onClick: async () => {
                          const allGuru = await getGuru();

                          const kaprog = allGuru.find(
                            (g) => g.id === item.application?.processed_by
                          );

                          setDetailMode("reject");
                          setDetailData({
                            ...item,
                            namaKaprog: kaprog?.nama || "",
                          });
                          setOpenDetail(true);
                        },
                      },
                    ]
                  : undefined,

            };
          });


        setSummary({
          totalIndustri: industriList?.length || 0,
          totalPembimbing: pembimbingList?.length || 0,
          totalPengajuan: applications.length,
          approved,
          rejected,
          pending,
        });

        setAktivitas(aktivitasData);


      } catch (err) {
        console.error("Gagal ambil summary dashboard", err);
      }
    };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ===============================
  // AKTIVITAS KHUSUS PENDING
  // ===============================
  const pendingAktivitas = aktivitas.filter(
    (item) => item.type === "submit"
  );

  // ===============================
  // HEADER NOTIFICATION (NO ACTION)
  // ===============================
  const headerNotifications = pendingAktivitas.map(
    ({ actions, ...rest }) => ({
      ...rest,
      icon: "submit",
    })
  );


  const cards = [
    {
      title: "Jumlah Industri",
      icon: Industri,
      value: summary.totalIndustri,
    },
    {
      title: "Pengajuan PKL",
      icon: PengajuanPKL,
      value: summary.totalPengajuan,
    },
    {
      title: "Pembimbing",
      icon: Pembimbing,
      value: summary.totalPembimbing,
    },
  ];

  const hitungPersentase = (jumlah, total) => {
    if (!total || total === 0) return 0;
    return Math.round((jumlah / total) * 100);
  };

  const mapStatus = (status) => {
    if (status === "Approved") return "disetujui";
    if (status === "Rejected") return "ditolak";
    return "belum_diproses";
  };

  const groupedStudents = React.useMemo(() => {
    const groups = {
      disetujui: [],
      ditolak: [],
      belum_diproses: [],
    };

    applications.forEach((item) => {
      const key = mapStatus(item.application?.status);
      groups[key].push({
        name: item.siswa_username,
        pkl_place: item.industri_nama,
      });
    });

    return groups;
  }, [applications]);


  const baseFields = [
  { name: "nama_industri", label: "Industri", full: true },
  { name: "nama_siswa", label: "Nama Siswa" },
  { name: "nisn", label: "NISN" },
  { name: "kelas", label: "Kelas" },
  { name: "jurusan", label: "Jurusan" },
  { name: "status", label: "Status" },
];

  const approveFields = [
    { name: "tanggal_mulai", label: "Tanggal Mulai", type: "date", required: true },
    { name: "tanggal_selesai", label: "Tanggal Selesai", type: "date", required: true },
    {
      name: "pembimbing_id",
      label: "Nama Pembimbing",
      type: "select",
      options: pembimbingOptions,
      required: true,
      full:true
    },
    {
      name: "catatan",
      label: "Catatan Kaprog",
      type: "textarea",
      full: true,
    },
  ];


  const rejectFields = [
    { name: "catatan", label: "Catatan Penolakan", full: true, required: false },
  ];

  const viewFields = [
    ...baseFields,
    { name: "tanggal_permohonan", label: "Tanggal Permohonan" },
    { name: "tanggal_diproses", label: "Tanggal Diproses" },
    { name: "namaPembimbing", label: "Nama Pembimbing" },
    { name: "kaprog", label: "Diproses Oleh" },
  ];

  const getFieldsByMode = () => {
    if (detailMode === "approve") return approveFields;
    if (detailMode === "reject") return rejectFields;
    return viewFields;
  };


  const statusData = [
    {
      status: "disetujui",
      label: "Disetujui",
      percentage: hitungPersentase(summary.approved, summary.totalPengajuan),
      total: summary.approved,
      students: groupedStudents.disetujui,
    },
    {
      status: "belum_diproses",
      label: "Belum Diproses",
      percentage: hitungPersentase(summary.pending, summary.totalPengajuan),
      total: summary.pending,
      students: groupedStudents.belum_diproses,
    },
    {
      status: "ditolak",
      label: "Ditolak",
      percentage: hitungPersentase(summary.rejected, summary.totalPengajuan),
      total: summary.rejected,
      students: groupedStudents.ditolak,
    },
  ];



  return (
    <div className="flex h-screen bg-white">
      <Sidebar active={active} setActive={setActive} />

      <div className="flex flex-col flex-1">
        <Header user={user} notifications={headerNotifications} />



        <main className="p-6 overflow-auto">
          {/* CARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
            {cards.map((item, i) => (
              <DashboardCard key={i} item={item} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* KOLOM KIRI: Notifikasi (2/3 width) */}
                      <div className="lg:col-span-2">
                        <AktivitasTerkini
                          icon={<Bell size={22} />}
                          title="Aktivitas Pengajuan PKL"
                          items={pendingAktivitas}
                          color="#641E21"
                        />
                      </div>
          
                      {/* KOLOM KANAN: Quick Actions + Status (1/3 width) */}
                      <div className="lg:col-span-1 space-y-6">
                        <QuickActions onAction={handleQuickAction} />
                        <StatusPengajuan_PKL data={statusData} />
                      </div>
                    </div>

        </main>
      </div>
      {openDetail && detailData &&
        createPortal(
          <Detail
            mode={detailMode}
            onChangeMode={setDetailMode}
            onSubmit={handleSubmitDetail}
            size="half"
            title="Detail Pengajuan PKL"
            onClose={() => {
              setOpenDetail(false);
              setDetailMode("view");
              setDetailData(null); // 🔥 WAJIB
            }}

            initialData={{
              nama_industri: detailData.industri_nama || "",
              nama_siswa: detailData.siswa_username || "",
              nisn: detailData.siswa_nisn || "",
              kelas: detailData.kelas_nama || "",
              jurusan: detailData.jurusan_nama || "",
              status: detailData.application?.status || "",
              tanggal_permohonan: formatWaktuDetail(
                detailData.application?.tanggal_permohonan
              ),
              tanggal_mulai: "",
              tanggal_terima: formatWaktuDetail(dayjs()),
              pembimbing_id: detailData.application?.pembimbing_guru_id || "",
              kaprog: detailData.namaKaprog || "",
              catatan: "",
            }}
            fields={getFieldsByMode()}
          />,
          document.body
        )
      }


          </div>
        );

  
}
