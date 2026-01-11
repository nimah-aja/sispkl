import axios from "../../axiosInstance";

/* ================= CREATE ================= */
// payload:
// {
//   deskripsi,
//   jenis_kegiatan,
//   tahun_ajaran_id,
//   tanggal_mulai,
//   tanggal_selesai
// }
export const createKegiatanPKL = async (data) => {
  const payload = {
    deskripsi: data.deskripsi,
    jenis_kegiatan: data.jenis_kegiatan,
    tahun_ajaran_id: data.tahun_ajaran_id,
    tanggal_mulai: data.tanggal_mulai,
    tanggal_selesai: data.tanggal_selesai,
  };

  const res = await axios.post("/api/kegiatan-pkl", payload);
  return res.data;
};

/* ================= LIST BY TAHUN AJARAN (HISTORY) ================= */
export const getKegiatanPKLByTahunAjaran = async (tahunAjaranId) => {
  const res = await axios.get(
    `/api/kegiatan-pkl/tahun-ajaran/${tahunAjaranId}`
  );

  // ambil field yang dipakai aja
  return res.data.map((item) => ({
    id: item.id,
    deskripsi: item.deskripsi,
    jenis_kegiatan: item.jenis_kegiatan,
    status: item.status,
    tanggal_mulai: item.tanggal_mulai,
    tanggal_selesai: item.tanggal_selesai,
    tahun_ajaran_id: item.tahun_ajaran_id,
  }));
};

/* ================= UPDATE ================= */
export const updateKegiatanPKL = async (id, data) => {
  const payload = {
    deskripsi: data.deskripsi,
    jenis_kegiatan: data.jenis_kegiatan,
    tahun_ajaran_id: data.tahun_ajaran_id,
    tanggal_mulai: data.tanggal_mulai,
    tanggal_selesai: data.tanggal_selesai,
    status: data.status, // kalau mau update status
  };

  const res = await axios.put(`/api/kegiatan-pkl/${id}`, payload);
  return res.data;
};

/* ================= DELETE ================= */
export const deleteKegiatanPKL = async (id) => {
  const res = await axios.delete(`/api/kegiatan-pkl/${id}`);
  return res.data;
};
