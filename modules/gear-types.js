import { DEFAULT_CONFIG } from "./module-config.js";
import { Utils } from "./utils.js";

export class GearTypes {

    static async onRenderItemSheet(itemSheet, html, context) {
        if (itemSheet.item.type !== "gear") return;

        const dmgMod = html.querySelector('section .form-group label[for$="-vehicular"]')?.parentElement;
        if (!dmgMod) return;

        let data = {
            gearType: Utils.getModuleFlag(itemSheet.item, "gearType") ?? "misc",
            gearTypeOptions: {
                accessory: "Accessory",
                ammo: "Ammunition",
                clothing: "Clothing",
                misc: "Misc",
                wand: "Wand",
                wondrous: "Wondrous Item",
            }
        };

        const content = await foundry.applications.handlebars.renderTemplate(DEFAULT_CONFIG.templates.gearTypeGroup, data);
        dmgMod.insertAdjacentHTML("afterend", content);
    }

    static onRenderActorSheet(app, html, data) {
        const inventory = html.querySelector("section.inventory");
        if (!inventory) return;

        const miscHeader = inventory.querySelector("header.misc");
        const miscList = miscHeader?.nextElementSibling;
        if (!miscHeader || miscList?.tagName !== "UL") return;

        const groups = new Map();
        for (const li of [...miscList.children]) {
            const item = data.actor.items.get(li.dataset.itemId);
            const gearType = Utils.getModuleFlag(item, "gearType") ?? "misc";
            if (!groups.has(gearType)) groups.set(gearType, []);
            groups.get(gearType).push(li);
        }

        const insertGearTypeHeader = (type, label, anchor) => {
            const items = groups.get(type);
            if (!items?.length || !anchor) return anchor;

            const header = document.createElement("header");
            header.className = "header misc";
            header.innerHTML = `<span class="header-name">${label}</span><span class="weight">${game.i18n.localize("SWADE.Weight")}</span><span class="item-controls"></span>`;
            anchor.insertAdjacentElement("afterend", header);

            const list = document.createElement("ul");
            items.forEach(li => list.appendChild(li));
            header.insertAdjacentElement("afterend", list);

            return list;
        };

        let cursor = inventory.querySelector("header.armor")?.nextElementSibling;
        cursor = insertGearTypeHeader("clothing", "Clothing", cursor) ?? cursor;
        insertGearTypeHeader("accessory", "Accessories", cursor);

        cursor = inventory.querySelector("header.consumable")?.nextElementSibling;
        cursor = insertGearTypeHeader("wand", "Wands", cursor) ?? cursor;
        cursor = insertGearTypeHeader("wondrous", "Wondrous Items", cursor) ?? cursor;
        insertGearTypeHeader("ammo", "Ammunition", cursor);
    }
}
