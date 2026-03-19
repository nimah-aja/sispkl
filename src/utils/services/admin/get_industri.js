import axios from "../../axiosInstance";

export const getIndustri = async () => {
  const res = await axios.get("/api/industri", {
    params: { page: 1, limit: 100 } 
  });

  const industriList = res.data.data.data;
  industriList.sort((a, b) => a.nama.localeCompare(b.nama));  

  return industriList;
};

// Fungsi baru untuk mengambil detail industri berdasarkan ID
export const getIndustriById = async (id) => {
  try {
    const res = await axios.get(`/api/industri/${id}`);
    
    // Response structure dari API
    // {
    //   "success": true,
    //   "data": {
    //     "id": 15,
    //     "jurusan_id": 1,
    //     "nama": "BCA KCU Malang",
    //     "alamat": "Jl. Jenderal Basuki Rahmat No. 70-74...",
    //     "no_telp": "08111500998",
    //     "email": "halobca@bca.co.id",
    //     "bidang": "Administrasi",
    //     "pic": "Ahmad Husni",
    //     "pic_telp": "080127380192",
    //     "nama_pimpinan": null,
    //     "jabatan_pimpinan": null,
    //     "nip_pembimbing": null,
    //     "nip_pimpinan": null,
    //     "jabatan_pembimbing": null,
    //     "is_active": true,
    //     "created_at": "2026-03-11T01:58:41.760419Z",
    //     "updated_at": "2026-03-11T20:35:09.677153Z"
    //   },
    //   "message": "Industri retrieved successfully"
    // }
    
    // Akses data dari struktur response
    const industriData = res.data.data;
    
    return industriData;
  } catch (error) {
    console.error(`Error fetching industri with ID ${id}:`, error);
    throw error;
  }
};

// Atau jika ingin versi yang lebih sederhana (langsung return data tanpa try-catch)
export const getIndustriByIdSimple = async (id) => {
  const res = await axios.get(`/api/industri/${id}`);
  return res.data.data; // Langsung kembalikan data industri
};