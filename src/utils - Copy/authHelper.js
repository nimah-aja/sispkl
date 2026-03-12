import axios from "./axiosInstance";
import { encryptToken, decryptToken } from "./crypto";

export const getAccessToken = () => {
  const token = localStorage.getItem("access_token");
  return token ? decryptToken(token) : null;
};

export const getRefreshToken = () => {
  const token = localStorage.getItem("refresh_token");
  return token ? decryptToken(token) : null;
};

export const setTokens = ({ access_token, refresh_token }) => {
  if (access_token) localStorage.setItem("access_token", encryptToken(access_token));
  if (refresh_token) localStorage.setItem("refresh_token", encryptToken(refresh_token));
};

export const removeTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("role");
};

export const refreshAccessToken = async () => {
  try {
    const refresh_token = getRefreshToken();
    if (!refresh_token) return null;

    const res = await axios.post("/auth/refresh", { refresh_token });
    const { access_token, refresh_token: newRefreshToken } = res.data;

    setTokens({ access_token, refresh_token: newRefreshToken });
    return access_token;
  } catch (err) {
    console.error("Refresh token failed:", err);
    removeTokens();
    return null;
  }
};
