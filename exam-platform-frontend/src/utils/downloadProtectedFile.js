import api from "../api/api";

function getFilenameFromHeaders(headers, fallbackFilename) {
  const contentDisposition =
    headers?.["content-disposition"] || headers?.["Content-Disposition"];

  if (!contentDisposition) {
    return fallbackFilename;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  return filenameMatch?.[1] || fallbackFilename;
}

async function extractBlobErrorMessage(blob) {
  try {
    const rawText = await blob.text();
    if (!rawText) {
      return "Le fichier PDF n'a pas pu etre genere.";
    }

    try {
      const parsed = JSON.parse(rawText);
      return parsed?.message || "Le fichier PDF n'a pas pu etre genere.";
    } catch {
      return rawText.slice(0, 200) || "Le fichier PDF n'a pas pu etre genere.";
    }
  } catch {
    return "Le fichier PDF n'a pas pu etre genere.";
  }
}

export async function downloadProtectedFile(url, fallbackFilename) {
  const response = await api.get(url, { responseType: "blob" });
  const blob = response.data;
  const contentType = response.headers?.["content-type"] || "";

  if (!contentType.toLowerCase().includes("pdf")) {
    const message = await extractBlobErrorMessage(blob);
    throw new Error(message);
  }

  const filename = getFilenameFromHeaders(response.headers, fallbackFilename);
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 1000);
}
