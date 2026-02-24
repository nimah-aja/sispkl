import api from "../../axiosInstance";

export const getApprovedPKL = async () => {
  try {
    const response = await api.get(
      "/api/pkl/koordinator/approved?limit=1000"
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching approved PKL:", error);
    throw error;
  }
};