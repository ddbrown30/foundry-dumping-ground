import * as CONFIG from "./config.js";

/**
 * Provides helper methods for use elsewhere in the module
 */
export class Utils {

    /**
     * Get a single setting using the provided key
     * @param {*} key 
     * @returns {Object} setting
     */
    static getSetting(key) {
        return game.settings.get(CONFIG.NAME, key);
    }

    /**
     * Sets a single game setting
     * @param {*} key 
     * @param {*} value 
     * @param {*} awaitResult 
     * @returns {Promise | ClientSetting}
     */
    static async setSetting(key, value, awaitResult=false) {
        if (!awaitResult) {
            return game.settings.set(CONFIG.NAME, key, value);
        }

        await game.settings.set(CONFIG.NAME, key, value).then(result => {
            return result;
        }).catch(rejected => {
            throw rejected;
        });
    }

    /**
     * Register a single setting using the provided key and setting data
     * @param {*} key 
     * @param {*} metadata 
     * @returns {ClientSettings.register}
     */
    static registerSetting(key, metadata) {
        return game.settings.register(CONFIG.NAME, key, metadata);
    }

    /**
     * Register a menu setting using the provided key and setting data
     * @param {*} key 
     * @param {*} metadata 
     * @returns {ClientSettings.registerMenu}
     */
    static registerMenu(key, metadata) {
        return game.settings.registerMenu(CONFIG.NAME, key, metadata);
    }

    /**
     * Loads templates for partials
     */
    static async loadTemplates() {
        const templates = [
        ];
        await loadTemplates(templates)
    }

    static showNotification(type, message, options) {
        const msg = `${CONFIG.SHORT_TITLE} | ${message}`;
        return ui.notifications[type](msg, options);
    }
    
    static consoleMessage(type, {objects=[], message="", subStr=[]}) {
        const msg = `${CONFIG.TITLE} | ${message}`;
        const params = [];
        if (objects && objects.length) params.push(objects);
        if (msg) params.push(msg);
        if (subStr && subStr.length) params.push(subStr);
        return console[type](...params);
    }

    static hasModuleFlags(obj) {
        if (!obj.flags) {
            return false;
        }

        return obj.flags[CONFIG.NAME] ? true : false;
    }

    static getModuleFlag(obj, flag) {
        if (!Utils.hasModuleFlags(obj)) {
            return;
        }

        return obj.flags[CONFIG.NAME][flag];
    }

    static async setModuleFlag(obj, flag, data) {
        return await obj.setFlag(CONFIG.NAME, flag, data);
    }

    static parseJson(str) {
        try {
            str = str.replace("<p>", "");
            str = str.replace("</p>", "");
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }
}