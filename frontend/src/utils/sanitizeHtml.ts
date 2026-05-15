const ALLOWED_TAGS = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'CODE',
  'DIV',
  'EM',
  'I',
  'LI',
  'OL',
  'P',
  'PRE',
  'SPAN',
  'STRONG',
  'UL',
]);

const ALLOWED_ATTRS = new Set(['href', 'target', 'rel']);

export const sanitizeHtml = (html = '') => {
  const template = document.createElement('template');
  template.innerHTML = html;

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;

        if (!ALLOWED_TAGS.has(element.tagName)) {
          element.replaceWith(...Array.from(element.childNodes));
          continue;
        }

        for (const attr of Array.from(element.attributes)) {
          const name = attr.name.toLowerCase();
          const value = attr.value.trim();
          const isSafeHref = name !== 'href' || /^(https?:|mailto:|\/)/i.test(value);

          if (!ALLOWED_ATTRS.has(name) || !isSafeHref) {
            element.removeAttribute(attr.name);
          }
        }

        if (element.tagName === 'A') {
          element.setAttribute('rel', 'noopener noreferrer');
        }
      }

      walk(child);
    }
  };

  walk(template.content);
  return template.innerHTML;
};
