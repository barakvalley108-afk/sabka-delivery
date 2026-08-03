import fs from "node:fs";
import path from "node:path";

const root = process.env.SITES_PROJECT_ROOT || process.cwd();

function patchFile(relativePath, transform) {
  const target = path.join(root, relativePath);
  const source = fs.readFileSync(target, "utf8");
  const next = transform(source);
  if (next !== source) fs.writeFileSync(target, next);
  else console.log(`Order variant display already applied or pattern not required: ${relativePath}`);
}

patchFile("app/super-admin/admin-console.tsx", (source) => {
  if (source.includes('line.variantLabel ? ` (${line.variantLabel})` : ""')) return source;
  return source.replace(
    'lines.map(line=>`${line.quantity}× ${line.itemName}`).join(", ")||"Items"',
    'lines.map(line=>`${line.quantity}× ${line.itemName}${line.variantLabel ? ` (${line.variantLabel})` : ""}`).join(", ")||"Items"',
  );
});

patchFile("app/partner-panel/partner-console.tsx", (source) => {
  if (source.includes('{line.variantLabel ? <small>{line.variantLabel}</small> : null}')) return source;
  return source.replace(
    '{line.itemName}\n                    <small>{line.variantLabel}</small>',
    '{line.itemName}\n                    {line.variantLabel ? <small>{line.variantLabel}</small> : null}',
  );
});

patchFile("app/rider-panel/rider-console.tsx", (source) => {
  let next = source;
  if (!next.includes('{item.itemName}{item.variantLabel ? ` (${item.variantLabel})` : ""}')) {
    next = next.replace(
      '{item.itemName}',
      '{item.itemName}{item.variantLabel ? ` (${item.variantLabel})` : ""}',
    );
  }
  if (!next.includes('${item.quantity}× ${item.itemName}${item.variantLabel ? ` (${item.variantLabel})` : ""}')) {
    next = next.replace(
      '${item.quantity}× ${item.itemName}',
      '${item.quantity}× ${item.itemName}${item.variantLabel ? ` (${item.variantLabel})` : ""}',
    );
  }
  return next;
});

console.log("Order item variant display patch completed safely.");
