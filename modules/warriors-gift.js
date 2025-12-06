import { FLAGS } from "./module-config.js";
import { Utils } from "./utils.js";
import { WarriorsGiftDialog } from "./warriors-gift-dialog.js";

export class WarriorsGift {

    static getEdgeRank(edge) {
        for (const req of edge.system.requirements) {
            if (req.type == "rank") {
                return foundry.CONFIG.SWADE.ranks[req.value];
            }
        }
        return "Novice";
    }

    static async warriorsGift(targets, type) {
        if (!targets.length) {
            ui.notifications.warn("No targets selected.");
            return;
        }

        let options = { type: type };
        if (targets.length == 1 && type == "mf") {
            const rank = targets[0].actor.system.advances.rank;
            options.rankFilter = foundry.CONFIG.SWADE.ranks.indexOf(rank);
        }

        let result = await new WarriorsGiftDialog(options).wait();
        if (!result) {
            return;
        }

        let targetIds = targets.map(t => t.actor.uuid);
        if (game.user.isGM) {
            WarriorsGift.executeWarriorsGift(type, targetIds, result.edges);
        } else {
            game.foundryDumpingGround.socket.executeAsGM("executeWarriorsGift", type, targetIds, result.edges);
        }
    }

    static async executeWarriorsGift(type, targetIds, edges) {
        let targets = [];
        for (const targetId of targetIds) {
            let target = fromUuidSync(targetId);
            if (target) {
                targets.push(target);
            }
        }

        const conditionId = type == "wg" ? "warriors-gift" : "martial-flexibility";
        if (!game.succ.getCondition(conditionId)) {
            ui.notifications.warn(conditionId + " condition does not exist");
            return;
        }

        const name = type == "wg" ? "Warrior's Gift" : "Martial Flexibility";
        for (const target of targets) {
            const createData = [];
            for (const edgeId of edges) {
                const edge = (await fromUuid(edgeId)).toObject();
                if (target.items.find((i) => i.name.includes(edge.name))) {
                    continue;
                }
                edge.name += ` (${name})`;
                createData.push(edge);
            }

            if (!createData.length) {
                ui.notifications.warn(target.name + " already has all requested edges");
                continue;
            }

            const effects = await game.succ.addCondition(conditionId, target);
            if (!effects.length) {
                ui.notifications.warn("Add condition failed on " + target.name);
                continue;
            }

            const createdItems = await target.createEmbeddedDocuments("Item", createData);
            const tempEdges = createdItems.map((e) => e.id);
            await Utils.setModuleFlag(effects[0], FLAGS.tempEdges, tempEdges);
        }
    }

    static onDeleteActiveEffect(effect, options, userId) {
        if (game.userId !== userId) {
            return;
        }

        const tempEdges = Utils.getModuleFlag(effect, FLAGS.tempEdges);
        if (!tempEdges?.length) {
            return;
        }

        const actor = effect.parent;
        const deleteData = actor.items.filter((i) => tempEdges.find((t) => t == i.id)).map((i) => i.id);
        if (!deleteData?.length) {
            return;
        }

        actor.deleteEmbeddedDocuments("Item", deleteData);
    }
}