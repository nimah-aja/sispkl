import axios from "../../axiosInstance"; 

/*  LIST AVAILABLE INDUSTRI  */
export const getAvailableIndustri = async () => {
  try {
    const res = await axios.get("/api/pkl/industri/available");
    return res.data;
  } catch (error) {
    console.error("Error fetching available industri:", error);
    throw error;
  }
};

/*  GET INDUSTRI BY ID  */
export const getIndustriById = async (id) => {
  try {
    const res = await axios.get(`/api/pkl/industri/${id}`);
    return res.data;
  } catch (error) {
    console.error(`Error fetching industri with id ${id}:`, error);
    throw error;
  }
};
