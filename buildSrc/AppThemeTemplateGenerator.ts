import {MasterDokiThemeDefinition,} from "doki-build-source";
import path from "node:path";
import fs from "node:fs";
import {masterThemeDefinitionDirectoryPath, masterThemesDirectory, walkAndBuildTemplates} from "./BuildFunctions";
import process from "node:process"
import url from "node:url"

const __filename = url.fileURLToPath(import.meta.url);

function hasExecutedScript(): boolean {
  try {
    return process.argv[1] && path.resolve(process.argv[1]) === __filename;
  } catch (e) {
    return false;
  }
}

export const jetbrainsTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  editorScheme: {
    type: "template",
    name: dokiThemeDefinition.dark ? "Doki Dark" : "Doki Light v2",
  },
  overrides: {},
  ui: {},
});

const hyperTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
});

const iconsTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  colors: {},
});

const homeTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  content: {},
});

const commonTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
});

/*********************************************************************************************/

/**
 * This function creates each application specific template and puts it in the
 * "{buildSrc,doki-build-plugin}/assets/templates" of the current app.
 *
 * This is most handy when creating the doki theme for a new application as it preserves the
 * folder structure, which is not important, but it is nice.
 *
 * @param appArg
 * @param dokiThemeDefinition
 */
function buildApplicationTemplate(appArg: string, dokiThemeDefinition: MasterDokiThemeDefinition) {
  switch (appArg) {
    case '--icons':
      return {name: 'icons', template: iconsTemplate(dokiThemeDefinition)};
    case '--vscode':
      return {name: 'vsCode', template: commonTemplate(dokiThemeDefinition)};
    case '--hyper':
      return {name: 'hyper', template: hyperTemplate(dokiThemeDefinition)};
    case '--chrome':
      return {name: 'chrome', template: commonTemplate(dokiThemeDefinition)};
    case '--vim':
      return {name: 'vim', template: commonTemplate(dokiThemeDefinition)};
    case '--github':
      return {name: 'github', template: commonTemplate(dokiThemeDefinition)};
    case '--eclipse':
      return {name: 'eclipse', template: commonTemplate(dokiThemeDefinition)};
    case '--jupyter':
      return {name: 'jupyter', template: commonTemplate(dokiThemeDefinition)};
    case '--home':
      return {name: 'home', template: homeTemplate(dokiThemeDefinition)};
    case '--vsstudio':
      return {name: 'visualstudio', template: commonTemplate(dokiThemeDefinition)};
    case '--firefox':
      return {name: 'firefox', template: commonTemplate(dokiThemeDefinition)};
    default:
      return {name: 'jetbrains', template: jetbrainsTemplate(dokiThemeDefinition)};
  }
}

/**
 * NOTE: Possible CLI command option: '--<app-name>'
 *  jetbrains | vsCode | hyper | chrome | vim | github | eclipse | jupyter | home | visualstudio | firefox | icons
 */
const appArg = process.argv[2];

function getThemeDirectoryPath(appArg: string) {
  let parentDirName: string = 'buildSrc';
  if (!appArg || appArg == '--icons') {
    parentDirName = 'doki-build-plugin';
  }
  return path.resolve(
    masterThemesDirectory,
    "..",
    parentDirName,
    "assets",
    "themes"
  );
}

/**************************************************************************/

function getAppDefinitionName(appName: string): string {
  switch (appName) {
    case "jetbrains":
      return `darcula.${appName}.definition`;
    default:
      return `${appName}.definition`
  }
}

function getExistingAppDefinition(appTemplateDefinition: string) {
  if (fs.existsSync(appTemplateDefinition)) {
    return JSON.parse(fs.readFileSync(appTemplateDefinition, {encoding: 'utf-8'}));
  }

  return {}
}

function isCustomDefinition(dokiFilePath: string): boolean {
  return dokiFilePath.endsWith(".custom.master.definition.json");
}

function run() {
  if (!hasExecutedScript()) return;
  console.log("Preparing to generate theme templates.");
  walkAndBuildTemplates()
    .then((dokiThemes) => {
      const themeDirectory = getThemeDirectoryPath(appArg);
      dokiThemes.forEach((dokiTheme) => {
        const {dokiFileDefinitionPath, dokiThemeDefinition} = dokiTheme;
        if (isCustomDefinition(dokiFileDefinitionPath)) {
          return;
        }
        const destinationPath = dokiFileDefinitionPath.substring(
          masterThemeDefinitionDirectoryPath.length
        );
        const {name: appName, template: essentials} = buildApplicationTemplate(appArg, dokiThemeDefinition);

        const fullFilePath = path.join(themeDirectory, destinationPath);

        fs.mkdirSync(path.resolve(fullFilePath, ".."), {
          recursive: true,
        });

        const appTemplateDefinition = fullFilePath.replace(
          "master.definition",
          getAppDefinitionName(appName)
        );
        const previousAppTemplateDefinition = getExistingAppDefinition(
          appTemplateDefinition
        );

        const definitionAsString = JSON.stringify(
          {
            ...essentials,
            ...previousAppTemplateDefinition,
          },
          null,
          2
        );

        fs.writeFileSync(appTemplateDefinition, definitionAsString);
      });
    })
    .then(() => {
      console.log("Theme Template Generation Complete!");
    });
}

run();
