import uploadImg from "../assets/upload.svg";
import Add from "./components/Add";

export default function UploadBuktiPengantaran() {
  const fields = [
    
    {
      name: "tujuan",
      label: "Tujuan",
      type: "select",
      required: true,
      options: [
        { label: "Pengantaran", value: "pengantaran" },
        { label: "Penjemputan", value: "penjemputan" },
      ],
    },
    {
      name: "nama_industri",
      label: "Nama Industri",
      type: "text",
      required: true,
    },
    {
      name: "tanggal_pengantaran",
      label: "Tanggal Pengantaran",
      type: "date",
      placeholder : "Tanggal",
      required: true,
      width : "full"
    },
    {
      name: "keterangan",
      label: "Keterangan",
      type: "textarea",
      rows: 4,
      width: "full",
    },
  ];

  return (
    <Add
      title="Upload Bukti Pengantaran"
      fields={fields}
      image={uploadImg}
      onCancel={() => window.history.back()}
      onSubmit={(formData) => {
        console.log("FORM DATA:");
        for (let pair of formData.entries()) {
          console.log(pair[0], pair[1]);
        }
      }}
      containerClassName="w-full max-w-[1200px] max-h-[90vh] bg-white"
    />
  );
}
