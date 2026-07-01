import {
  MasterDokiThemeDefinition,
  readJson,
  walkDir,
} from "doki-build-source";
import path from "node:path";

export const masterThemesDirectory = path.resolve(__dirname, "..");

export const masterThemeDefinitionDirectoryPath = path.resolve(
  masterThemesDirectory,
  "definitions"
);


export function walkAndBuildTemplates(themeDefinitionDirPath = masterThemeDefinitionDirectoryPath) {
  return walkDir(themeDefinitionDirPath)
    .then((files) => files.filter((file) => file.endsWith("master.definition.json")))
    .then((templatesAndDefinitions) => {
      return templatesAndDefinitions.map((dokiFileDefinitionPath) => ({
        dokiFileDefinitionPath,
        dokiThemeDefinition: readJson<MasterDokiThemeDefinition>(
          dokiFileDefinitionPath
        ),
      }));
    });
}
