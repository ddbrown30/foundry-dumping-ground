import { DEFAULT_CONFIG } from "./module-config.js";
import { Utils } from "./utils.js";

export class SUCC {

    static getActorFromEntity(entity) {
        return entity instanceof Actor ? entity : entity instanceof Token || entity instanceof TokenDocument ? entity.actor : null;;
    }

    static async addCondition(conditionId, entities, options) {
        if (!entities) {
            return;
        }

        if (entities && !(entities instanceof Array)) {
            entities = [entities];
        }

        let actors = [];
        let actorUuids = [];
        for (let entity of entities) {
            const actor = SUCC.getActorFromEntity(entity);            
            if (actor) {
                actors.push(actor);
                actorUuids.push(actor.uuid);
            }
        }

        if (entities.length == 1) {
            let actor = SUCC.getActorFromEntity(entities[0]);
            if (actor.isOwner) {
                game.succ.addCondition(conditionId, actors, options);
            } else {
                game.foundryDumpingGround.socket.executeAsGM("executeAddCondition", conditionId, actorUuids, options);
            }
        } else {
            game.foundryDumpingGround.socket.executeAsGM("executeAddCondition", conditionId, actorUuids, options);
        }
    }

    static async executeAddCondition(conditionId, actorUuids, options) {
        let actors = [];
        for (let actorUuid of actorUuids) {
            let actor = fromUuidSync(actorUuid);         
            if (actor) {
                actors.push(actor);
            }
        }

        options = options ?? undefined; //An undefined options param gets converted to null when sent over the socket so we need to change it back
        game.succ.addCondition(conditionId, actors, options);
    }

    static async addConditionAsUser(conditionId, entities, options) {
        if (!entities) {
            return;
        }

        if (entities && !(entities instanceof Array)) {
            entities = [entities];
        }

        for (let entity of entities) {
            const actor = SUCC.getActorFromEntity(entity);            
            if (actor) {
                if (actor.canUserModify(game.user)) {
                    game.succ.addCondition(conditionId, actor, options);
                    continue;
                }

                let owners = Utils.getDocumentOwners(actor);

                let handled = false;
                for (let owner of owners) {
                    if (owner?.active) {
                        game.foundryDumpingGround.socket.executeAsUser("executeAddCondition", owner.id, conditionId, [actor.uuid], options);
                        handled = true;
                        break;
                    }
                }

                if (!handled) {
                    game.foundryDumpingGround.socket.executeAsGM("executeAddCondition", conditionId, [actor.uuid], options);
                }
            }
        }
    }

    static async blind(entities) {
        let condition = game.succ.getCondition("blind");
        const numbData = { condition };
        const content = await renderTemplate(DEFAULT_CONFIG.templates.blindDialog, numbData);

        let result = await foundry.applications.api.DialogV2.wait({
            window: { title: "Blind" },
            position: { width: 400 },
            content: content,
            classes: ["succ-dialog"],
            rejectClose: false,
            buttons: [
                {
                    label: "Success",
                    action: "success",
                    callback: () => { return { degree: "success" }; }
                },
                {
                    label: "Raise",
                    action: "raise",
                    callback: () => { return { degree: "raise" }; }
                },
                {
                    label: "Cancel",
                    action: "cancel",
                    callback: () => false
                }
            ]
        });
        
        if (!result) {
            return;
        }
        
        SUCC.addCondition("blind", entities);
        if (result.degree == "raise") {
            SUCC.addCondition("blind-raise", entities);
        }
    }
}
