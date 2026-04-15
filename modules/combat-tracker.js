import { FLAGS } from "./module-config.js";
import { StaticCombatantDialog } from "./static-combatant-dialog.js";
import { Utils } from "./utils.js";

export class CombatTracker {

    static async addStaticCombatantDialog() {
        new StaticCombatantDialog().render(true);
    }

    static async addStaticCombatant(combat, data) {
        const combatantData = {
            name: data.name,
            sceneId: combat.scene?.id ?? game.canvas.scene.id,
            hidden: data.hidden,
            initiative: data.initiative,
            img: data.img,
            defeated: false,
            system: {
                cardValue: data.initiative,
                cardString: data.cardString,
            },
        };

        let result = await combat.createEmbeddedDocuments("Combatant", [combatantData]);

        combatantData._id = result[0].id;

        let staticCombatants = Utils.getModuleFlag(combat, FLAGS.staticCombatants) ?? [];
        staticCombatants.push(combatantData);
        await Utils.setModuleFlag(combat, FLAGS.staticCombatants, staticCombatants);
    }

    static async onUpdateCombatant(combatant, change, options, userId) {
        let staticCombatants = Utils.getModuleFlag(combatant.combat, FLAGS.staticCombatants) ?? [];
        staticCombatants = staticCombatants.filter(sc => {
            const findComb = combatant.combat.combatants.find(c => c.id === sc._id);
            return findComb && findComb.defeated;
        });
        if (!staticCombatants.length) return;
        await combatant.combat.updateEmbeddedDocuments("Combatant", staticCombatants);
    }

    static async onDeleteCombatant(combatant, options, userId) {
        let staticCombatants = Utils.getModuleFlag(combatant.combat, FLAGS.staticCombatants) ?? [];
        if (!staticCombatants.length) return;
        let combIdx = staticCombatants.findIndex(sc => sc._id === combatant.id);
        if (combIdx < 0) return;
        staticCombatants.splice(combIdx, 1);
        await Utils.setModuleFlag(combatant.combat, FLAGS.staticCombatants, staticCombatants);
    }

    static async onUpdateCombat(combat, change, options, userId) {
        if (!("round" in change)) return;
        let staticCombatants = Utils.getModuleFlag(combat, FLAGS.staticCombatants) ?? [];
        if (!staticCombatants.length) return;
        const updates = staticCombatants.map(sc => {
            return {
                _id: sc._id,
                defeated: true,
            };
        });
        let result = await combat.updateEmbeddedDocuments("Combatant", updates);
        console.log(result);
    }
}
