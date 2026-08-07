import fs from "fs";
import path from "path";

const templateCache = {};

export function renderTemplate(templateName, variables) {
  if (!templateCache[templateName]) {
    const filePath = path.join(
      process.cwd(),
      "lib",
      "email",
      "templates",
      `${templateName}.html`
    );
    templateCache[templateName] = fs.readFileSync(filePath, "utf-8");
  }

  let html = templateCache[templateName];
  if (!variables || typeof variables !== "object") return html;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = String(value ?? "");
    html = html.replaceAll(placeholder, () => replacement);
  }

  return html;
}
