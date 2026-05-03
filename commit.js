import { execSync, execFileSync } from "child_process";
import readline from "readline";

const TYPES = [
  { value: "feat", emoji: "✨", name: "feat:     ✨  A new feature" },
  { value: "fix", emoji: "🐛", name: "fix:      🐛  A bug fix" },
  {
    value: "docs",
    emoji: "📚",
    name: "docs:     📚  Documentation only changes",
  },
  {
    value: "style",
    emoji: "💎",
    name: "style:    💎  Changes that do not affect the meaning of the code",
  },
  {
    value: "refactor",
    emoji: "📦",
    name: "refactor: 📦  A code change that neither fixes a bug nor adds a feature",
  },
  {
    value: "perf",
    emoji: "🚀",
    name: "perf:     🚀  A code change that improves performance",
  },
  {
    value: "test",
    emoji: "🚨",
    name: "test:     🚨  Adding missing tests or correcting existing tests",
  },
  {
    value: "build",
    emoji: "🛠",
    name: "build:    🛠   Changes that affect the build system or external dependencies",
  },
  {
    value: "ci",
    emoji: "⚙️",
    name: "ci:       ⚙️   Changes to our CI configuration files and scripts",
  },
  {
    value: "chore",
    emoji: "♻️",
    name: "chore:    ♻️   Other changes that don't modify src or test files",
  },
  {
    value: "revert",
    emoji: "🗑",
    name: "revert:   🗑   Reverts a previous commit",
  },
];

const parseArgs = (argv) => {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      continue;
    }

    const key = arg.slice(2);
    const next = argv[i + 1];

    if (
      key === "yes" ||
      key === "non-interactive" ||
      key === "no-emoji"
    ) {
      out[key] = true;
      continue;
    }

    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = "";
    }
  }
  return out;
};

const promptSelect = async (rl, question, options) => {
  console.log(question);
  options.forEach((opt, index) => {
    console.log(`${index + 1}. ${opt.name}`);
  });

  return new Promise((resolve) => {
    const ask = () => {
      rl.question("Select option number: ", (answer) => {
        const index = parseInt(answer) - 1;
        if (index >= 0 && index < options.length) {
          resolve(options[index]);
        } else {
          console.log("Invalid option, please try again.");
          ask();
        }
      });
    };
    ask();
  });
};

const promptInput = async (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

const getGitBranch = () => {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  } catch {
    return "";
  }
};

const getTypeByInput = (input) => {
  if (!input) {
    return null;
  }

  const raw = String(input).trim().toLowerCase();
  const index = Number.parseInt(raw, 10);
  if (Number.isInteger(index) && index >= 1 && index <= TYPES.length) {
    return TYPES[index - 1];
  }

  return TYPES.find((t) => t.value === raw) || null;
};

const buildCommitMessage = ({
  selectedType,
  scope,
  subject,
  body,
  breakingDesc,
  noEmoji = false,
}) => {
  const normalizedSubject = String(subject || "").replace(/\\n/g, "\n").trim();
  const normalizedBody = body ? String(body).replace(/\\n/g, "\n").trim() : "";
  const normalizedBreaking = breakingDesc
    ? String(breakingDesc).replace(/\\n/g, "\n").trim()
    : "";

  const header = `${selectedType.value}${scope ? `(${scope})` : ""}: ${noEmoji ? "" : `${selectedType.emoji} `}${normalizedSubject}`.trim();
  const sections = [header];

  if (normalizedBody) {
    sections.push(normalizedBody);
  }

  if (normalizedBreaking) {
    sections.push(`BREAKING CHANGE: ${normalizedBreaking}`);
  }

  return sections.join("\n\n");
};

const runGitCommit = (message) => {
  const parts = String(message)
    .split(/\n\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Commit message is empty");
  }

  const args = ["commit"];
  for (const part of parts) {
    args.push("-m", part);
  }

  execFileSync("git", args, { stdio: "inherit" });
};

