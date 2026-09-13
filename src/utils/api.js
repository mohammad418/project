const rawBase = (process.env.REACT_APP_API_URL || "").trim();



const isInvalid =
  !rawBase ||
  rawBase.includes("YOUR-BACKEND-URL") ||
  (rawBase.includes("localhost") &&
    typeof window !== "undefined" &&
    window.location.protocol === "https:");

export const API_BASE_URL = isInvalid ? "" : rawBase.replace(/\/$/, "");

const buildUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

async function request(endpoint, options) {
  try {
    return await fetch(buildUrl(endpoint), options);
  } catch (err) {
    const error = new Error(
      "خطا در برقراری ارتباط با سرور. لطفاً بعداً دوباره تلاش کنید.",
    );
    error.cause = err;
    throw error;
  }
}

export function postApi(endpoint, data) {
  return request(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getApi(endpoint, token) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return request(endpoint, { headers });
}
