import axios from "../../axiosInstance";

// =====================================
// GET list pengajuan pindah PKL (pembimbing)
// =====================================
// GET /api/pindah-pkl/pembimbing
export const getPindahPklPembimbing = async (params = {}) => {
  try {
    const res = await axios.get("/api/pindah-pkl/pembimbing", {
      params, // optional: page, search, status
    });

    return res.data;
  } catch (error) {
    console.error("❌ getPindahPklPembimbing error:", error);
    throw error?.response?.data || error;
  }
};


// ==================================================
// PATCH terima / tolak pengajuan pindah PKL
// ==================================================
// PATCH /api/pindah-pkl/{id}/pembimbing
// payload:
// {
//   status: "approved" | "rejected",
//   catatan?: string
// }
export const decidePindahPklPembimbing = async (id, payload) => {
  try {
    const res = await axios.patch(
      `/api/pindah-pkl/${id}/pembimbing`,
      payload
    );

    return res.data;
  } catch (error) {
    console.error("❌ decidePindahPklPembimbing error:", error);
    throw error?.response?.data || error;
  }
};
