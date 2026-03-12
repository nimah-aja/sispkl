import axios from "../../axiosInstance";

// PREVIEW BULK SISWA

export const previewSiswaBulk = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    "/api/siswa/bulk/preview",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

// IMPORT BULK SISWA

export const importSiswaBulk = async (sessionId) => {
  const res = await axios.post(
    "/api/siswa/bulk/import",
    {
      session_id: sessionId,
    }
  );

  return res.data;
};
