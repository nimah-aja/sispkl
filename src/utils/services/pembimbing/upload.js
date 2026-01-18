import axios from "../../axiosInstance";

export const uploadImage = async (file) => {
  try {
    // 1. Validasi bahwa file adalah gambar
    if (!file.type.startsWith("image/")) {
      throw new Error("File harus berupa gambar (JPEG, PNG, etc.)");
    }

    // 2. Konversi ke JPEG jika belum
    let processedBlob;
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      processedBlob = file;
    } else {
      // Konversi format lain ke JPEG
      processedBlob = await convertToJpeg(file);
    }

    // 3. Kirim sebagai raw binary
    const response = await axios.post(
      "/api/upload/image",
      processedBlob, // Raw binary file
      {
        headers: {
          "Content-Type": "image/jpeg", // Sesuai dengan yang diharapkan server
        },
        timeout: 60000, // 60 detik
      }
    );

    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

// Fungsi untuk konversi ke JPEG
const convertToJpeg = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Gagal mengkonversi ke JPEG"));
              return;
            }
            resolve(
              new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
              })
            );
          },
          "image/jpeg",
          0.9 // Kualitas 90%
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};