const getDefaultScope = () => {
  let defaultScope = "";
  const branch = getGitBranch();
  if (branch && branch !== "main" && branch !== "master") {
    const parts = branch.split(/[-/]/);
    defaultScope = parts.length > 1 ? parts.slice(1).join("-") : branch;
  }
  return defaultScope;
};

const runNonInteractive = ({ rl, args }) => {
  const status = execSync("git status --porcelain").toString();
  if (!status) {
    console.log("\n❌ No files added to staging! Did you forget to run `git add`?\n");
    process.exit(1);
  }

  const selectedType = getTypeByInput(args.type);
  if (!selectedType) {
    console.log("\n❌ Invalid or missing --type. Use one of: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert or number 1-11.\n");
    process.exit(1);
  }

  const subject = (args.subject || "").trim();
  if (!subject) {
    console.log("\n❌ Missing --subject for non-interactive mode.\n");
    process.exit(1);
  }

  const scope = (args.scope || getDefaultScope()).trim();
  const body = args.body || "";
  const breakingDesc = args.breaking || "";
  const noEmoji = Boolean(args["no-emoji"]);

  const commitMessage = buildCommitMessage({
    selectedType,
    scope,
    subject,
    body,
    breakingDesc,
    noEmoji,
  });

  console.log("\n=======================================");
  console.log("Generated Commit Message:\n");
  console.log(commitMessage);
  console.log("=======================================\n");

  const shouldProceed = Boolean(args.yes);
  if (!shouldProceed) {
    console.log("\nℹ️ Dry-run only. Add --yes to create commit.\n");
    return;
  }

  runGitCommit(commitMessage);
  console.log("\n✅ Commit successful!\n");

  rl.close();
  process.exit(0);
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    if (args["non-interactive"] || args.subject || args.type) {
      runNonInteractive({ rl, args });
      return;
    }

    // Check if there are staged files
    const status = execSync("git status --porcelain").toString();
    if (!status) {
      console.log(
        "\n❌ No files added to staging! Did you forget to run `git add`?\n",
      );
      process.exit(1);
    }

    const defaultScope = getDefaultScope();

    console.log("\n🚀 Custom Commit CLI\n");

    const selectedType = await promptSelect(
      rl,
      "? Select the type of change you're committing:",
      TYPES,
    );

    const scopeInput = await promptInput(
      rl,
      `? Specify a scope (optional, press Enter to use '${defaultScope}' or empty): `,
    );
    const scope = scopeInput || defaultScope;

    const subject = await promptInput(
      rl,
      "? Write a short, imperative tense description of the change:\n",
    );
    if (!subject) {
      console.log("\n❌ Description cannot be empty!\n");
      process.exit(1);
    }

    const body = await promptInput(
      rl,
      "? Provide a longer description of the change (optional):\n",
    );
    const isBreaking = await promptInput(
      rl,
      "? Are there any breaking changes? (y/N): ",
    );

    let breakingDesc = "";
    if (isBreaking.toLowerCase() === "y" || isBreaking.toLowerCase() === "yes") {
      const breakingDescInput = await promptInput(
        rl,
        "? Describe the breaking changes:\n",
      );
      breakingDesc = breakingDescInput || "See commit details.";
    }

    const commitMessage = buildCommitMessage({
      selectedType,
      scope,
      subject,
      body,
      breakingDesc,
    });

    console.log("\n=======================================");
    console.log("Generated Commit Message:\n");
    console.log(commitMessage);
    console.log("=======================================\n");

    const confirm = await promptInput(
      rl,
      "? Are you sure you want to proceed with the commit above? (Y/n): ",
    );
    if (confirm.toLowerCase() === "n" || confirm.toLowerCase() === "no") {
      console.log("\n Commit aborted.");
      process.exit(0);
    }

    runGitCommit(commitMessage);
    console.log("\n✅ Commit successful!\n");
  } catch (error) {
    console.error("\n❌ Commit failed:", error.message);
  } finally {
    rl.close();
  }
};

run();
