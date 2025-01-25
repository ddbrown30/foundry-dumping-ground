import * as CONFIG from "./config.js";
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
        let actorIds = [];
        for (let entity of entities) {
            const actor = SUCC.getActorFromEntity(entity);            
            if (actor) {
                actors.push(actor);
                actorIds.push(actor.id);
            }
        }

        if (entities.length == 1) {
            let entity = entities[0];
            let actor = SUCC.getActorFromEntity(entity);
            if (actor.isOwner) {
                game.succ.addCondition(conditionId, actors, options);
            } else {
                game.foundryDumpingGround.socket.executeAsGM("executeAddCondition", conditionId, actorIds, options);
            }
        } else {
            game.foundryDumpingGround.socket.executeAsGM("executeAddCondition", conditionId, actorIds, options);
        }
    }

    static async executeAddCondition(conditionId, actorIds, options) {
        let actors = [];
        for (let actorId of actorIds) {
            let actor = game.actors.get(actorId);         
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

        let actors = [];
        let actorIds = [];
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
                        game.foundryDumpingGround.socket.executeAsUser("executeAddCondition", owner.id, conditionId, [actor.id], options);
                        handled = true;
                        break;
                    }
                }

                if (!handled) {
                    game.foundryDumpingGround.socket.executeAsGM("executeAddCondition", conditionId, [actor.id], options);
                }
            }
        }

        if (entities.length == 1) {
            let entity = entities[0];
            let actor = SUCC.getActorFromEntity(entity);
            if (actor.isOwner) {
                game.succ.addCondition(conditionId, actors, options);
            } else {
                game.foundryDumpingGround.socket.executeAsGM("executeAddCondition", conditionId, actorIds, options);
            }
        } else {
            game.foundryDumpingGround.socket.executeAsGM("executeAddCondition", conditionId, actorIds, options);
        }
    }
}
