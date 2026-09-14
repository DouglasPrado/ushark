import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const root = process.cwd(),
  out = path.join(root, "dist", "release-evidence");
fs.mkdirSync(out, { recursive: true });
const tree = JSON.parse(
  execFileSync("pnpm", ["list", "-r", "--json", "--depth", "Infinity"], {
    cwd: root,
    encoding: "utf8",
  }),
);
const packages = new Map();
function visit(node) {
  if (node?.name && node?.version)
    packages.set(`${node.name}@${node.version}`, {
      SPDXID: `SPDXRef-${createHash("sha256").update(`${node.name}@${node.version}`).digest("hex").slice(0, 16)}`,
      name: node.name,
      versionInfo: node.version,
      downloadLocation: "NOASSERTION",
      filesAnalyzed: false,
      licenseConcluded: "NOASSERTION",
      licenseDeclared: "NOASSERTION",
    });
  for (const group of [
    node?.dependencies,
    node?.devDependencies,
    node?.optionalDependencies,
  ])
    for (const child of Object.values(group ?? {})) visit(child);
}
tree.forEach(visit);
const sbom = {
  spdxVersion: "SPDX-2.3",
  dataLicense: "CC0-1.0",
  SPDXID: "SPDXRef-DOCUMENT",
  name: "ushark-local-build",
  documentNamespace: `https://ushark.local/spdx/${Date.now()}`,
  creationInfo: {
    created: new Date().toISOString(),
    creators: ["Tool: scripts/release-evidence.mjs"],
  },
  packages: [...packages.values()],
};
fs.writeFileSync(
  path.join(out, "sbom.spdx.json"),
  `${JSON.stringify(sbom, null, 2)}\n`,
);
const files = [
  "apps/desktop/dist/index.html",
  "apps/torrentd/runtime.json",
  "pnpm-lock.yaml",
]
  .filter((f) => fs.existsSync(path.join(root, f)))
  .map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(fs.readFileSync(path.join(root, file)))
      .digest("hex"),
  }));
fs.writeFileSync(
  path.join(out, "checksums.json"),
  `${JSON.stringify({ algorithm: "sha256", files }, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(out, "provenance.json"),
  `${JSON.stringify({ schema: 1, generatedAt: new Date().toISOString(), source: "working-tree", platform: `${process.platform}-${process.arch}`, promotedArtifactRule: "same sha256 across channels", signed: false }, null, 2)}\n`,
);
