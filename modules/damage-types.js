import { DEFAULT_CONFIG } from "./module-config.js";
import { Utils } from "./utils.js";

export class DamageTypes {

    static async onRenderItemSheet(itemSheet, html, context, options) {
        if (!itemSheet.item.system.damage) return;

        const dmgMod = html.querySelector('section .form-group label[for$="-dmgMod"]')?.parentElement;
        if (!dmgMod) return;

        let data = {
            damageType: Utils.getModuleFlag(itemSheet.item, "damageType"),
            damageTypeOptions: {
                none: "",
                bludgeoning: "Bludgeoning",
                piercing: "Piercing",
                slashing: "Slashing",
                acid: "Acid",
                cold: "Cold",
                electricity: "Electricity",
                fire: "Fire",
                sonic: "Sonic",
                holy: "Holy",
                death: "Death",
                force: "Force",
                mental: "Mental",
                poison: "Poison",
            }
        };

        const content = await foundry.applications.handlebars.renderTemplate(DEFAULT_CONFIG.templates.damageTypeGroup, data);
        dmgMod.insertAdjacentHTML("afterend", content);
    }

    static async onPreUpdateItem(item, change, options, userId) {
        const damageTypeChanged = Utils.hasModuleFlags(change);
        if (change.system?.damage === undefined && !damageTypeChanged) return;

        const oldDamageType = Utils.getModuleFlag(item, "damageType") ?? "none";
        const newDamageType = Utils.getModuleFlag(change, "damageType") ?? oldDamageType;
        let newDamage = change.system?.damage ?? item.system.damage;
        if (damageTypeChanged) {
            newDamage = newDamage.replace(new RegExp(`(\\b(?:\\d+)?d\\d+\\b)\\[${oldDamageType}\\]`, "g"), "$1");
        }

        if (newDamageType !== "none") {
            newDamage = newDamage.replace(/\b(?:\d+)?d\d+\b(?!\[)/g, match => `${match}[${newDamageType}]`);
        }

        change.system.damage = newDamage;
    }
}
