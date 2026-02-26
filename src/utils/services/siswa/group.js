import axios from "../../axiosInstance";

/**
 * GET - Get my PKL groups (siswa only)
 * Mengambil semua grup PKL dimana siswa adalah leader atau member
 */
export const getMyPklGroups = async () => {
  try {
    const res = await axios.get("/api/pkl/group/my");
    return res.data;
  } catch (error) {
    console.error("Error fetching my PKL groups:", error);
    throw error?.response?.data || error;
  }
};

export const getAvailableMembers = async () => {
  try {
    const res = await axios.get("/api/pkl/group/available-members");
    return res.data;
  } catch (error) {
    console.error("Error fetching available members:", error);
    throw error?.response?.data || error;
  }
};

export const createPklGroup = async (payload) => {
  try {
    const res = await axios.post("/api/pkl/group", payload);
    return res.data;
  } catch (error) {
    console.error("Error creating PKL group:", error);
    throw error?.response?.data || error;
  }
};

/* ===============================
   DELETE GROUP (leader only)
   DELETE /api/pkl/group/{id}
================================ */
export const deleteGroup = async (groupId) => {
  try {
    const res = await axios.delete(`/api/pkl/group/${groupId}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
};


/* ===============================
   UPDATE GROUP MEMBERS (leader only)
   PUT /api/pkl/group/{id}/members
================================ */
export const updateGroupMembers = async (groupId, payload) => {
  try {
    // Payload harus sesuai dengan yang dikirim dari modal
    // yaitu { invited_members: ["Nama Anggota 1", "Nama Anggota 2"] }
    const res = await axios.put(`/api/pkl/group/${groupId}/members`, payload);
    return res.data;
  } catch (error) {
    console.error("Error updating group members:", error);
    throw error;
  }
};

export const removeGroupMember = async (groupId, siswaId) => {
  try {
    const res = await axios.delete(
      `/api/pkl/group/${groupId}/members/${siswaId}`
    );
    return res.data;
  } catch (error) {
    console.error("Error removing group member:", error);
    throw error;
  }
};

export const getMyGroupInvitations = async () => {
  try {
    const res = await axios.get("/api/pkl/group/invitations");
    return res.data;
  } catch (error) {
    console.error("Error fetching group invitations:", error);
    throw error;
  }
};

// src/utils/services/siswa/group.js

export const acceptGroupInvitation = async (invitationId, payload) => {
  try {
    const res = await axios.post(`/api/pkl/group/invitations/${invitationId}`, payload);
    return res.data;
  } catch (error) {
    console.error("Error accepting/rejecting group invitation:", error);
    throw error;
  }
};

export const submitGroupPKL = async (groupId, payload) => {
  try {
    const res = await axios.post(
      `/api/pkl/group/${groupId}/submit`,
      payload
    );
    return res.data;
  } catch (error) {
    console.error("Error submitting group PKL:", error);
    throw error;
  }
};