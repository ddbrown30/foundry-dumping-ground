import { Utils } from "./utils.js";
import { registerSettings } from "./settings.js";
import { Teleporter } from "./teleporter.js";
import { SUCC } from "./succ.js";
import { Misc } from "./misc.js";
import { NAME } from "./module-config.js";

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
            //game.foundryDumpingGround.summon = Misc.summon;

            Utils.loadTemplates();
            registerSettings();
        });

        Hooks.once("socketlib.ready", () => {
            game.foundryDumpingGround = game.foundryDumpingGround ?? {};
        
            game.foundryDumpingGround.socket = socketlib.registerModule(NAME);
            game.foundryDumpingGround.socket.register("executeTeleport", Teleporter.executeTeleport);
            game.foundryDumpingGround.socket.register("toggleVis", Teleporter.toggleVis);
            game.foundryDumpingGround.socket.register("executeHealWounds", Misc.executeHealWounds);
        });
        
        Hooks.on("succReady", () => {
            if (game.foundryDumpingGround?.socket) {
                game.foundryDumpingGround.socket.register("executeAddCondition", SUCC.executeAddCondition);
            }
        });
    }
}