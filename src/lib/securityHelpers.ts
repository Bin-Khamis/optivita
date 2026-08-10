export function validateUploadedFile(
  file: { name: string; size: number; type: string }
): { valid: boolean; error?: string } {
  const allowedExtensions = ["pdf", "jpg", "jpeg", "png"];
  const maxBytes = 10 * 1024 * 1024; // 10MB limit

  // Validate size
  if (file.size > maxBytes) {
    return { valid: false, error: "File exceeds maximum size threshold (10MB)." };
  }

  // Validate extension
  const parts = file.name.split(".");
  const extension = parts[parts.length - 1].toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { valid: false, error: `File type extension '.${extension}' is blocked for security.` };
  }

  // Validate MIME type
  const allowedMime = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (!allowedMime.includes(file.type.toLowerCase())) {
    return { valid: false, error: "MIME type is not allowed." };
  }

  return { valid: true };
}

export function maskSensitiveData(
  value: string,
  type: "iban" | "email" | "phone"
): string {
  if (!value) return "";
  
  if (type === "iban") {
    // Return SA03 8000 •••• •••• •••• 9281
    if (value.length < 8) return value;
    const prefix = value.substring(0, 4);
    const suffix = value.substring(value.length - 4);
    return `${prefix} **** **** **** ${suffix}`;
  }

  if (type === "email") {
    const parts = value.split("@");
    if (parts.length !== 2) return value;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name.charAt(0)}***@${domain}`;
    return `${name.charAt(0)}***${name.charAt(name.length - 1)}@${domain}`;
  }

  if (type === "phone") {
    if (value.length < 6) return value;
    const suffix = value.substring(value.length - 4);
    return `+966 ***** ${suffix}`;
  }

  return value;
}

export function generateErrorReference(): string {
  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ERR-${dateStr}-${randomStr}`;
}
