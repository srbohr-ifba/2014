import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const srcDir = path.join(rootDir, "src");

async function main() {
  const themes = await extractThemes();

  await rm(distDir, { recursive: true, force: true });
  await mkdir(path.join(distDir, "data"), { recursive: true });
  await mkdir(path.join(distDir, "assets", "images"), { recursive: true });
  await mkdir(path.join(distDir, "assets", "audio"), { recursive: true });

  await copyDirectory(srcDir, distDir);
  await writeFile(
    path.join(distDir, "data", "themes.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalThemes: themes.length,
        themes
      },
      null,
      2
    )
  );

  await copyFileFromRoot("Files/icon-16.png", "assets/images/icon-16.png");
  await copyFileFromRoot("Files/icon-32.png", "assets/images/icon-32.png");
  await copyFileFromRoot("Files/icon-114.png", "assets/images/icon-114.png");
  await copyFileFromRoot("Files/icon-128.png", "assets/images/icon-128.png");
  await copyFileFromRoot("Files/loading-logo.png", "assets/images/loading-logo.png");
  await copyFileFromRoot("Animations/LogoIFBA/Default/000.png", "assets/images/logo-ifba.png");
  await copyFileFromRoot("Animations/GSE/Default/000.png", "assets/images/logo-gse.png");
  await copyFileFromRoot("Animations/FAPESB/Default/000.png", "assets/images/logo-fapesb.png");
  await copyFileFromRoot("Animations/PIBID/Default/000.png", "assets/images/logo-pibid.png");
  await copyFileFromRoot("Files/som1.ogg", "assets/audio/menu-theme.ogg");
  await copyFileFromRoot("Files/Som2.ogg", "assets/audio/game-theme.ogg");
}

async function extractThemes() {
  const eventSheetPath = path.join(rootDir, "Event sheets", "Principal.xml");
  const rawXml = await readFile(eventSheetPath, "utf8");
  const encodedMatch = rawXml.match(/<param id="0" name="XML">([\s\S]*?)<\/param>/);

  if (!encodedMatch) {
    throw new Error("Nao foi possivel localizar o XML dos enigmas em Event sheets/Principal.xml.");
  }

  const decodedXml = decodeConstructXml(encodedMatch[1]);
  const themeMatches = [...decodedXml.matchAll(/<tema(\d+)>([\s\S]*?)<\/tema\1>/g)];

  if (!themeMatches.length) {
    throw new Error("Nenhum tema foi extraido do XML legado do Construct 2.");
  }

  return themeMatches.map(([, id, block]) => {
    const clueCount = Number(readTag(block, "quant", "0")) || 0;
    const clues = [];

    for (let index = 1; index <= clueCount; index += 1) {
      const clue = readTag(block, `sec${index}`);
      const answer = readTag(block, `resp${index}`);
      const alternative = readTag(block, `resp0${index}`, answer);
      const letter = readTag(block, `l${index}`);

      if (!clue || !answer) {
        continue;
      }

      clues.push({
        id: `${id}-${index}`,
        clue,
        answer,
        alternatives: uniqueCompact([answer, alternative]),
        highlightLetter: letter || answer.at(0) || ""
      });
    }

    return {
      id: Number(id),
      title: readTag(block, "questao"),
      answer: readTag(block, "resp"),
      acceptedAnswers: uniqueCompact([readTag(block, "resp"), readTag(block, "resp0")]),
      clueCount,
      clues
    };
  });
}

function readTag(block, tagName, fallback = "") {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`));
  return match ? cleanText(match[1]) : fallback;
}

function decodeConstructXml(value) {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&#x0D;/g, "\r")
    .replace(/&#x0A;/g, "\n")
    .replace(/&#x09;/g, "\t")
    .replace(/\uFEFF/g, "")
    .trim();
}

function cleanText(text) {
  return text
    .replace(/<!\-\-[\s\S]*?\-\->/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueCompact(values) {
  return [...new Set(values.map((value) => cleanText(value || "")).filter(Boolean))];
}

async function copyDirectory(from, to) {
  await cp(from, to, { recursive: true });
}

async function copyFileFromRoot(from, to) {
  await cp(path.join(rootDir, from), path.join(distDir, to));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
