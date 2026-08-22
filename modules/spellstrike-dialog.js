import { DEFAULT_CONFIG, SETTING_KEYS } from "./module-config.js";
import { Utils } from "./utils.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Dialog for selected the weapon and power to use for a spellstrike
 */
export class SpellstrikeDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "spellstrike-dialog",
        tag: "form",
        classes: ["fdg"],
        window: { title: "Spellstrike", contentClasses: ["fdg-dialog"] },
        position: { width: "400", height: "auto" },
        actions: {
            confirm: function (event, button) {
                this.submit({
                    weapon: this.selectedWeapon,
                    power: this.selectedPower,
                });
            },
            cancel: function (event, button) { this.submit(false); }
        },
    };

    static PARTS = {
        form: {
            template: DEFAULT_CONFIG.templates.spellstrikeDialog,
        }
    };

    constructor(options = {}) {
        super(options);
    }

    async _prepareContext(options) {
        const weaponOptions = [{ id: "None", label: "" }, ...this.options.weapons.map(w => ({ id: w.id, label: w.name }))];
        const powerOptions = [{ id: "None", label: "" }, ...this.options.powers.map(p => ({ id: p.id, label: p.name }))];

        this.selectedWeapon ??= "None";
        this.selectedPower ??= "None";

        const canConfirm = this.selectedWeapon !== "None" && this.selectedPower !== "None";

        return {
            weaponOptions,
            powerOptions,
            selectedWeapon: this.selectedWeapon,
            selectedPower: this.selectedPower,
            canConfirm,
        };
    };

    _onRender(context, options) {
        this.element.querySelector('select[id="weapon"]').addEventListener("change", async event => {
            this.selectedWeapon = event.target.selectedOptions[0].value;
            this.render();
        });

        this.element.querySelector('select[id="power"]')?.addEventListener("change", async event => {
            this.selectedPower = event.target.selectedOptions[0].value;
            this.render();
        });
    }

    submit() {
        this.close();
    }

    /**
     * Renders the dialog and awaits until the dialog is submitted or closed
     */
    async wait() {
        return new Promise((resolve, reject) => {
            // Wrap submission handler with Promise resolution.
            this.submit = async result => {
                resolve(result);
                this.close();
            };

            this.addEventListener("close", event => {
                resolve(false);
            }, { once: true });

            this.render({ force: true });
        });
    }
}