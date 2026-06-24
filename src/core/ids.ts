export function stableAnchorId(value: string): string {
  const normalized = value.trim().toLowerCase().replaceAll("\\", "/");
  const encoded = [...normalized]
    .map((character) => {
      if (/^[a-z0-9]$/.test(character)) return character;
      return `-${character.codePointAt(0)!.toString(36)}-`;
    })
    .join("");
  return collapseAnchorSeparators(encoded);
}

export function safeAnchorId(value: string): string {
  return collapseAnchorSeparators(
    value
      .trim()
      .toLowerCase()
      .replaceAll("\\", "/")
      .replace(/[^a-z0-9-]+/g, "-")
  );
}

function collapseAnchorSeparators(value: string): string {
  return value.replace(/-+/g, "-").replace(/^-+|-+$/g, "") || "item";
}
