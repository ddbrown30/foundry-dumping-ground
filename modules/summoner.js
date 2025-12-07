import { SummonDialog } from "./summon-dialog.js";

export class Summoner {

    static async startSummon(summonerToken, options={}) {
        if (options.activeEffectName) {
            if (!summonerToken) {
                ui.notifications.warn("No summoner selected.");
                return;
            }
        }

        let traits = {};
        if (!options.skipDialog) {
            let dialogResult = await new SummonDialog(options).wait();
            if (!dialogResult) {
                return;
            }
            traits = dialogResult;
        }

        let selectedActorUuid = await game.actorBrowser.openBrowser({
            actorTypes: ["npc", "character"],
            initialSourceFilter: "swade-ootd.odyssey-bestiary",
            searchName: options.searchName,
            tags: options.tags,
        });
        if (!selectedActorUuid) return;

        const crosshair = await Sequencer.Crosshair.show({ snap: { resolution: 1 } });
        if (!crosshair) return;

        const args = {
            options: options,
            crosshair: crosshair,
            sceneId: game.canvas.scene.id,
            selectedActorUuid: selectedActorUuid,
            summonerTokenUuid: summonerToken?.document.uuid,
            userId: game.user.id,
            traits: traits,
        }

        if (game.user.isGM) {
            Summoner.executeSummon(args);
        } else {
            game.foundryDumpingGround.socket.executeAsGM("executeSummon", args);
        }
    }

    static async executeSummon(args) {
        let summonedActor;
        if (args.selectedActorUuid.startsWith("Compendium")) {
            summonedActor = await game.tcal.importTransientActor(args.selectedActorUuid);
        } else {
            summonedActor = fromUuidSync(args.selectedActorUuid);
        }

        if (!summonedActor) return;

        let scene = game.scenes.find(s => s.id == args.sceneId);
        let user = game.users.get(args.userId);

        let disposition = CONST.TOKEN_DISPOSITIONS.SECRET;
        let summonerTokenDoc = args.summonerTokenUuid ? fromUuidSync(args.summonerTokenUuid) : null;
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
            x: args.crosshair.x - scene.grid.size / 2,
            y: args.crosshair.y - scene.grid.size / 2,
            disposition: CONST.TOKEN_DISPOSITIONS.SECRET,
            displayBars: CONST.TOKEN_DISPLAY_MODES.NONE,
            "bar1.attribute": "wounds",
            alpha: 0,
            "delta.ownership": removedOwnership,
            actorLink: false, //We always want to unlink the actor so that we don't modify the original
        });

        let createdTokenDoc = (await canvas.scene.createEmbeddedDocuments("Token", [newTokenDoc]))[0];
        game.foundryDumpingGround.socket.executeForEveryone("toggleVis", createdTokenDoc.uuid, 0);

        //If we have an AE name, create a new AE on the summoner token
        if (summonerTokenDoc && args.options.activeEffectName) {
            const createAEData = [{
                id: "summon-" + createdTokenDoc.uuid,
                name: args.options.activeEffectName,
                img: createdTokenDoc.texture.src,
                system: { expiration: 3 },
                duration: { rounds: 5 },
            }];
            await summonerTokenDoc.actor.createEmbeddedDocuments("ActiveEffect", createAEData);
        }

        //Apply attribute increases changes
        if (args.traits?.attributes?.length) {
            let actorUpdateData = {};
            for (const attribute of args.traits.attributes) {
                const keyPath = `system.attributes.${attribute.toLowerCase()}.die.sides`;
                actorUpdateData[keyPath] = foundry.utils.getProperty(createdTokenDoc.actor, keyPath) + 2;
            }
            await createdTokenDoc.actor.update(actorUpdateData);
        }

        //Apply skill increases changes
        if (args.traits?.skills?.length) {
            let skillUpdates = [];
            let skillsToAdd = [];
            for (const skillId of args.traits.skills) {
                const sourceSkill = await fromUuid(skillId);
                const actorSkill = createdTokenDoc.actor.items.find(s => s.type == "skill" && s.name.toLowerCase() === sourceSkill.name.toLowerCase());
                if (actorSkill) {
                    skillUpdates.push({
                        _id: actorSkill.id,
                        "system.die.sides": foundry.utils.getProperty(actorSkill, "system.die.sides") + 2,
                    });
                } else {
                    skillsToAdd.push(sourceSkill);
                }
            }

            if (skillUpdates.length > 0) {
                await createdTokenDoc.actor.updateEmbeddedDocuments("Item", skillUpdates);
            }

            if (skillsToAdd.length > 0) {
                await createdTokenDoc.actor.createEmbeddedDocuments("Item", skillsToAdd, { render: false, renderSheet: false });
            }
        }

        let { x, y, width, height } = newTokenDoc;

        width *= scene.grid.sizeX;
        height *= scene.grid.sizeY;
        const newCenterPoint = { x: x + (width / 2), y: y + (height / 2) };

        let summonSeq = new Sequence()
            .effect()
            .file("jb2a.magic_signs.circle.02.conjuration.intro.yellow")
            .atLocation(newCenterPoint, { gridUnits: true })
            .size(newTokenDoc.width * 1.5, { gridUnits: true })
            .belowTokens();

        summonSeq.effect()
            .file("jb2a.particle_burst.01.circle.yellow")
            .atLocation(newCenterPoint, { gridUnits: true })
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
                game.foundryDumpingGround.socket.executeForEveryone("toggleVis", createdTokenDoc.uuid, 1);

                let displayBars = createdTokenDoc.actor.system.wounds.max > 0 ? CONST.TOKEN_DISPLAY_MODES.ALWAYS : CONST.TOKEN_DISPLAY_MODES.NONE;

                let updateData = {
                    displayBars: displayBars,
                    disposition: disposition,
                    delta: { ownership: {} },
                };

                updateData.delta.ownership[args.userId] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;

                createdTokenDoc.update(updateData);
            });

        summonSeq.play();
    }
}
