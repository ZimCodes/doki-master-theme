import {jetbrainsTemplate} from "./AppThemeTemplateGenerator";
import {masterThemeDefinitionDirectoryPath, masterThemesDirectory, walkAndBuildTemplates} from "./BuildFunctions";
import path from "node:path";
import fs from "node:fs"
import {randomUUID} from "node:crypto"
import url from "node:url"

const __filename = url.fileURLToPath(import.meta.url);
const DARCULA = ".darcula";
const CUSTOM = ".custom";

function hasExecutedScript(): boolean {
  try {
    return process.argv[1] && path.resolve(process.argv[1]) === __filename;
  } catch (e) {
    return false;
  }
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

function updateFileID(path: string, themeDefinition,variantName:string) {
  const customTagID =  `${noDot(CUSTOM)}-${noDot(variantName)}`;
  if (themeDefinition.id.endsWith(customTagID)){
    return;
  }
  themeDefinition.id = randomUUID() + `${noDot(CUSTOM)}-${noDot(variantName)}`;
  fs.writeFileSync(path, JSON.stringify(themeDefinition));
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

function noDot(name: string): string {
  return name.replace(".", "");
}

function addVariantTemplateToGeneratedTemplate(dokiThemeDirPath: string,variantName:string) {
  const dokiTemplateFiles = fs.readdirSync(dokiThemeDirPath)
  const customDokiTemplateNames: Array<string> = dokiTemplateFiles.filter((fileName: string) => fileName.includes(CUSTOM) && fileName.includes("!!!"));
  const variantTemplateName: string = dokiTemplateFiles.find((fileName: string) => fileName.includes(variantName));
  const customDokiTemplateJSONList = customDokiTemplateNames.map(fileName => getJSONContent(path.join(dokiThemeDirPath, fileName)));
  const variantTemplateJSON = getJSONContent(path.join(dokiThemeDirPath, variantTemplateName));
  const newCustomDokiTemplateJSONStrList = customDokiTemplateJSONList.map(customTemplateJSON => {
    return JSON.stringify({...variantTemplateJSON, id: customTemplateJSON.id});
  });
  const newCustomDokiTemplateNames = customDokiTemplateNames.map(fileName => fileName.replace("!!!", ""));
  const newCustomDokiTemplateFullNames = newCustomDokiTemplateNames.map(fileName => path.join(dokiThemeDirPath, fileName));
  createFiles(newCustomDokiTemplateFullNames, newCustomDokiTemplateJSONStrList);
  deleteAll(customDokiTemplateNames.map(fileName => path.join(dokiThemeDirPath, fileName)))
}

function run() {
  if (!hasExecutedScript()) return;
  console.log("Preparing to generate custom theme template!");
  walkAndBuildTemplates()
    .then((dokiThemes) => {
      const themeDirectory = getDokiThemeDirectory();
      dokiThemes.forEach((dokiTheme) => {
        const {dokiFileDefinitionPath, dokiThemeDefinition} = dokiTheme;
        if (isNotCustomDefinition(dokiFileDefinitionPath)) {
          return;
        }
        const variantName = `.${process.argv[2]}` || DARCULA;
        updateFileID(dokiFileDefinitionPath, dokiThemeDefinition,variantName)
        const destinationPath = dokiFileDefinitionPath.substring(
          masterThemeDefinitionDirectoryPath.length
        );
        const essentials = jetbrainsTemplate(dokiThemeDefinition)
        const fullFilePath = path.join(themeDirectory, destinationPath);

        fs.mkdirSync(path.resolve(fullFilePath, ".."), {
          recursive: true,
        });
        const dokiTemplateDefinitionPath = fullFilePath.replace(".master", `.!!!${noDot(variantName)}.jetbrains`);

        const definitionAsString = JSON.stringify(
          {
            ...essentials,
          },
          null,
          2
        );

        // Place generated doki template -> doki-build-plugin/assets/themes
        fs.writeFileSync(dokiTemplateDefinitionPath, definitionAsString);
        const dir = path.dirname(dokiTemplateDefinitionPath);
        addVariantTemplateToGeneratedTemplate(dir,variantName);
      });
    }).then(() => {
    console.log("Custom theme template generation complete!");
  });
}

run();
