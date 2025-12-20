export const normalizePath = (path: string) => {
  if (!path || path === "THIS_PC") return "THIS_PC";
  // Standardize to uppercase (Windows) and remove trailing slash for keys
  let p = path.replace(/\//g, "\\");
  if (p.endsWith("\\") && p.length > 3) {
    p = p.slice(0, -1);
  }
  return p.toUpperCase();
};

export const joinPath = (base: string, name: string) => {
  if (base === "THIS_PC") return name;
  const sep = base.includes("\\") || !base.includes("/") ? "\\" : "/";
  if (base.endsWith(sep)) return base + name;
  return base + sep + name;
};

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
