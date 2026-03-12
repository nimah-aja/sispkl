import CryptoJS from "crypto-js";

const TOKEN_KEY = import.meta.env.VITE_SECRET_KEY;

// enkripsi
export const encryptToken = (token) => {
  try {
    return CryptoJS.AES.encrypt(token, TOKEN_KEY).toString();
  } catch (err) {
    console.error("Encrypt error:", err);
    return null;
  }
};

// deskripsi
export const decryptToken = (encryptedToken) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, TOKEN_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (err) {
    console.error("Decrypt error:", err);
    return null;
  }
};
