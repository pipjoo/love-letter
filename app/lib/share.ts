export function canShareFiles() {
  if (typeof navigator === "undefined" || !navigator.canShare) return false;
  try {
    return navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

export function saveFile(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareFile(file: File, text?: string) {
  try {
    await navigator.share({ files: [file], text });
  } catch {
    // user closed the share sheet
  }
}
