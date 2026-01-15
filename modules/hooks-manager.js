import { Utils } from "./utils.js";
import { registerSettings } from "./settings.js";
import { Teleporter } from "./teleporter.js";
import { SUCC } from "./succ.js";
import { Misc } from "./misc.js";
import { NAME } from "./module-config.js";
import { Summoner } from "./summoner.js";
import { WarriorsGift } from "./warriors-gift.js";
import { BTeam } from "./b-team.js";

export class HooksManager {
    /**
     * Registers hooks
     */
    static registerHooks() {

        /* ------------------- Init/Ready ------------------- */

        Hooks.on("init", () => {
            game.foundryDumpingGround = game.foundryDumpingGround ?? {};

            // Expose API methods
            game.foundryDumpingGround.startTeleport = Teleporter.startTeleport;
            game.foundryDumpingGround.addCondition = SUCC.addCondition;
            game.foundryDumpingGround.addConditionAsUser = SUCC.addConditionAsUser;
            game.foundryDumpingGround.healWounds = Misc.healWounds;
            game.foundryDumpingGround.getSelected = Utils.getSelected;
            game.foundryDumpingGround.blind = SUCC.blind;
            game.foundryDumpingGround.startSummon = Summoner.startSummon;
            game.foundryDumpingGround.exportItems = Misc.exportItems;
            game.foundryDumpingGround.warriorsGift = WarriorsGift.warriorsGift;

            Utils.loadTemplates();
            registerSettings();
        });

        Hooks.on("ready", () => {
            if (game.user.name == "TV Display") {
                document.querySelector("#ui-middle").classList.add("max-carousel-width");
            }
        });

        Hooks.once("socketlib.ready", () => {
            game.foundryDumpingGround = game.foundryDumpingGround ?? {};

            game.foundryDumpingGround.socket = socketlib.registerModule(NAME);
            game.foundryDumpingGround.socket.register("executeTeleport", Teleporter.executeTeleport);
            game.foundryDumpingGround.socket.register("executeSummon", Summoner.executeSummon);
            game.foundryDumpingGround.socket.register("toggleVis", Teleporter.toggleVis);
            game.foundryDumpingGround.socket.register("executeHealWounds", Misc.executeHealWounds);
            game.foundryDumpingGround.socket.register("executeWarriorsGift", WarriorsGift.executeWarriorsGift);
        });

        Hooks.on("succReady", () => {
            if (game.foundryDumpingGround?.socket) {
                game.foundryDumpingGround.socket.register("executeAddCondition", SUCC.executeAddCondition);
            }
        });

        Hooks.on("deleteActiveEffect", (effect, options, userId) => {
            WarriorsGift.onDeleteActiveEffect(effect, options, userId);
        });

        Hooks.on("renderCharacterSheet", (app, html, data) => {
            BTeam.onRenderCharacterSheet(app, html, data);
        });
    }
}