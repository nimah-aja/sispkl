// src/utils/services/penilaian/pembimbing.js
import axiosInstance from "../../axiosInstance";

/**
 * GET
 * List siswa ampuan pembimbing
 * Dengan status penilaian ringkas (pembimbing only)
 */
export const getStudentsByPembimbing = async () => {
  try {
    const response = await axiosInstance.get(
      "/api/penilaian/pembimbing/students"
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching pembimbing students:", error);
    throw error;
  }
};

/**
 * GET
 * Detail penilaian berdasarkan application ID
 * @param {number} id - application_id
 */
export const getPenilaianApplicationById = async (id) => {
  try {
    const response = await axiosInstance.get(
      `/api/penilaian/applications/${id}`
    );

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching penilaian application with id ${id}:`,
      error
    );
    throw error;
  }
};

/**
 * PUT
 * Ubah status penilaian menjadi draft
 * @param {number} id - application_id
 * @param {object} payload - optional body (kalau ada)
 */
export const setPenilaianToDraft = async (id, payload = {}) => {
  try {
    const response = await axiosInstance.put(
      `/api/penilaian/applications/${id}/draft`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      `Error setting penilaian application ${id} to draft:`,
      error
    );
    throw error;
  }
};

/**
 * POST
 * Finalize penilaian application
 * @param {number} id - application_id
 * @param {object} payload - optional body (kalau ada)
 */
export const finalizePenilaian = async (id, payload = {}) => {
  try {
    const response = await axiosInstance.post(
      `/api/penilaian/applications/${id}/finalize`,
      payload
    );

    return response.data;
  } catch (error) {
    console.error(
      `Error finalizing penilaian application ${id}:`,
      error
    );
    throw error;
  }
};