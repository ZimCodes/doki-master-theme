import {MasterDokiThemeDefinition,} from "doki-build-source";
import path from "node:path";
import fs from "node:fs";
import {masterThemeDefinitionDirectoryPath, masterThemesDirectory, walkAndBuildTemplates} from "./BuildFunctions";
import process from "node:process"

const jetbrainsTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  editorScheme: {
    type: "template",
    name: dokiThemeDefinition.dark ? "Doki Dark" : "Doki Light v2",
  },
  overrides: {},
  ui: {},
});

const vsCodeTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
});

const visualStudioTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
});

const chromeTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
});

const firefoxTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
});


const vimTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
});

const hyperTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
});

const githubTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
});

const eclipseTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
});

const jupyterTemplate = (dokiThemeDefinition: MasterDokiThemeDefinition) => ({
  id: dokiThemeDefinition.id,
  overrides: {},
  laf: {},
  syntax: {},
  colors: {},
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
      return {name: 'vsCode', template: vsCodeTemplate(dokiThemeDefinition)};
    case '--hyper':
      return {name: 'hyper', template: hyperTemplate(dokiThemeDefinition)};
    case '--chrome':
      return {name: 'chrome', template: chromeTemplate(dokiThemeDefinition)};
    case '--vim':
      return {name: 'vim', template: vimTemplate(dokiThemeDefinition)};
    case '--github':
      return {name: 'github', template: githubTemplate(dokiThemeDefinition)};
    case '--eclipse':
      return {name: 'eclipse', template: githubTemplate(dokiThemeDefinition)};
    case '--jupyter':
      return {name: 'jupyter', template: jupyterTemplate(dokiThemeDefinition)};
    case '--home':
      return {name: 'home', template: homeTemplate(dokiThemeDefinition)};
    case '--vsstudio':
      return {name: 'visualstudio', template: visualStudioTemplate(dokiThemeDefinition)};
    case '--firefox':
      return {name: 'firefox', template: firefoxTemplate(dokiThemeDefinition)};
    default:
      return {name: 'jetbrains', template: jetbrainsTemplate(dokiThemeDefinition)};
  }
}

/**
 * You also want to change this as well
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


console.log("Preparing to generate theme templates.");

walkAndBuildTemplates()
  .then((dokiThemes) => {
    const themeDirectory = getThemeDirectoryPath(appArg);
    dokiThemes.forEach((dokiTheme) => {
      const {dokiFileDefinitionPath, dokiThemeDefinition} = dokiTheme;

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
        `${appName}.definition`
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

function getExistingAppDefinition(appTemplateDefinition: string) {
  if (fs.existsSync(appTemplateDefinition)) {
    return JSON.parse(fs.readFileSync(appTemplateDefinition, {encoding: 'utf-8'}));
  }

  return {}
}
