export default function SuratPreview({ data, onExport }) {
  return (
    <div className="w-full max-w-sm bg-gray-50 rounded-xl p-4 shadow-inner">
      <h3 className="text-center font-bold mb-2">SURAT PENGANTARAN</h3>
      <p className="text-xs text-center mb-4">
        No: {data.nomor || "—"}
      </p>

      <div className="text-sm space-y-2">
        <p><strong>Kepada:</strong> {data.kepada || "—"}</p>
        <p><strong>Alamat:</strong> {data.alamat || "—"}</p>
        <p><strong>Perihal:</strong> {data.perihal || "—"}</p>

        <p className="mt-3 whitespace-pre-line">
          {data.isi || "Isi surat akan tampil di sini"}
        </p>

        <p className="mt-6">
          Hormat kami,
          <br />
          <strong>{data.pengirim || "—"}</strong>
          <br />
          {data.jabatan || "—"}
        </p>
      </div>

      <button
        onClick={onExport}
        className="mt-4 w-full bg-[#641E20] text-white py-2 rounded-lg"
      >
        Cetak PDF
      </button>
    </div>
  );
}
