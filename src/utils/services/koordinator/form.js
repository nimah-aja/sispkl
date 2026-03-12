import penilaianApi from "../../axiosInstance";

/**
 * GET
 * Ambil semua form penilaian
 */
export const getFormsPenilaian = async () => {
  try {
    const res = await penilaianApi.get("/api/penilaian/forms");
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * POST
 * Buat form penilaian baru
 * payload:
 * {
 *   nama: string,
 *   items: [
 *     {
 *       tujuan_pembelajaran: string,
 *       urutan: number
 *     }
 *   ]
 * }
 */
export const createFormPenilaian = async (payload) => {
  try {
    const res = await penilaianApi.post("/api/penilaian/forms", payload);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * PUT
 * Update form penilaian
 */
export const updateFormPenilaian = async (id, payload) => {
  try {
    const res = await penilaianApi.put(`/api/penilaian/forms/${id}`, payload);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * POST
 * Aktifkan form penilaian
 */
export const activateFormPenilaian = async (id) => {
  try {
    const res = await penilaianApi.post(`/api/penilaian/forms/${id}/activate`);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};