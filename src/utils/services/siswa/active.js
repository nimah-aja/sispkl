// services/pklService.js
export const getActivePKL = async () => {
  try {
    const response = await fetch("/api/pkl/active/me");
    if (!response.ok) throw new Error("Failed to fetch active PKL");
    const data = await response.json();

    // hitung sisa hari
    const today = new Date();
    const endDate = new Date(data.tanggal_selesai);
    const diffTime = endDate - today; // selisih milidetik
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      active: data.status === "Approved",
      sisaHari: diffDays > 0 ? diffDays : 0,
    };
  } catch (error) {
    console.error(error);
    return { active: false, sisaHari: 0 };
  }
};
