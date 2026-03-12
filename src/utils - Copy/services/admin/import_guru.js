import axios from "../../axiosInstance";

// PREVIEW BULK GURU
export const previewGuruBulk = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    "/api/guru/bulk/preview",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

// IMPORT BULK GURU
export const importGuruBulk = async (sessionId) => {
  const res = await axios.post(
    "/api/guru/bulk/import",
    {
      session_id: sessionId,
    }
  );

  return res.data;
};