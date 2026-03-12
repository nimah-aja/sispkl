import axiosInstance from "../../axiosInstance";

export const updateGuruProfile = async (payload) => {
  const response = await axiosInstance.put("/api/guru/me", payload);
  return response.data;
};
