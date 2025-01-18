import * as CONFIG from "./config.js";
import { Utils } from "./utils.js";

export function registerSettings() {

    Utils.registerSetting(CONFIG.SETTING_KEYS.lastGitCheck, {
        scope: "client",
        config: false,
        type: Number,
        default: 0,
    });
    
    Utils.registerSetting(CONFIG.SETTING_KEYS.viewedReleaseUpdate, {
        scope: "client ",
        config: false,
        type: String,
        default: "0",
    });
}