import { API_CONFIG } from "@/config/api";

/**
 * Universal Axios API Client Instance with Bearer Token Injection
 * Supports JWT Bearer Authentication and native fetch fallback.
 */
let Axios = null;
try {
  Axios = require("axios").default || require("axios");
} catch (e) {
  // Native fetch fallback if axios is not resolved
}

export const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("sc_jwt_token") ||
    localStorage.getItem("jwt_token") ||
    getCookie("auth_token")
  );
};

export const setStoredToken = (token) => {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("token", token);
    document.cookie = `auth_token=${token}; path=/; max-age=86400; SameSite=Lax`;
  } else {
    localStorage.removeItem("token");
    document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
};

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

class NativeFetchClient {
  constructor() {
    this.interceptors = {
      response: {
        use: (onSuccess, onError) => {
          this.onSuccess = onSuccess;
          this.onError = onError;
        },
      },
    };
  }

  async request(method, url, data = null, options = {}) {
    const fullUrl = url.startsWith("http") ? url : `${API_CONFIG.BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    const token = getStoredToken();

    try {
      const headers = {
        ...API_CONFIG.HEADERS,
        ...(options.headers || {}),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const fetchOptions = {
        method,
        headers,
      };

      if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(fullUrl, fetchOptions);
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorObj = {
          response: {
            status: response.status,
            data: json,
          },
        };

        if (this.onError) {
          return await this.onError(errorObj);
        }
        throw errorObj;
      }

      const resObj = { data: json, status: response.status };
      if (this.onSuccess) {
        return this.onSuccess(resObj);
      }
      return json;
    } catch (err) {
      if (err.statusCode) throw err;

      const errorObj = err.response ? err : { response: null };
      if (this.onError) {
        return await this.onError(errorObj);
      }
      throw err;
    }
  }

  get(url, config) {
    return this.request("GET", url, null, config);
  }

  post(url, data, config) {
    return this.request("POST", url, data, config);
  }

  patch(url, data, config) {
    return this.request("PATCH", url, data, config);
  }

  delete(url, config) {
    return this.request("DELETE", url, config);
  }
}

let clientInstance;

if (Axios) {
  clientInstance = Axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
  });

  clientInstance.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  clientInstance.interceptors.response.use(
    (response) => response.data,
    (error) => formatApiError(error)
  );
} else {
  clientInstance = new NativeFetchClient();
  clientInstance.interceptors.response.use(
    (response) => response.data,
    (error) => formatApiError(error)
  );
}

function formatApiError(error) {
  const defaultErrorResponse = {
    success: false,
    statusCode: error?.response?.status || 500,
    message: error?.message || "Gagal terhubung ke server. Silakan periksa koneksi internet Anda.",
    errors: [],
  };

  if (!error || !error.response) {
    return Promise.reject(defaultErrorResponse);
  }

  const { status, data } = error.response;
  let friendlyMessage = data?.message || "Terjadi kesalahan pada sistem.";
  let fieldErrors = data?.errors || [];

  switch (status) {
    case 400:
      if (data?.errors && typeof data.errors === "object" && Object.keys(data.errors).length > 0) {
        const errorList = Object.entries(data.errors)
          .map(([key, val]) => Array.isArray(val) ? val.join(", ") : val)
          .join("; ");
        friendlyMessage = `Form tidak valid: ${errorList}`;
      } else {
        friendlyMessage = data?.message || data?.title || "Permintaan tidak valid.";
      }
      break;
    case 401:
      friendlyMessage = data?.message || "Sesi Anda telah berakhir. Silakan login kembali.";
      setStoredToken(null); // Auto clear expired token
      break;
    case 403:
      friendlyMessage = data?.message || "Akses tidak diizinkan.";
      break;
    case 404:
      friendlyMessage = data?.message || "Data tidak ditemukan.";
      break;
    case 422:
      friendlyMessage = data?.message || "Validasi aturan bisnis gagal.";
      break;
    case 500:
      friendlyMessage = "Terjadi gangguan pada server sekolah.";
      break;
    default:
      break;
  }

  return Promise.reject({
    success: false,
    statusCode: status,
    message: friendlyMessage,
    errors: fieldErrors,
  });
}

export const apiClient = clientInstance;
export default apiClient;
