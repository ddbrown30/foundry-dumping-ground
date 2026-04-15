import { CombatTracker } from "./combat-tracker.js";
import { DEFAULT_CONFIG } from "./module-config.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Dialog for adding a static combatant
 */
export class StaticCombatantDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "static-combatant-dialog",
        tag: "form",
        form: {
            handler: StaticCombatantDialog.formHandler,
            submitOnChange: false,
            closeOnSubmit: true
        },
        classes: ["fdg"],
        window: { title: "Add Static Combatant", contentClasses: ["fdg-dialog"] },
        position: { width: "300", height: "auto" },
        actions: {
            add: function (event, button) { this.submit(); },
            cancel: function (event, button) { this.close(); }
        },
    };

    static PARTS = {
        form: {
            template: DEFAULT_CONFIG.templates.staticCombatantDialog,
        }
    };

    static async formHandler(event, form, formData) {
        const fdo = formData.object;
        const combatantData = {
            name: fdo.name,
            img: fdo.img,
            initiative: fdo.initiative,
            cardString: fdo.cardString,
            hidden: fdo.hidden,
        };

        CombatTracker.addStaticCombatant(game.combats.active, combatantData);
    }
}