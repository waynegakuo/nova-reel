export class MarkdownUtils {
  static formatMarkdown(text: string): string {
    if (!text) return '';

    // Escape HTML to prevent XSS
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const lines = escaped.split('\n');
    let inList = false;
    let listType: 'ul' | 'ol' | null = null;
    let result = '';

    const applyInlineStyles = (line: string) => {
      // Bold: **text** or __text__
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      line = line.replace(/__(.*?)__/g, '<strong>$1</strong>');

      // Italics: *text* or _text_
      line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
      line = line.replace(/_(.*?)_/g, '<em>$1</em>');
      return line;
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();

      // Match bullet points (* or -)
      if (line.match(/^[\*\-]\s+(.*)/)) {
        if (!inList || listType !== 'ul') {
          if (inList) result += listType === 'ul' ? '</ul>' : '</ol>';
          result += '<ul>';
          inList = true;
          listType = 'ul';
        }
        const content = line.replace(/^[\*\-]\s+/, '');
        result += `<li>${applyInlineStyles(content)}</li>`;
      }
      // Match headers starting with ###
      else if (line.match(/^###\s+(.*)/)) {
        if (inList) {
          result += listType === 'ul' ? '</ul>' : '</ol>';
          inList = false;
          listType = null;
        }
        const content = line.replace(/^###\s+/, '');
        result += `<p><strong>${applyInlineStyles(content)}</strong></p>`;
      }
      // Match numbered lists (1. 2. etc)
      else if (line.match(/^\d+\.\s+(.*)/)) {
        if (!inList || listType !== 'ol') {
          if (inList) result += listType === 'ul' ? '</ul>' : '</ol>';
          result += '<ol>';
          inList = true;
          listType = 'ol';
        }
        const content = line.replace(/^\d+\.\s+/, '');
        result += `<li>${applyInlineStyles(content)}</li>`;
      }
      else {
        if (inList) {
          result += listType === 'ul' ? '</ul>' : '</ol>';
          inList = false;
          listType = null;
        }
        if (line) {
          result += `<p>${applyInlineStyles(line)}</p>`;
        }
      }
    }

    if (inList) {
      result += listType === 'ul' ? '</ul>' : '</ol>';
    }

    return result;
  }
}
