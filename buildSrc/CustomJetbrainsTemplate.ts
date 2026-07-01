import {jetbrainsTemplate} from "./AppThemeTemplateGenerator";
import {masterThemeDefinitionDirectoryPath, masterThemesDirectory, walkAndBuildTemplates} from "./BuildFunctions";
import path from "node:path";
import fs from "node:fs"
import {randomUUID} from "node:crypto"
import url from "node:url"

const __filename = url.fileURLToPath(import.meta.url);
const DARCULA = ".darcula";

function hasExecutedScript(): boolean {
  try {
    return process.argv[1] && path.resolve(process.argv[1]) === __filename;
  } catch (e) {
    return false;
  }
}

function getCustomJetbrainsDefinitionDir() {
  return path.resolve(masterThemesDirectory, "jetbrains");
}

function getDokiThemeDirectory() {
  return path.resolve(
    masterThemesDirectory,
    "..",
    'doki-build-plugin',
    "assets",
    "themes"
  );
}

function updateFileID(path: string, themeDefinition) {
  themeDefinition.id = randomUUID();
  fs.writeFileSync(path, JSON.stringify(themeDefinition))
}

function isNotCustomDefinition(dokiFilePath: string): boolean {
  return !dokiFilePath.endsWith(".custom.master.definition.json");
}


function getJSONContent(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath));
}

function deleteAll(paths: Array<string>) {
  paths.forEach(path => fs.rmSync(path));
}

function createFiles(paths: Array<string>, datas) {
  paths.forEach((path, i) => fs.writeFileSync(path, datas[i]));
}

function newId(id: string, variantType: string): string {
  return variantType == DARCULA ? id : id + variantType.replace(".", "");
}

function addVariantTemplateToGeneratedTemplate(dokiThemeDirPath: string) {
  const variantType = process.argv[2] ? `.${process.argv[2]}` : DARCULA;
  const dokiTemplateFiles = fs.readdirSync(dokiThemeDirPath)
  const customDokiTemplateNames: Array<string> = dokiTemplateFiles.filter((fileName: string) => fileName.includes(".custom"));
  const variantTemplateName: string = dokiTemplateFiles.filter((fileName: string) => fileName.includes(variantType))[0];
  const customDokiTemplateJSONList = customDokiTemplateNames.map(fileName => getJSONContent(path.join(dokiThemeDirPath, fileName)));
  const variantTemplateJSON = getJSONContent(path.join(dokiThemeDirPath, variantTemplateName));
  const newCustomDokiTemplateJSONStrList = customDokiTemplateJSONList.map(customTemplateJSON => {
    return JSON.stringify({...variantTemplateJSON, id: newId(customTemplateJSON.id, variantType)});
  });
  const newCustomDokiTemplateNames = customDokiTemplateNames.map(fileName => fileName.replace(".custom", variantType));
  const newCustomDokiTemplateFullNames = newCustomDokiTemplateNames.map(fileName => path.join(dokiThemeDirPath, fileName));
  createFiles(newCustomDokiTemplateFullNames, newCustomDokiTemplateJSONStrList);
  deleteAll(customDokiTemplateNames.map(fileName => path.join(dokiThemeDirPath, fileName)))
}

function run() {
  if (!hasExecutedScript()) return;
  console.log("Preparing to generate theme templates.");
  walkAndBuildTemplates()
    .then((dokiThemes) => {
      const themeDirectory = getDokiThemeDirectory();
      dokiThemes.forEach((dokiTheme) => {
        const {dokiFileDefinitionPath, dokiThemeDefinition} = dokiTheme;
        if (isNotCustomDefinition(dokiFileDefinitionPath)) {
          return;
        }

        updateFileID(dokiFileDefinitionPath, dokiThemeDefinition)
        const destinationPath = dokiFileDefinitionPath.substring(
          masterThemeDefinitionDirectoryPath.length
        );
        const essentials = jetbrainsTemplate(dokiThemeDefinition)
        const fullFilePath = path.join(themeDirectory, destinationPath);

        fs.mkdirSync(path.resolve(fullFilePath, ".."), {
          recursive: true,
        });
        const customJetbrainsPath = path.join(getCustomJetbrainsDefinitionDir(),
          path.basename(dokiFileDefinitionPath)).replace(".islands", "");

        const dokiTemplateDefinitionPath = fullFilePath.replace(".master", ".jetbrains").replace(".islands", "");

        const definitionAsString = JSON.stringify(
          {
            ...essentials,
          },
          null,
          2
        );

        const dokiThemeDefinitionAsString = JSON.stringify(dokiThemeDefinition);

        // Place generated doki template -> doki-build-plugin/assets/themes
        fs.writeFileSync(dokiTemplateDefinitionPath, definitionAsString);
        // Relocate new custom doki color theme to 'masterThemes/jetbrains'.
        // NOTE: All custom new doki color themes belong there.
        fs.writeFileSync(customJetbrainsPath, dokiThemeDefinitionAsString);
        fs.rmSync(dokiFileDefinitionPath);
        const dir = path.dirname(dokiTemplateDefinitionPath);
        addVariantTemplateToGeneratedTemplate(dir);
      });
    }).then(() => {
    console.log("Theme Template Generation Complete!");
  });
}

run();
