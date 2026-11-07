import { DEFAULT_CONFIG, SETTING_KEYS } from "./module-config.js";
import { Utils } from "./utils.js";

export function registerSettings() {
    Utils.registerSetting(SETTING_KEYS.warriorFavourites, {
        scope: "user",
        type: Array,
        default: []
    });

    Utils.registerSetting(SETTING_KEYS.warriorSource, {
        name: "Warrior's Gift Source",
        scope: "world",
        type: String,
        default: "swpf-core-rules.swpf-edges",
        choices: DEFAULT_CONFIG.warriorPacks,
        config: true,
        requiresReload: false,
    });
}