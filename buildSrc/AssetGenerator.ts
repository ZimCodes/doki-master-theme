import path from "node:path";
import fs from "node:fs";
import {masterThemeDefinitionDirectoryPath, masterThemesDirectory, walkAndBuildTemplates,} from "./BuildFunctions";
import sharp from "sharp";

function buildBlankAsset(backgroundDirectory: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const img = sharp({
            create: {
                width: 300,
                height: 120,
                channels: 4,
                background: {r: 0, g: 0, b: 0, alpha: 1.0}
            }
        });
        resolve(img.toFile(backgroundDirectory));
    });
}


console.log("Preparing asset generation.");

function createAsset(assetPath: string): Promise<void> {
    fs.mkdirSync(path.resolve(assetPath, ".."), {
        recursive: true,
    });

    if (!fs.existsSync(assetPath)) {
        console.log("creating ", assetPath);
        return buildBlankAsset(assetPath);
    } else {
        return Promise.resolve();
    }
}

const createSmolAsset = (
    stickerPath: string,
    smolStickerPath: string
): Promise<void> => {
    fs.mkdirSync(path.resolve(smolStickerPath, ".."), {
        recursive: true,
    });
    return new Promise((resolve, reject) => {
        const img = sharp(smolStickerPath);
        img.metadata().then((metadata) => {
            const newHeight = metadata.width > metadata.height ? (metadata.height / metadata.width) * 150 : 150;
            const newWidth = metadata.height > metadata.width ? (metadata.width / metadata.height) * 150 : 150;
            console.log(`Read sticker ${stickerPath}`);
            img.resize({width: newWidth, height: newHeight});
            resolve(img.toFile(smolStickerPath));
            console.log(`Successfully smolified ${stickerPath}`);
        });
    });
};

const createSmolWallpaper = (
    transparentWallpaperPath: string,
    smolWallpaperPath: string
): Promise<void> => {
    console.log(`Smolifying wallpaper ${transparentWallpaperPath}`);

    fs.mkdirSync(path.resolve(smolWallpaperPath, ".."), {
        recursive: true,
    });
    return new Promise((resolve, reject) => {
        const img = sharp(transparentWallpaperPath);
        img.metadata().then((metadata) => {
            console.log(`Read wallpaper ${transparentWallpaperPath}`);
            const width = metadata.width;
            const height = metadata.height;
            if (width <= 1920) {
                console.log(`Didn't need to do anything for ${transparentWallpaperPath}`);
                fs.copyFileSync(
                    transparentWallpaperPath, smolWallpaperPath
                );
                resolve();
            } else {
                const newWidth = 1920;
                const newHeight = 1920 * (height / width);
                img.resize({width: newWidth, height: newHeight});
                resolve(img.toFile(smolWallpaperPath));
                console.log(`Successfully smolified ${transparentWallpaperPath}`);
            }
        });
    });
};

walkAndBuildTemplates()
    .then((dokiThemes) => {
        const dokiThemeAssetsDirectory = path.resolve(
            masterThemesDirectory,
            "..",
            "..",
            "doki-theme-assets"
        );

        return dokiThemes
            .map(({dokiFileDefinitionPath, dokiThemeDefinition}) =>
                Object.entries(dokiThemeDefinition.stickers).map(([, stickerName]) => ({
                    dokiFileDefinitionPath,
                    stickerName: stickerName.name,
                }))
            )
            .reduce((accum, next) => [...accum, ...next], [])
            .reduce(
                (accum, dokiTheme) =>
                    accum.then(() => {
                        const {dokiFileDefinitionPath, stickerName} = dokiTheme;
                        const destinationPath = dokiFileDefinitionPath.substr(
                            masterThemeDefinitionDirectoryPath.length
                        );
                        const stickerPath =
                            destinationPath.substr(0, destinationPath.lastIndexOf(path.sep) + 1) +
                            stickerName;

                        // creates all necessary sticker assets
                        return Promise.all(
                            [["jetbrains", "v2"], ["vscode"]].map((directories) => {
                                const fullStickerPath = path.join(
                                    dokiThemeAssetsDirectory,
                                    "stickers",
                                    ...directories,
                                    stickerPath
                                );
                                return createAsset(fullStickerPath);
                            })
                        )
                            .then(() => {
                                // create all background image templates
                                return Promise.all(
                                    [
                                        ["backgrounds"],
                                        ["backgrounds", "wallpapers"],
                                        ["backgrounds", "wallpapers", "transparent"],
                                    ].map((directories) => {
                                        const wallpaperPath = path.join(
                                            dokiThemeAssetsDirectory,
                                            ...directories,
                                            stickerName
                                        );
                                        return createAsset(wallpaperPath);
                                    })
                                );
                            })
                            .then(() => {
                                if (process.argv[2] !== '--smol') return;

                                // create all smol image assets for doki-home
                                const chonkyStickerPath = path.join(
                                    dokiThemeAssetsDirectory,
                                    "stickers", "jetbrains", "v2",
                                    stickerPath
                                );
                                const smolStickerPath = path.join(
                                    dokiThemeAssetsDirectory,
                                    "stickers", "smol",
                                    stickerPath
                                );
                                const chonkyWallpaperPath = path.join(
                                    dokiThemeAssetsDirectory,
                                    "backgrounds", "wallpapers", "transparent",
                                    stickerName
                                );
                                const smolWallpaperPath = path.join(
                                    dokiThemeAssetsDirectory,
                                    "backgrounds", "wallpapers", "transparent", "smol",
                                    stickerName
                                );
                                return createSmolAsset(
                                    chonkyStickerPath,
                                    smolStickerPath,
                                ).then(() =>
                                    createSmolWallpaper(
                                        chonkyWallpaperPath,
                                        smolWallpaperPath,
                                    )
                                );
                            })
                            .then(() => "");
                    }),
                Promise.resolve("")
            );
    })
    .then(() => {
        console.log("Asset Generation Complete!");
    });
