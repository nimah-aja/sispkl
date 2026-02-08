import axiosInstance from "../../axiosInstance";

/* ================= GET IZIN PEMBIMBING ================= */

export const getIzinPembimbing = async () => {
  try {
    const res = await axiosInstance.get("/api/izin/pembimbing");
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

/* ================= DECIDE IZIN ================= */
/*
payload contoh:

Approve:
{
  status: "Approved",
  rejection_reason: ""
}

Reject:
{
  status: "Rejected",
  rejection_reason: "Siswa tidak hadir tanpa keterangan"
}
*/

export const decideIzin = async (id, status, rejection_reason = "") => {
  try {
    const res = await axiosInstance.patch(`/api/izin/${id}/decide`, {
      status,
      rejection_reason,
    });

    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};
