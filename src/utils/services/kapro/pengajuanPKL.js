import axios from "../../axiosInstance";

// export const getPKLApplications = async () => {
//   const res = await axios.get("/api/pkl/applications");

//   return {
//     data: res.data.data || [],
//     total: res.data.total || 0,
//   };
// };
export const getPKLApplications = async () => {
  let page = 1;
  let allData = [];
  let total = 0;

  while (true) {
    const res = await axios.get("/api/pkl/applications", {
      params: { page },
    });

    const data = res.data.data || [];
    total = res.data.total;

    if (data.length === 0) break;

    allData = [...allData, ...data];
    page++;
  }

  return {
    data: allData,
    total,
  };
};

/**
 * ✅ Hitung summary pengajuan PKL
 */
export const getPKLApplicationSummary = async () => {
  const { data } = await getPKLApplications();

  const summary = {
    total: data.length,
    approved: 0,
    rejected: 0,
    pending: 0,
  };

  data.forEach((item) => {
    const status = item.application?.status;

    if (status === "Approved") summary.approved++;
    else if (status === "Rejected") summary.rejected++;
    else summary.pending++;
  });

  return summary;
};

export const approvePKLApplication = async (id, payload) => {
  const res = await axios.put(
    `/api/pkl/applications/${id}/approve`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};


export const rejectPKLApplication = async (id, payload) => {
  const res = await axios.put(`/api/pkl/applications/${id}/reject`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
};
