import axios from "../../axiosInstance";

// =====================================
// GET list pengajuan pindah PKL (kapro)
// =====================================
// GET /api/pindah-pkl/kapro
export const getPindahPklKapro = async (params = {}) => {
  try {
    const res = await axios.get("/api/pindah-pkl/kaprog", {
      params, // optional: page, search, status
    });

    return res.data;
  } catch (error) {
    console.error("❌ getPindahPklKapro error:", error);
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
export const decidePindahPklKapro = async (id, payload) => {
  try {
    const res = await axios.patch(
      `/api/pindah-pkl/${id}/kaprog`,
      payload
    );

    return res.data;
  } catch (error) {
    console.error("❌ decidePindahPklKapro error:", error);
    throw error?.response?.data || error;
  }
};
