import { DEFAULT_CONFIG, SETTING_KEYS } from "./module-config.js";
import { Utils } from "./utils.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Dialog for selecting trait increases before summoning
 */
export class SummonDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "summon-dialog",
        tag: "form",
        classes: ["fdg"],
        window: { title: "Summon", contentClasses: ["fdg-dialog"] },
        position: { width: "auto", height: "auto" },
        actions: {
            continue: function (event, button) {
                const selectedAttributes = [];
                const attributes = this.element.querySelectorAll(".attribute input");
                for (const attribute of attributes) {
                    if (attribute.checked) {
                        selectedAttributes.push(attribute.value);
                    }
                }

                const selectedSkills = [];
                const skills = this.element.querySelectorAll(".skill input");
                for (const skill of skills) {
                    if (skill.checked) {
                        selectedSkills.push(skill.value);
                    }
                }
                this.submit({ attributes: selectedAttributes, skills: selectedSkills });
            },
            cancel: function (event, button) { this.submit(false); }
        },
    };

    static PARTS = {
        form: {
            template: DEFAULT_CONFIG.templates.summonDialog,
        }
    };

    constructor(options = {}) {
        super(options);
    }

    async _prepareContext(options) {
        let attributes = ["Agility", "Smarts", "Spirit", "Strength", "Vigor"];
        let skills = await this.getSkillOptions();

        return {
            attributes: attributes,
            skills: skills,
        };
    };

    async getSkillOptions() {
        let skills = [];

        const coreSkillsPack = game.settings.get('swade', 'coreSkillsCompendium');
        const usePF = coreSkillsPack.search("swpf") > -1;

        //First, grab all skills from all matching compendiums
        for (const pack of game.packs) {
            const isPF = pack.metadata.id.search("swpf") > -1;
            if (isPF != usePF) {
                continue;
            }
            skills = skills.concat(await pack.getDocuments({ type: "skill" }));
        }

        //Next, grab all custom skills
        skills = skills.concat(game.items.filter(i => i.type === "skill"));

        if (skills.length >= 1) {
            skills.sort(function (a, b) {
                let textA = a.name.toUpperCase();
                let textB = b.name.toUpperCase();
                if (textA != textB) {
                    return textA < textB ? -1 : 1;
                }
                let compendiumA = a.compendium?.metadata?.id;
                let compendiumB = b.compendium?.metadata?.id;
                return SummonDialog.compareSkillCompendiums(compendiumA, compendiumB, coreSkillsPack);
            });

            //Remove duplicate skills
            skills = skills.filter(function (skill, idx, array) {
                return idx == 0 || skill.name != array[idx - 1].name;
            })
        }

        return skills;
    }

    static compareSkillCompendiums(a, b, coreSkillsPack) {
        if (a == b) { return 0; }

        //Skills with no compendium are always the highest since it must be a custom skill
        if (!a) { return -1; }
        if (!b) { return 1; }

        //Skills the user's chosen coreSkillsPack are the next highest
        if (a == coreSkillsPack) { return -1; }
        if (b == coreSkillsPack) { return 1; }

        //Basic system skills are always the lowest
        if (a == "swade.skills") { return 1; }
        if (b == "swade.skills") { return -1; }

        //Skills from the core rules module come next
        if (a == "swade-core-rules.swade-skills") { return 1; }
        if (b == "swade-core-rules.swade-skills") { return -1; }

        //If we don't have a specific sort preference, just compare the ids directly
        return a < b ? -1 : 1;
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