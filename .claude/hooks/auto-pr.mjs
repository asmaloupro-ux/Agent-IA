// Hook « Stop » de Claude Code : tant que du code produit par Claude n'est pas sur une branche,
// commité, poussé et dans une PR GitHub, Claude ne peut pas terminer sa réponse.
// Désactivé en CI (GitHub Actions) et après une première relance (stop_hook_active) pour éviter les boucles.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

if (process.env.GITHUB_ACTIONS || process.env.CI) process.exit(0);

let input = {};
try {
  input = JSON.parse(await new Response(process.stdin).text() || "{}");
} catch {}
if (input.stop_hook_active) process.exit(0);

const run = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};

const ghCandidates = ["C:\\Program Files\\GitHub CLI\\gh.exe", "gh"];
const gh = ghCandidates.find((c) => c === "gh" || existsSync(c));

const branch = run("git", ["branch", "--show-current"]);
if (!branch) process.exit(0); // pas un dépôt git, ou HEAD détachée

const dirty = run("git", ["status", "--porcelain"]);
const upstream = run("git", ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]);
const ahead = upstream ? Number(run("git", ["rev-list", "--count", "@{u}..HEAD"]) ?? 0) : null;
const isMain = branch === "main" || branch === "master";

const steps = [];
if (isMain && (dirty || (ahead ?? 0) > 0)) {
  steps.push(
    `Tu es sur \`${branch}\` : crée une branche (feat/…, fix/… ou chore/…) avec \`git switch -c <branche>\` ` +
      `— les modifications et commits non poussés la suivent — puis remets \`${branch}\` à jour avec \`git branch -f ${branch} origin/${branch}\`.`,
  );
}
if (dirty) steps.push("Vérifie (tests / lint), puis committe toutes les modifications avec un message clair en français.");
if (!isMain && (upstream === null || ahead > 0 || dirty)) steps.push("Pousse la branche : `git push -u origin HEAD`.");

if (!isMain && gh) {
  const pr = run(gh, ["pr", "view", branch, "--json", "url", "-q", ".url"]);
  if (!pr && (upstream !== null || steps.length)) {
    steps.push("Ouvre la PR : `gh pr create --base main --fill`, puis complète la description (quoi, pourquoi, comment c'est vérifié).");
  }
} else if (isMain && steps.length) {
  steps.push("Ouvre la PR : `gh pr create --base main --fill`.");
}

if (!steps.length) process.exit(0);

steps.push("Donne le lien de la PR à l'utilisateur. Ne merge pas.");
console.log(
  JSON.stringify({
    decision: "block",
    reason:
      "Workflow automatique Agent-IA : le code doit passer par une PR avant de terminer.\n" +
      steps.map((s, i) => `${i + 1}. ${s}`).join("\n") +
      "\nSi c'est impossible (tests en échec, question en attente…), explique pourquoi à l'utilisateur.",
  }),
);
