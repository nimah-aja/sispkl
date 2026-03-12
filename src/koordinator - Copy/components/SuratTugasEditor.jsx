import React, { useState } from "react";
import jsPDF from "jspdf";
import { Plus, Trash, Printer } from "lucide-react";

export default function SuratTugasEditor() {
  const [formData, setFormData] = useState({
    nomorSurat: "001/SMK-N2/PKL/I/2026",
    tanggal: new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    tujuan: "PT Teknologi Indonesia",
    namaSiswa: "Ahmad Rizki",
    nis: "123456",
    kelas: "XII RPL 1",
    jurusan: "Rekayasa Perangkat Lunak",
    periode: "1 Nov – 31 Des 2026",
  });

  const [guruList, setGuruList] = useState([
    { nama: "Budi Santoso", nip: "1978xxxx" },
  ]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const addGuru = () =>
    setGuruList([...guruList, { nama: "", nip: "" }]);

  const removeGuru = (i) =>
    setGuruList(guruList.filter((_, idx) => idx !== i));

  const handleGuru = (i, field, val) => {
    const temp = [...guruList];
    temp[i][field] = val;
    setGuruList(temp);
  };

  const printPDF = () => {
    const doc = new jsPDF();

    doc.text("SURAT TUGAS PKL", 105, 20, { align: "center" });

    doc.text(`Nomor: ${formData.nomorSurat}`, 20, 35);
    doc.text(`Tanggal: ${formData.tanggal}`, 20, 42);

    doc.text(`Nama: ${formData.namaSiswa}`, 20, 55);
    doc.text(`NIS: ${formData.nis}`, 20, 62);
    doc.text(`Kelas: ${formData.kelas}`, 20, 69);
    doc.text(`Jurusan: ${formData.jurusan}`, 20, 76);
    doc.text(`Periode: ${formData.periode}`, 20, 83);

    let y = 95;
    doc.text("Guru Pembimbing:", 20, y);

    guruList.forEach((g, i) => {
      y += 8;
      doc.text(`${i + 1}. ${g.nama} (${g.nip})`, 25, y);
    });

    doc.save("surat_tugas.pdf");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* PREVIEW */}
      <div className="bg-white border rounded-xl p-6 shadow">
        <h2 className="font-bold mb-4">Preview Surat</h2>

        <div className="text-sm space-y-2 font-serif">
          <p className="text-center font-bold">SURAT TUGAS PKL</p>

          <p>Nomor: {formData.nomorSurat}</p>
          <p>Tanggal: {formData.tanggal}</p>

          <hr />

          <p>Nama: {formData.namaSiswa}</p>
          <p>NIS: {formData.nis}</p>
          <p>Kelas: {formData.kelas}</p>
          <p>Jurusan: {formData.jurusan}</p>
          <p>Periode: {formData.periode}</p>

          <p className="font-semibold mt-3">Guru Pembimbing:</p>
          <ul className="list-decimal ml-6">
            {guruList.map((g, i) => (
              <li key={i}>{g.nama} – {g.nip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white border rounded-xl p-6 shadow space-y-4">

        <input
          name="nomorSurat"
          value={formData.nomorSurat}
          onChange={handleChange}
          placeholder="Nomor Surat"
          className="input"
        />

        {["tanggal","tujuan","namaSiswa","nis","kelas","jurusan","periode"].map((f)=>(
          <input
            key={f}
            name={f}
            value={formData[f]}
            onChange={handleChange}
            placeholder={f}
            className="input"
          />
        ))}

        <div>
          <h3 className="font-semibold mb-2">Guru Pembimbing</h3>

          {guruList.map((g,i)=>(
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={g.nama}
                onChange={e=>handleGuru(i,"nama",e.target.value)}
                placeholder="Nama"
                className="input flex-1"
              />

              <input
                value={g.nip}
                onChange={e=>handleGuru(i,"nip",e.target.value)}
                placeholder="NIP"
                className="input flex-1"
              />

              <button onClick={()=>removeGuru(i)}>
                <Trash size={18}/>
              </button>
            </div>
          ))}

          <button onClick={addGuru} className="flex items-center gap-1 text-sm text-blue-600">
            <Plus size={16}/> Tambah Guru
          </button>
        </div>

        <button
          onClick={printPDF}
          className="bg-red-700 text-white py-2 rounded flex items-center justify-center gap-2"
        >
          <Printer size={16}/> Cetak PDF
        </button>
      </div>

    </div>
  );
}
