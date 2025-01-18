import * as CONFIG from "./config.js";
import { Utils } from "./utils.js";

export class Teleporter {

    static async startTeleport(token) {
        const successRadius = 0.5 + CONFIG.CONST.teleportSuccessDist;
        const raiseRadius = 0.5 + CONFIG.CONST.teleportRaiseDist;
        const raiseCircleData = {
            lineSize: 4,
            lineColor: "#FFFFFF",
            radius: raiseRadius,
            fillAlpha: .5,
            fillColor: "#FF0000",
            gridUnits: true,
            name: "teleRange"
        }

        const successCircleData = { ...raiseCircleData };
        successCircleData.fillColor = "#00FF00";
        successCircleData.radius = successRadius;
        successCircleData.fillAlpha = .5;

        // let filter = new window.Sequencer.MaskFilter;
        // filter.apply();
        let rangeSeq = await new Sequence();
        rangeSeq.effect()
            .fadeIn(500)
            .fadeOut(100)
            .persist()
            .atLocation(token)
            .forUsers(game.user.id)
            .elevation(token?.document?.elevation)
            .belowTokens()
            .name("teleportation")
            .shape("circle", raiseCircleData);
            
        rangeSeq.effect()
            .fadeIn(500)
            .fadeOut(100)
            .persist()
            .atLocation(token)
            .forUsers(game.user.id)
            .elevation(token?.document?.elevation)
            .belowTokens()
            .name("teleportation")
            .shape("circle", successCircleData);

        rangeSeq.play();

        const crosshair = await Sequencer.Crosshair.show();

        Sequencer.EffectManager.endEffects({ name: "teleportation" })

        if (crosshair) {
            if (token.isOwner) {
                Teleporter.executeTeleport(crosshair, token.scene.id, token.id);
            } else {
                game.foundryDumpingGround.socket.executeAsGM("executeTeleport", crosshair, token.scene.id, token.id);
            }
        }
    }


    static async toggleVis(sceneId, tokenId, val) {
        let token = game.scenes.find(s => s.id == sceneId).tokens.find(t => t.id == tokenId).object;
        token.border.alpha = val;
        token.target.alpha = val;
    }

    static async executeTeleport(crosshair, sceneId, tokenId) {
        let token = game.scenes.find(s => s.id == sceneId).tokens.find(t => t.id == tokenId).object;
        let teleSeq = new Sequence();

        let startX = token.center?.x;
        let startY = token.center?.y;

        let tokenGS = token.w / canvas.grid.size;

        // Start Animation
        let startEffect = teleSeq.effect();
        startEffect.file("jb2a.misty_step.01.blue");
        startEffect.atLocation({ x: startX, y: startY });
        startEffect.elevation(token?.document?.elevation + 1);
        startEffect.size(tokenGS * 1.5, { gridUnits: true });
        startEffect.fadeIn(250);
        startEffect.fadeOut(250);

        // End Animation
        let endEffect = teleSeq.effect();
        endEffect.file("jb2a.misty_step.02.blue");
        endEffect.atLocation(crosshair);
        endEffect.delay(500)
        endEffect.elevation(token?.document?.elevation + 1);
        endEffect.size(tokenGS * 1.5, { gridUnits: true });
        endEffect.fadeIn(250);
        endEffect.fadeOut(250);

        // FadeOut Token
        let fadeSeq = teleSeq.animation();
        fadeSeq.on(token);
        fadeSeq.opacity(0);
        fadeSeq.delay(750);

        let oldDisplayBars = token.document.displayBars;
        await token.document.update({ displayBars: CONST.TOKEN_DISPLAY_MODES.NONE });
        game.foundryDumpingGround.socket.executeForEveryone("toggleVis", sceneId, tokenId, 0);

        // Move Token
        let animSeq = teleSeq.animation();
        animSeq.on(token);
        animSeq.delay(750);
        animSeq.teleportTo({ x: crosshair.x, y: crosshair.y, elevation: token?.document?.elevation }, { relativeToCenter: true });

        // Token to Full Opacity
        let tokenSeq = teleSeq.animation();
        tokenSeq.on(token);
        tokenSeq.opacity(1);
        tokenSeq.delay(2000);
        tokenSeq.wait(2000);
        tokenSeq.thenDo(function () {
            token.document.update({ displayBars: oldDisplayBars });
            game.foundryDumpingGround.socket.executeForEveryone("toggleVis", sceneId, tokenId, 1);
        })

        await teleSeq.play();
    }
}
