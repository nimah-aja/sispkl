// src/utils/services/penilaian/review.js
import axiosInstance from "../../axiosInstance";

/**
 * GET
 * List hasil penilaian final untuk review (koordinator only)
 * @param {object} params - optional query params (pagination, filter, dll)
 */
export const getReviewPenilaian = async (params = {}) => {
  try {
    const response = await axiosInstance.get(
      "/api/penilaian/review",
      { params }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching review penilaian:", error);
    throw error;
  }
};

/**
 * GET
 * Detail hasil penilaian final untuk review (koordinator only)
 * @param {number} applicationId
 */
export const getDetailReviewPenilaian = async (applicationId) => {
  try {
    const response = await axiosInstance.get(
      `/api/penilaian/review/${applicationId}`
    );

    return response.data;
  } catch (error) {
    console.error(
      `Error fetching review detail for application ${applicationId}:`,
      error
    );
    throw error;
  }
};