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
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), value ?? "");
  }

  return html;
}
