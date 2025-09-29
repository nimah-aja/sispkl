import axios from "../axiosInstance";

export const getIndustri = async () => {
  const res = await axios.get("/api/industri", {
    params: { page: 1, limit: 100 } 
  });

  const industriList = res.data.data.data;
  industriList.sort((a, b) => a.nama.localeCompare(b.nama));   //sort A-Z

  return industriList;
};
