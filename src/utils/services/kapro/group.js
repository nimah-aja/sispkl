// utils/services/kapro/group.js

import axios from "../../axiosInstance";

/**
 * GET semua group yang menunggu review
 * @returns {Promise<Array>}
 */
export const getGroupReview = async () => {
  try {
    const res = await axios.get("/api/pkl/group/review");
    return res.data; // Langsung array
  } catch (error) {
    console.error("Error fetching group review:", error);
    throw error;
  }
};

/**
 * APPROVE pengajuan group PKL
 * @param {number|string} reviewId - id review/group
 * @param {number|string} pembimbing_guru_id - id guru pembimbing
 * @returns {Promise<object>}
 */
export const approveGroupReview = async (reviewId, pembimbing_guru_id) => {
  try {
    console.log(`Approving group ${reviewId} with pembimbing_guru_id:`, pembimbing_guru_id);
    
    const payload = {
      pembimbing_guru_id: Number(pembimbing_guru_id) // Pastikan field name sesuai yang diharapkan backend
    };
    
    console.log("Approve payload:", payload);
    
    const res = await axios.post(
      `/api/pkl/group/review/${reviewId}/approve`,
      payload
    );
    
    console.log("Approve response:", res.data);
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
    console.log(`Rejecting group ${reviewId} with reason:`, reason);
    
    const payload = {
      reason: reason
    };
    
    console.log("Reject payload:", payload);
    
    const res = await axios.post(
      `/api/pkl/group/review/${reviewId}/reject`,
      payload
    );
    
    console.log("Reject response:", res.data);
    return res.data;
  } catch (error) {
    console.error("Error rejecting group review:", error);
    throw error;
  }
};