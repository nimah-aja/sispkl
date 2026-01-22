// import axios from "axios";
// import {
//   getAccessToken,
//   refreshAccessToken,
//   removeTokens
// } from "./authHelper";

// export const createAxios = (baseURL) => {
//   const instance = axios.create({
//     baseURL,
//     timeout: 90000
//   });

//   // request interceptor
//   instance.interceptors.request.use(
//     (config) => {
//       const token = getAccessToken();
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//       return config;
//     },
//     (error) => Promise.reject(error)
//   );

//   // response interceptor
//   instance.interceptors.response.use(
//     (res) => res,
//     async (err) => {
//       const originalRequest = err.config;

//       if (err.response?.status === 401 && !originalRequest._retry) {
//         originalRequest._retry = true;
//         const newToken = await refreshAccessToken();

//         if (newToken) {
//           originalRequest.headers.Authorization = `Bearer ${newToken}`;
//           return instance(originalRequest);
//         }

//         removeTokens();

//         if (window.reactNavigate) {
//           window.reactNavigate("/");
//         } else {
//           window.location.assign("/");
//         }
//       }

//       return Promise.reject(err);
//     }
//   );

//   return instance;
// };
