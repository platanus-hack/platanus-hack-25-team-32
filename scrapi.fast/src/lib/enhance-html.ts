export function enhanceHTMLReadability(
  body: string | object | undefined,
): string | object {
  if (!body) {
    return body ?? "";
  }

  if (typeof body === "object") {
    return body;
  }

  if (typeof body !== "string") {
    return String(body);
  }

  return body;
}

