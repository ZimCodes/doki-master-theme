import fs from "node:fs";
import { walkAndBuildTemplates } from "./BuildFunctions";
import { MasterDokiThemeDefinition } from "doki-build-source";

console.log("Preparing to modify theme definitions.");

function doSomethingToThemeDefinition(dokiTheme: { dokiThemeDefinition: MasterDokiThemeDefinition; dokiFileDefinitionPath: string }) {
}

walkAndBuildTemplates()
  .then((dokiThemes) => {
    return dokiThemes
      .reduce(
        (accum, dokiTheme) =>
          accum.then(() => {
            fs.writeFileSync(dokiTheme.dokiFileDefinitionPath,
              JSON.stringify(dokiTheme.dokiThemeDefinition, null, 2)
            );

            return Promise.resolve("dun");
          }),
        Promise.resolve("")
      );
  })
  .then(() => {
    console.log("Modification Complete!");
  });
