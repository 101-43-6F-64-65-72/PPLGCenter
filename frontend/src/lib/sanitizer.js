/**
 * Lightweight & secure HTML sanitizer using browser DOMParser with URL Autolinking
 */
const ALLOWED_TAGS = new Set([
  "P", "H1", "H2", "H3", "H4", "STRONG", "B", "EM", "I", "U", "S", "STRIKE",
  "UL", "OL", "LI", "A", "BLOCKQUOTE", "HR", "CODE", "PRE", "SPAN", "BR", "DIV"
]);

const ALLOWED_ATTRS = new Set([
  "href", "target", "rel", "style", "class", "color"
]);

const URL_REGEX = /(https?:\/\/[^\s<>"']+)/gi;

/**
 * Autolink plain text URLs into safe HTML <a> anchor tags
 */
export function autolinkUrls(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(URL_REGEX, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#2C1EE8] underline underline-offset-2 hover:text-blue-800 break-all font-semibold cursor-pointer">${url}</a>`;
  });
}

export function sanitizeHtml(rawHtml) {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  // If plain text without HTML tags, autolink URLs and convert newlines to paragraphs safely
  if (!/<[a-z][\s\S]*>/i.test(rawHtml)) {
    const linked = autolinkUrls(rawHtml);
    return linked
      .split("\n\n")
      .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }

  if (typeof window === "undefined") {
    return autolinkUrls(rawHtml);
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, "text/html");

    function cleanNode(node, insideAnchor = false) {
      const children = Array.from(node.childNodes);

      children.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          // If not already inside an <a> tag and contains URLs, convert to linked elements
          if (!insideAnchor && URL_REGEX.test(child.nodeValue)) {
            const tempSpan = document.createElement("span");
            tempSpan.innerHTML = autolinkUrls(child.nodeValue);
            while (tempSpan.firstChild) {
              node.insertBefore(tempSpan.firstChild, child);
            }
            node.removeChild(child);
          }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const tagName = child.tagName.toUpperCase();
          const isAnchor = tagName === "A";

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

            if (isAnchor) {
              child.setAttribute("target", "_blank");
              child.setAttribute("rel", "noopener noreferrer");
              child.classList.add("text-[#2C1EE8]", "underline", "underline-offset-2", "hover:text-blue-800", "break-all", "font-semibold", "cursor-pointer");
            }

            cleanNode(child, insideAnchor || isAnchor);
          }
        }
      });
    }

    cleanNode(doc.body);
    return doc.body.innerHTML;
  } catch {
    return autolinkUrls(rawHtml);
  }
}

/**
 * Strip HTML tags to return clean plain text for card previews/excerpts
 */
export function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}
