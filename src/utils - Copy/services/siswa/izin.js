import axiosInstance from "../../axiosInstance";

export const createIzin = async ({ tanggal, jenis, keterangan, files }) => {
  try {
    const formData = new FormData();

    formData.append("tanggal", tanggal);
    formData.append("jenis", jenis);
    formData.append("keterangan", keterangan);

    // files = array File
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await axiosInstance.post("/api/izin", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

export const getIzinMe = async (status) => {
  const params = {};

  if (status) params.status = status;

  const res = await axiosInstance.get("/api/izin/me", { params });


  return res.data;
};

// UPDATE IZIN (PUT)
export const updateIzin = async (id, { tanggal, jenis, keterangan, files }) => {
  try {
    const formData = new FormData();

    if (tanggal) formData.append("tanggal", tanggal);
    if (jenis) formData.append("jenis", jenis);
    if (keterangan) formData.append("keterangan", keterangan);

    // optional files
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("files", file);
      });
    }

    const res = await axiosInstance.put(`/api/izin/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};


// DELETE IZIN
export const deleteIzin = async (id) => {
  try {
    const res = await axiosInstance.delete(`/api/izin/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

