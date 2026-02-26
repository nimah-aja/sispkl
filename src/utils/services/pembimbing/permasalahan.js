import axios from "../../axiosInstance";

/**
 * POST - Create student issue (pembimbing only)
 * payload:
 * {
 *   deskripsi: string,
 *   judul: string,
 *   kategori: string,
 *   siswa_id: number
 * }
 */
export const createStudentIssue = async (payload) => {
  try {
    const res = await axios.post("/api/student-issues", {
      deskripsi: payload.deskripsi,
      judul: payload.judul,
      kategori: payload.kategori,
      siswa_id: payload.siswa_id,
    });

    return res.data;
  } catch (error) {
    console.error("Error creating student issue:", error);
    throw error?.response?.data || error;
  }
};


/**
 * GET - List my student issues (pembimbing only)
 */
export const getMyStudentIssues = async () => {
  try {
    const res = await axios.get("/api/student-issues/me");
    return res.data;
  } catch (error) {
    console.error("Error fetching my student issues:", error);
    throw error?.response?.data || error;
  }
};

export const updateStudentIssue = async (id, payload) => {
  try {
    const res = await axios.patch(`/api/student-issues/${id}`, {
      deskripsi: payload.deskripsi,
      status: payload.status,
      tindak_lanjut: payload.tindak_lanjut,
    });

    return res.data;
  } catch (error) {
    console.error(`Error updating student issue with id ${id}:`, error);
    throw error?.response?.data || error;
  }
};