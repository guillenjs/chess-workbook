
export async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: "The server returned a non-JSON response",
      details: text.slice(0, 240)
    };
  }
}
