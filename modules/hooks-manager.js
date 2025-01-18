import { Utils } from "./utils.js";
import { registerSettings } from "./settings.js";
import * as CONFIG from "./config.js";
import { Teleporter } from "./teleporter.js";

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

            Utils.loadTemplates();
            registerSettings();
        });

        Hooks.once("socketlib.ready", () => {
            game.foundryDumpingGround = game.foundryDumpingGround ?? {};
        
            game.foundryDumpingGround.socket = socketlib.registerModule(CONFIG.NAME);
            game.foundryDumpingGround.socket.register("executeTeleport", Teleporter.executeTeleport);
            game.foundryDumpingGround.socket.register("toggleVis", Teleporter.toggleVis);
        });
    }
}