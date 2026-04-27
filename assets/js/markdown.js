(function () {
  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function inlineFormat(value) {
    return escapeHtml(value)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
  }

  function isTableDivider(line) {
    return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line);
  }

  function parseTableRow(line) {
    return line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function renderMarkdown(markdown) {
    const lines = markdown.split(/\r?\n/);
    const html = [];
    let listType = null;
    let inCodeBlock = false;
    let codeLines = [];

    function closeList() {
      if (listType) {
        html.push(`</${listType}>`);
        listType = null;
      }
    }

    function closeCodeBlock() {
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      codeLines = [];
      inCodeBlock = false;
    }

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        closeList();
        if (inCodeBlock) {
          closeCodeBlock();
        } else {
          inCodeBlock = true;
          codeLines = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      if (!trimmed) {
        closeList();
        continue;
      }

      if (trimmed.includes("|") && lines[index + 1] && isTableDivider(lines[index + 1].trim())) {
        closeList();
        const headers = parseTableRow(trimmed);
        const rows = [];
        index += 2;
        while (index < lines.length && lines[index].trim().includes("|")) {
          rows.push(parseTableRow(lines[index].trim()));
          index += 1;
        }
        index -= 1;
        html.push("<div class=\"table-wrap\"><table><thead><tr>");
        headers.forEach((header) => html.push(`<th>${inlineFormat(header)}</th>`));
        html.push("</tr></thead><tbody>");
        rows.forEach((row) => {
          html.push("<tr>");
          headers.forEach((_, cellIndex) => html.push(`<td>${inlineFormat(row[cellIndex] || "")}</td>`));
          html.push("</tr>");
        });
        html.push("</tbody></table></div>");
        continue;
      }

      if (trimmed.startsWith("### ")) {
        closeList();
        html.push(`<h3>${inlineFormat(trimmed.slice(4))}</h3>`);
        continue;
      }

      if (trimmed.startsWith("## ")) {
        closeList();
        html.push(`<h2>${inlineFormat(trimmed.slice(3))}</h2>`);
        continue;
      }

      if (trimmed.startsWith("# ")) {
        closeList();
        html.push(`<h1>${inlineFormat(trimmed.slice(2))}</h1>`);
        continue;
      }

      const bullet = trimmed.match(/^[-*]\s+(.*)$/);
      if (bullet) {
        if (listType !== "ul") {
          closeList();
          listType = "ul";
          html.push("<ul>");
        }
        html.push(`<li>${inlineFormat(bullet[1])}</li>`);
        continue;
      }

      const numbered = trimmed.match(/^\d+\.\s+(.*)$/);
      if (numbered) {
        if (listType !== "ol") {
          closeList();
          listType = "ol";
          html.push("<ol>");
        }
        html.push(`<li>${inlineFormat(numbered[1])}</li>`);
        continue;
      }

      closeList();
      html.push(`<p>${inlineFormat(trimmed)}</p>`);
    }

    closeList();
    if (inCodeBlock) closeCodeBlock();
    return html.join("");
  }

  window.Markdown = { render: renderMarkdown };
})();
