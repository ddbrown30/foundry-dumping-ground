import { Utils } from "./utils.js";

export class Summoner {

    static async startSummon(summonerToken) {
        let selectedActorUuid = await game.actorBrowser.openBrowser({actorTypes: ["npc", "character"], initialSourceFilter: "swade-ootd.odyssey-bestiary"});
        if (!selectedActorUuid) return;

        const crosshair = await Sequencer.Crosshair.show({ snap: { resolution: 1 } });
        if (!crosshair) return;

        if (game.user.isGM) {
            Summoner.executeSummon(crosshair, game.canvas.scene.id, selectedActorUuid, summonerToken?.id, game.user.id);
        } else {
            game.foundryDumpingGround.socket.executeAsGM("executeSummon", crosshair, game.canvas.scene.id, selectedActorUuid, summonerToken?.id, game.user.id);
        }
    }

    static async executeSummon(crosshair, sceneId, selectedActorUuid, summonerTokenId, userId) {        
        let summonedActor;
        if (selectedActorUuid.startsWith("Compendium")) {
            summonedActor = await game.tcal.importTransientActor(selectedActorUuid);
        } else {
            summonedActor = fromUuidSync(selectedActorUuid);
        }
        
        if (!summonedActor) return;
        
        let scene = game.scenes.find(s => s.id == sceneId);
        let user = game.users.get(userId);
        let disposition;

        let summonerTokenDoc = summonerTokenId ? scene.tokens.find(t => t.id == summonerTokenId) : null;
        if (summonerTokenDoc) {
            disposition = summonerTokenDoc.disposition;
        } else {
            disposition = user.isGM ? CONST.TOKEN_DISPOSITIONS.HOSTILE : CONST.TOKEN_DISPOSITIONS.FRIENDLY;
        }

        let removedOwnership = {};
        for (let key of Object.keys(summonedActor.ownership)) {
            removedOwnership[key] = 0;
        }
        
        const newTokenDoc = await summonedActor.getTokenDocument({
            x: crosshair.x - scene.grid.size / 2,
            y: crosshair.y - scene.grid.size / 2,
            disposition: CONST.TOKEN_DISPOSITIONS.SECRET,
            displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
            "bar1.attribute": "wounds",
            alpha: 0,
            "delta.ownership": removedOwnership,
            actorLink: false, //We always want to unlink the actor so that we don't modify the original
        });
        let createdTokenDoc = (await canvas.scene.createEmbeddedDocuments("Token", [newTokenDoc]))[0];
        game.foundryDumpingGround.socket.executeForEveryone("toggleVis", sceneId, createdTokenDoc.id, 0);

        let { x, y, width, height } = newTokenDoc;
            
        width *= scene.grid.sizeX;
        height *= scene.grid.sizeY;       
        const newCenterPoint = { x: x + (width / 2), y: y + (height / 2) };

        let summonSeq = new Sequence()
        .effect()
        .file("jb2a.magic_signs.circle.02.conjuration.intro.yellow")
        .atLocation(newCenterPoint, {gridUnits: true})
        .size(newTokenDoc.width * 1.5, { gridUnits: true })
        .belowTokens();

        summonSeq.effect()
        .file("jb2a.particle_burst.01.circle.yellow")
        .atLocation(newCenterPoint, {gridUnits: true})
        .size(newTokenDoc.width * 2, { gridUnits: true })
        .delay(1300)
        .belowTokens(false);
        
        summonSeq.animation()
        .on(createdTokenDoc)
        .opacity(1)
        .fadeIn(50)
        .delay(2300)
        .wait(3500)
        .thenDo(function () {
            game.foundryDumpingGround.socket.executeForEveryone("toggleVis", sceneId, createdTokenDoc.id, 1);

            let displayBars = createdTokenDoc.actor.system.wounds.max > 0 ? CONST.TOKEN_DISPLAY_MODES.ALWAYS : CONST.TOKEN_DISPLAY_MODES.NONE;

            let updateData = {
                displayBars: displayBars,
                disposition: disposition,
                delta: { ownership: {} },
            };

            updateData.delta.ownership[userId] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

            createdTokenDoc.update(updateData);
        })

        summonSeq.play();
    }
}
