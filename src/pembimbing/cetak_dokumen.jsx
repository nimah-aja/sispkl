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
    const doc = new jsPDF();

    // HEADER
    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("SMK NEGERI 2 SINGOSARI", 105, 18, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("times", "normal");
    doc.text("PROGRAM PRAKTIK KERJA LAPANGAN (PKL)", 105, 26, {
      align: "center",
    });

    doc.line(20, 30, 190, 30);

    // JUDUL SURAT
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(docTitle.toUpperCase(), 105, 42, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(11);

    let isiSurat = "";

    switch (docTitle) {
      case "Surat Pengantar":
        isiSurat = `
Yth. Pimpinan Industri
di Tempat

Dengan hormat,

Bersama ini kami mengantarkan siswa SMK Negeri 2 Singosari
untuk melaksanakan Praktik Kerja Lapangan (PKL)
di perusahaan Bapak/Ibu pimpin.

Identitas siswa akan diisi secara manual setelah dicetak.

Demikian surat pengantar ini kami sampaikan.
Atas perhatian Bapak/Ibu, kami ucapkan terima kasih.
        `;
        break;

      case "Surat Monitoring 1":
        isiSurat = `
Yth. Pimpinan Industri
di Tempat

Dengan hormat,

Sehubungan dengan pelaksanaan Praktik Kerja Lapangan (PKL),
bersama ini kami sampaikan surat monitoring
untuk keperluan penilaian dan evaluasi siswa.

Data siswa dan penilaian diisi oleh pihak industri.

Atas kerja sama Bapak/Ibu, kami ucapkan terima kasih.
        `;
        break;

      case "Surat Monitoring 2":
        isiSurat = `
Yth. Pimpinan Industri
di Tempat

Dengan hormat,

Bersama surat ini kami mohon kesediaan Bapak/Ibu
untuk memberikan evaluasi akhir atau sertifikat PKL
kepada siswa yang telah menyelesaikan kegiatan PKL.

Dokumen ini digunakan sebagai bukti resmi PKL siswa.

Atas perhatian Bapak/Ibu, kami ucapkan terima kasih.
        `;
        break;

      case "Surat Penjemputan":
        isiSurat = `
Yth. Pimpinan Industri
di Tempat

Dengan hormat,

Sehubungan dengan berakhirnya kegiatan Praktik Kerja Lapangan (PKL),
bersama ini kami bermaksud menjemput siswa
yang telah melaksanakan PKL di perusahaan Bapak/Ibu.

Identitas siswa akan dicocokkan saat penjemputan.

Kami mengucapkan terima kasih atas bimbingan
dan kerja sama yang telah diberikan.
        `;
        break;

      default:
        return;
    }

    doc.text(isiSurat.trim(), 20, 55, {
      maxWidth: 170,
      lineHeightFactor: 1.6,
    });

    // FOOTER
    doc.text("Singosari, ............................", 130, 160);
    doc.text("Hormat kami,", 130, 170);
    doc.text("Koordinator PKL", 130, 185);

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
