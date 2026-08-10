/**
 * Lightweight & secure HTML sanitizer using browser DOMParser
 */
const ALLOWED_TAGS = new Set([
  "P", "H1", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "S", "STRIKE",
  "UL", "OL", "LI", "A", "BLOCKQUOTE", "HR", "CODE", "PRE", "SPAN", "BR", "DIV"
]);

const ALLOWED_ATTRS = new Set([
  "href", "target", "rel", "style", "class", "color"
]);

export function sanitizeHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  // If plain text without HTML tags, convert newlines to paragraphs safely
  if (!/<[a-z][\s\S]*>/i.test(rawHtml)) {
    return rawHtml
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }

  if (typeof window === "undefined") {
    return rawHtml;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    function cleanNode(node) {
      const children = Array.from(node.childNodes);

      children.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = child.tagName.toUpperCase();

          if (!ALLOWED_TAGS.has(tagName)) {
            while (child.firstChild) {
              node.insertBefore(child.firstChild, child);
            }
            node.removeChild(child);
          } else {
            const attrs = Array.from(child.attributes);
            attrs.forEach((attr) => {
              const name = attr.name.toLowerCase();
              if (!ALLOWED_ATTRS.has(name) || name.startsWith("on")) {
                child.removeAttribute(attr.name);
              }
              if (name === "href" && attr.value.trim().toLowerCase().startsWith("javascript:")) {
                child.removeAttribute("href");
              }
            });

            if (tagName === "A") {
              child.setAttribute("target", "_blank");
              child.setAttribute("rel", "noopener noreferrer");
            }

            cleanNode(child);
          }
        }
      });
    }

    cleanNode(doc.body);
    return doc.body.innerHTML;
  } catch {
    return rawHtml;
  }
}

/**
 * Strip HTML tags to return clean plain text for card previews/excerpts
 */
export function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}
