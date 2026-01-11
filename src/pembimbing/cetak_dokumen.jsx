import React from "react";
import { ArrowLeft, Printer, FileText } from "lucide-react";
import jsPDF from "jspdf";

export default function CetakDokumenPKL() {
  const documents = [
    {
      id: 1,
      title: "Surat Pengantar",
      description: "Cetak surat pengantar siswa ke perusahaan",
    },
    {
      id: 2,
      title: "Surat Monitoring 1",
      description: "Cetak form penilaian untuk perusahaan",
    },
    {
      id: 3,
      title: "Surat Monitoring 2",
      description: "Cetak sertifikat siswa",
    },
    {
      id: 4,
      title: "Surat Penjemputan",
      description: "Cetak laporan progress siswa",
    },
  ];

  /* ===================== PDF SYSTEM ===================== */
  const handlePrint = (docTitle) => {
  const doc = new jsPDF("p", "mm", "a4");

  /* ================= KOP SURAT ================= */
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("SMK NEGERI 2 SINGOSARI", 105, 18, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text(
    "JL. PERUSAHAAN NO. 20 TUNJUNGTIRTO-SINGOSARI\nKab. Malang, Jawa Timur",
    105,
    24,
    { align: "center" }
  );

  doc.setLineWidth(0.8);
  doc.line(20, 32, 190, 32);

  /* ================= TANGGAL ================= */
  doc.setFontSize(11);
  doc.text("Singosari, ", 190, 42, { align: "right" });

  /* ================= TUJUAN ================= */
  doc.text("Kepada Yth.", 20, 55);
  doc.setFont("times", "bold");
  doc.text("", 20, 61);
  doc.setFont("times", "normal");
  doc.text("Di Tempat", 20, 67);

  /* ================= JUDUL SURAT ================= */
  doc.setFont("times", "bold");
  doc.setFontSize(12);
  doc.text("SURAT PERMOHONAN", 105, 80, { align: "center" });

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.text("Nomor: 001/SMK-N2/PKL/I/2026", 105, 86, {
    align: "center",
  });

  /* ================= ISI SURAT ================= */
  doc.setFontSize(11);
  doc.text("Dengan hormat,", 20, 100);

  doc.text(
    "Sehubungan dengan program Praktik Kerja Lapangan (PKL), kami mengajukan\n" +
      "permohonan kepada Bapak/Ibu untuk memberikan kesempatan kepada siswa\n" +
      "kami berikut:",
    20,
    108,
    { lineHeightFactor: 1.6 }
  );

  /* ================= DATA SISWA ================= */
  let y = 135;

  doc.text("Nama", 20, y);
  doc.text(": Ahmad Rizki Pratama", 60, y);

  y += 8;
  doc.text("NIS", 20, y);
  doc.text(": 8329849289482", 60, y);

  y += 8;
  doc.text("Kelas", 20, y);
  doc.text(": XII RPL 1", 60, y);

  y += 8;
  doc.text("Jurusan", 20, y);
  doc.text(": Rekayasa Perangkat Lunak", 60, y);

  y += 8;
  doc.text("Periode PKL", 20, y);
  doc.text(": 1 November – 31 Desember 2026", 60, y);

  /* ================= PENUTUP ================= */
  doc.text(
    "Demikian surat permohonan ini kami sampaikan.\n" +
      "Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.",
    20,
    y + 20,
    { lineHeightFactor: 1.6 }
  );

  /* ================= TANDA TANGAN ================= */
  doc.text("Kepala Sekolah,", 130, 220);
  doc.text("SMK Negeri 2 Singosari", 130, 226);

  doc.setFont("times", "bold");
  doc.text("Sumijah, S.Pd., M.Si", 130, 250);

  doc.setFont("times", "normal");
  doc.text("NIP. 196505121990031004", 130, 256);

  /* ================= SAVE ================= */
  doc.save(`${docTitle.replaceAll(" ", "_")}.pdf`);
};

  /* ===================== END PDF ===================== */

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: "#E1D6C4" }}
    >
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className="border-b p-6 flex items-center gap-4"
          style={{ borderColor: "#000000" }}
        >
          <button
            onClick={handleBack}
            style={{
              backgroundColor: "#EC933A",
              width: "38px",
              height: "38px",
              borderRadius: "9999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              padding: 0,
            }}
          >
            <ArrowLeft size={20} color="white" strokeWidth={3} />
          </button>

          <h1
            className="font-bold text-black"
            style={{ fontSize: "22px", fontFamily: "Poppins, sans-serif" }}
          >
            Cetak Dokumen PKL
          </h1>
        </div>

        {/* Content Grid */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              style={{ borderColor: "#000000" }}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-9 h-9" style={{ color: "#BC2424" }} />
                </div>

                <div>
                  <h2
                    className="text-[20px] font-bold"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {doc.title}
                  </h2>

                  <p
                    className="text-[15px] text-gray-600"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {doc.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handlePrint(doc.title)}
                className="w-full text-white font-medium text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "#BC2424",
                  fontFamily: "Poppins, sans-serif",
                }}
              >
                <Printer className="w-4 h-4" />
                Cetak PDF
              </button>
            </div>
          ))}
        </div>

        <div
          className="border-t px-6 pt-10 pb-10"
          style={{ borderColor: "#000000" }}
        ></div>
      </div>
    </div>
  );
}
