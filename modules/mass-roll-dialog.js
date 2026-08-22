import { DEFAULT_CONFIG, SETTING_KEYS } from "./module-config.js";
import { Utils } from "./utils.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Dialog for configuring a mass roll
 */
export class MassRollDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "mass-roll-dialog",
        window: { title: "Mass Roll", contentClasses: ["fdg-dialog"] },
        position: { width: 400 },
        actions: {
            roll: function (event, button) {
                const trait = this.element.querySelector("#selected-trait").value;
                const rollMod = this.element.querySelector("#roll-mod").value;
                this.submit({ trait, rollMod: Number(rollMod) });
            },
            cancel: function (event, button) { this.submit(false); }
        },
    };

    static PARTS = {
        form: {
            template: DEFAULT_CONFIG.templates.massRollDialog,
        }
    };

    static compareSkillCompendiums(a, b) {
        if (a == b) { return 0; }

        //Skills with no compendium are always the highest since it must be a custom skill
        if (!a) { return -1; }
        if (!b) { return 1; }

        //If we don't have a specific sort preference, just compare the ids directly
        return a < b ? -1 : 1;
    }

    sortSkills(skills) {
        skills.sort(function (a, b) {
            let textA = a.name.toUpperCase();
            let textB = b.name.toUpperCase();
            if (textA != textB) {
                return textA < textB ? -1 : 1;
            }
            let compendiumA = a.compendium?.metadata?.id;
            let compendiumB = b.compendium?.metadata?.id;
            return MassRollDialog.compareSkillCompendiums(compendiumA, compendiumB);
        });
        return skills;
    }

    async _prepareContext(_options) {
        let traitOptions = [];

        if (!this.options.showSkills) {
            traitOptions = [
                { value: "agility", label: game.i18n.localize("SWADE.AttrAgi") },
                { value: "smarts", label: game.i18n.localize("SWADE.AttrSma") },
                { value: "spirit", label: game.i18n.localize("SWADE.AttrSpr") },
                { value: "strength", label: game.i18n.localize("SWADE.AttrStr") },
                { value: "vigor", label: game.i18n.localize("SWADE.AttrVig") },
            ];
        } else {
            let skills = [];
            const coreSkillsPack = game.settings.get('swade', 'coreSkillsCompendium');
            skills = skills.concat(await game.packs.get(coreSkillsPack).getDocuments({ type: "skill" }));

            //Grab all custom skills
            skills = skills.concat(game.items.filter(i => i.type === "skill"));

            if (skills.length >= 1) {
                skills = this.sortSkills(skills);

                //Remove duplicate skills
                skills = skills.filter(function (skill, idx, array) {
                    return idx == 0 || skill.name != array[idx - 1].name;
                });
            }

            for (const skill of skills) {
                traitOptions.push({ value: skill.name, label: skill.name });
            }
        }

        return {
            traitOptions,
        };
    };

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