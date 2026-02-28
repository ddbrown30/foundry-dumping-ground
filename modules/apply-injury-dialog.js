import { DEFAULT_CONFIG, SETTING_KEYS } from "./module-config.js";
import { Utils } from "./utils.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Dialog for applying an injury without needing to roll on the injury table
 */
export class ApplyInjuryDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "apply-injury-dialog",
        tag: "form",
        classes: ["fdg"],
        window: { title: "Apply Injury", contentClasses: ["fdg-dialog"] },
        position: { width: "300", height: "auto" },
        actions: {
            apply: function (event, button) {
                this.submit({
                    duration: this.selectedDuration,
                    baseInjury: this.selectedBase,
                    secondaryInjury: this.selectedSecondary == "None" ? "" : this.selectedSecondary,
                });
            },
            cancel: function (event, button) { this.submit(false); }
        },
    };

    static PARTS = {
        form: {
            template: DEFAULT_CONFIG.templates.applyInjuryDialog,
        }
    };

    constructor(options = {}) {
        super(options);
    }

    async _prepareContext(options) {
        const baseOptions = [{ id: "None", label: "" }, ...Object.values(game.brsw.CONST.INJURY_BASE).map(v => ({ id: v, label: v }))];

        this.selectedDuration ??= "permanent";
        this.selectedBase ??= "None";
        this.selectedSecondary ??= "None";

        let hasSecondary = false;
        let secondaryOptions = [];
        if (this.selectedBase && game.brsw.CONST.SECOND_INJURY_TABLES[this.selectedBase]) {
            secondaryOptions = [{ id: "None", label: "" }, ...Object.values(game.brsw.CONST.SECOND_INJURY_TABLES[this.selectedBase]).map(v => ({ id: v, label: v }))];
            hasSecondary = true;
        }

        let durations = {
            permanent: "Permanent",
            "temporal-wounds": "Temporary",
            temporary24: "Temporary (24h)",
        };

        const canApply = (this.selectedBase !== "None") &&
                            (this.selectedSecondary !== "None" || !game.brsw.CONST.SECOND_INJURY_TABLES[this.selectedBase]);

        return {
            baseOptions,
            secondaryOptions,
            hasSecondary,
            durations,
            selectedDuration: this.selectedDuration,
            selectedBase: this.selectedBase,
            selectedSecondary: this.selectedSecondary,
            canApply,
        };
    };

    _onRender(context, options) {
        this.element.querySelector('select[id="base-injury"]').addEventListener("change", async event => {
            this.selectedBase = event.target.selectedOptions[0].value;
            this.selectedSecondary = "None";
            this.render();
        });

        this.element.querySelector('select[id="secondary-injury"]')?.addEventListener("change", async event => {
            this.selectedSecondary = event.target.selectedOptions[0].value;
            this.render();
        });

        this.element.querySelectorAll('input[name="duration"]')
            .forEach(radio => {
                radio.addEventListener("change", (event) => {
                    if (event.target.checked) {
                        this.selectedDuration = event.target.value;
                    }
                });
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