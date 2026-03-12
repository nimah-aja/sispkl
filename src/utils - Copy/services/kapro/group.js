// utils/services/admin/groupReview.js

import axios from "../../axiosInstance";

/**
 * GET semua group yang menunggu review
 * @returns {Promise<object>}
 */
export const getGroupReview = async () => {
  try {
    const res = await axios.get("/api/pkl/group/review");
    return res.data;
  } catch (error) {
    console.error("Error fetching group review:", error);
    throw error;
  }
};

/**
 * APPROVE pengajuan group PKL
 * @param {number|string} reviewId - id review/group
 * @param {number|string} pembimbing_id - id guru pembimbing
 * @returns {Promise<object>}
 */
export const approveGroupReview = async (reviewId, pembimbing_id) => {
  try {
    const res = await axios.post(
      `/api/pkl/group/review/${reviewId}/approve`,
      {
        pembimbing_id
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error approving group review:", error);
    throw error;
  }
};

/**
 * REJECT pengajuan group PKL
 * @param {number|string} reviewId - id review/group
 * @param {string} reason - alasan penolakan
 * @returns {Promise<object>}
 */
export const rejectGroupReview = async (reviewId, reason) => {
  try {
    const res = await axios.post(
      `/api/pkl/group/review/${reviewId}/reject`,
      {
        reason
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error rejecting group review:", error);
    throw error;
  }
};