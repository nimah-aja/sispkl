import axios from "../../axiosInstance";

// =====================================
// GET list pengajuan pindah PKL (kapro)
// =====================================
// GET /api/pindah-pkl/kapro
export const getPindahPklKoordinator = async (params = {}) => {
  try {
    const res = await axios.get("/api/pindah-pkl/koordinator", {
      params, // optional: page, search, status
    });

    return res.data;
  } catch (error) {
    console.error("❌ getPindahPklKoordinator error:", error);
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
export const decidePindahPklKoordinator = async (id, payload) => {
  try {
    const res = await axios.patch(
      `/api/pindah-pkl/${id}/koordinator`,
      payload
    );

    return res.data;
  } catch (error) {
    console.error("❌ decidePindahPklKoordinator error:", error);
    throw error?.response?.data || error;
  }
};
