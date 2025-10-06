## Tahapan Buat CRUD Page Baru dari Template (misalnya `dashboard_admin_kelas`)

### 1. **Buat service API baru di `utils/services/`**
Ini supaya halaman bisa ambil & kirim data ke backend.

* Copy file `get_jurusan.js`, `add_jurusan.js`, `edit_jurusan.js`, `delete_jurusan.js`.
* Ganti namanya jadi:

  * `get_kelas.js`
  * `add_kelas.js`
  * `edit_kelas.js`
  * `delete_kelas.js`

* Di dalam file, ubah endpoint:
  // get_kelas.js
  import axios from "../axiosInstance";

export const getJurusan = async () => {
  const res = await axios.get("/api/kelas", {         => ubah ke kelas
    params: { page: 1, limit: 100 } 
  });

  const jurusanList = res.data.data.data;
  jurusanList.sort((a, b) => a.nama.localeCompare(b.nama));   //sort A-Z

  return jurusanList;
};


  Lakukan hal yang sama untuk `add_kelas`, `edit_kelas`, `delete_kelas`.

### 2. **Buat file halaman baru untuk halaman CRUD utama**

* Copy `dashboard_admin_jurusan.jsx` → rename jadi `dashboard_admin_kelas.jsx`.
* Buka file `dashboard_admin_kelas.jsx`, ubah import servicenya:

  // import request
  import { getGuru } from "../utils/services/get_kelas";
  import { createGuru } from "../utils/services/add_kelas";
  import { deleteGuru } from "../utils/services/delete_kelas";
  import { updateGuru } from "../utils/services/edit_kelas";

### 3. **Ubah kolom tabel (`columns`)**
Ganti sesuai data kelas. Misalnya API guru punya `jurusan_id` dan `nama`:

const columns = [
  { label: "Jurusan ID", key: "jurusan_id" },
  { label: "Nama Guru", key: "nama" },
];

### 4. **Ubah input form (`inputFields`)**
Sama seperti kolom tabel, sesuaikan dengan data yang mau diisi.

// width value nya hanya half dan full jadi pilih salah satu
const inputFields = [
  { label: "Jurusan ID", name: "jurusan_id", width: "full", minLength: 18 }
  { label: "Nama Guru", name: "nama", width: "full", minLength: 3 },
];

### 5. **Ubah logika validasi di `onSubmit`**

Misalnya validasi jurusan_ID harus minimal 2 digit dan Nama minimal 2 huruf:

// validasi Jurusan ID
const nip = newKelas.jurusan_id || "";
if (jurusan_id.length !== 18) {
  setFieldErrors({
    jurusan_id: `Jurusan ID harus 18 digit. Kamu baru nulis ${jurusan_id.length} digit.`,
  });
  return;
}

// validasi Nama
const nama = newKelas.nama || "";
if (nama.length < 3) {
  setFieldErrors({
    nama: `Nama Guru minimal 2 huruf. Tambahkan ${3 - nama.length} huruf lagi.`,
  });
  return;
}

### 6. Ubah redirect / routing di App.jsx
<Route path="/dashboard/admin/kelas" element={<dashboard_admin_kelas />} />

### 7. Ubah icon active sidebar
lihat dlu di admin/components/Sidebar.jsx di line 15, misal ini page kelas maka lihat key nya "sidebarBook". 
Lalu ke file dashboard_admin_kelas.jsx di line 26, bagian sidebarGrad ubah => sidebarBook
