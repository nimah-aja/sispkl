import axios from "../../axiosInstance";

// GET SEKOLAH AKTIF

export const getSekolah = async () => {
  try {
    const res = await axios.get("/api/sekolah");
    console.log("GET /api/sekolah response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error in getSekolah:", error);
    throw error;
  }
};

// GET SEKOLAH BY ID
export const getSekolahById = async (id) => {
  try {
    const res = await axios.get(`/api/sekolah/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error in getSekolahById:", error);
    throw error;
  }
};

// CREATE SEKOLAH (POST)
export const createSekolah = async (payload) => {
  const body = {
    akreditasi: payload.akreditasi,
    email: payload.email,
    jalan: payload.jalan,
    jenis_sekolah: payload.jenisSekolah,
    kabupaten_kota: payload.kabupatenKota,
    kecamatan: payload.kecamatan,
    kelurahan: payload.kelurahan,
    kepala_sekolah: payload.kepalaSekolah,
    kode_pos: payload.kodePos,
    logo: payload.logo,
    nama_sekolah: payload.namaSekolah,
    nip_kepala_sekolah: payload.nipKepalaSekolah,
    nomor_telepon: payload.nomorTelepon,
    npsn: payload.npsn,
    provinsi: payload.provinsi,
    website: payload.website,
  };

  console.log("POST /api/sekolah body:", body);

  try {
    const res = await axios.post("/api/sekolah", body);
    return res.data;
  } catch (error) {
    console.error("Error in createSekolah:", error);
    throw error;
  }
};

// UPDATE SEKOLAH (PUT) 
export const updateSekolah = async (id, payload) => {
  console.log("=== DEBUG updateSekolah ===");
  console.log("ID:", id);
  console.log("Payload dari frontend:", payload);
  
  if (!payload) {
    console.error("Payload is undefined!");
    throw new Error("Payload tidak boleh kosong");
  }

  const body = {
    akreditasi: payload.akreditasi || "",
    email: payload.email || "",
    jalan: payload.jalan || "",
    jenis_sekolah: payload.jenisSekolah || "",
    kabupaten_kota: payload.kabupatenKota || "",
    kecamatan: payload.kecamatan || "",
    kelurahan: payload.kelurahan || "",
    kepala_sekolah: payload.kepalaSekolah || "",
    kode_pos: payload.kodePos || "",
    logo: payload.logo || "",
    nama_sekolah: payload.namaSekolah || "",
    nip_kepala_sekolah: payload.nipKepalaSekolah || "",
    nomor_telepon: payload.nomorTelepon || "",
    npsn: payload.npsn || "",
    provinsi: payload.provinsi || "",
    website: payload.website || "",
  };

  console.log("Body yang dikirim ke API:", body);

  try {
    const res = await axios.put(`/api/sekolah/${id}`, body);
    console.log("Response dari API:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error dalam updateSekolah:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
      console.error("Headers:", error.response.headers);
    } else if (error.request) {
      console.error("Request:", error.request);
    } else {
      console.error("Message:", error.message);
    }
    throw error;
  }
};