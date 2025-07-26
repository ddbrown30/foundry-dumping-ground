import { DEFAULT_CONFIG, SETTING_KEYS } from "./module-config.js";
import { Utils } from "./utils.js";

export function registerSettings() {
    Utils.registerSetting(SETTING_KEYS.warriorFavourites, {
        scope: "user",
        type: Array,
        default: []
    });

    Utils.registerSetting(SETTING_KEYS.warriorPack, {
        name: "Warrior's Gift Pack Preference",
        scope: "world",
        type: String,
        default: "swpf-core-rules.swpf-edges",
        choices: DEFAULT_CONFIG.warriorPacks,
        config: true,
        requiresReload: false,
    });
}