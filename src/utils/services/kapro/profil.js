import axiosInstance from "../../axiosInstance";

export const updateProfileGuru = async (payload) => {
  try {
    const res = await axiosInstance.put("/api/guru/me", payload);
    return res.data;
  } catch (err) {
    console.error("Update profile guru error:", err);
    throw err;
  }
};
