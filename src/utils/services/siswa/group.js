import axios from "../../axiosInstance"; 

export const getAvailableMembers = async () => {
  try {
    const res = await axios.get(
      "/api/pkl/group/available-members",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error get available members:", error);
    throw error;
  }
};