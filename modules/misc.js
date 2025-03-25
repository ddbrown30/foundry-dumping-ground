import { Utils } from "./utils.js";

export class Misc {

    static async healWounds(targets) {
        const wounds = await Dialog.wait({
            title: "Healing Result",
            content: "<label><p>Wounds to remove (put -1 if a critical failure increases the target's wounds level by one)</p><input type='number' id='wounds' value='1'/></label>",
            buttons: {
                default: {
                    icon: '<i class="fa-solid fa-kit-medical"></i>',
                    label: "Heal",
                    callback: (html) => { return html.find('#wounds')[0].value }
                }
            }
        });

        if (!wounds) {
            return;
        }

        let targetIds = targets.map(t => t.actor.uuid);
        game.foundryDumpingGround.socket.executeAsGM("executeHealWounds", targetIds, wounds);
    }

    static async executeHealWounds(targetIds, wounds) {
        let targets = targetIds.map(t => fromUuidSync(t));
        for (let target of targets) {
            const currentWounds = target.system.wounds.value;
            const newWounds = Math.max(currentWounds - wounds, 0)
            if (newWounds <= target.system.wounds.max) {
                await target.update({ "system.wounds.value": newWounds })
                game.succ.removeCondition("incapacitated", target);
                game.succ.removeCondition("dead", target);
                game.succ.removeCondition("bleeding-out", target);
            } else {
                target.update({ "system.wounds.value": target.system.wounds.max })
                game.succ.addCondition("incapacitated", target);
            }
        }
    }
}
