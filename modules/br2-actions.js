
export class BR2Actions {

    static addBR2Actions() {
        const BR2_ACTIONS = [
            {
                id: "Arcane Resistance Dmg",
                name: "Arcane Resistance Dmg",
                button_name: "Arcane Resistance",
                dmgMod: "-2",
                defaultChecked: "on",
                and_selector: [
                    { selector_type: "target_has_edge", selector_value: "Arcane Resistance" },
                    { selector_type: "item_has_damage", selector_value: "true" },
                    {
                        not_selector: [
                            { selector_type: "target_has_edge", selector_value: "Improved Arcane Resistance" }
                        ]
                    },
                    {
                        not_selector: [
                            { selector_type: "item_type", selector_value: "power" }
                        ]
                    }
                ],
                section: "attack",
                group: "BRSW.Target"
            },
            {
                id: "BLIND",
                name: "BRSW.EdgeName.Blind",
                button_name: "BRSW.EdgeName.Blind",
                skillMod: "-6",
                selector_type: "actor_has_hindrance",
                selector_value: "BRSW.EdgeName.Blind",
                defaultChecked: { selector_type: "skill", selector_value: "Notice" },
                section: "character",
                group: "BRSW.Hindrances",
                replaceExisting: true
            },
            {
                id: "CHARGE",
                name: "Charge",
                button_name: "Charge",
                dmgMod: "+2",
                skillMod: "+2",
                and_selector: [
                    { selector_type: "actor_has_edge", selector_value: "Charge" },
                    { selector_type: "skill", selector_value: "Fighting" }
                ],
                section: "character",
                group: "BRSW.Edges"
            },
            {
                id: "CloakOfDaggers",
                name: "Cloak of Daggers",
                button_name: "Cloak of Daggers",
                skillMod: "+2",
                and_selector: [
                    { selector_type: "actor_equips_item", selector_value: "Cloak of Daggers" },
                    { selector_type: "skill", selector_value: "BRSW.SkillName.Stealth" }
                ],
                section: "character",
                group: "Equipment"
            },
            {
                id: "Confaction",
                name: "Confaction",
                button_name: "Confaction",
                skillMod: "+1d6x",
                dmgMod: "+1d6x",
                selector_type: "all",
                section: "common",
                group: "BRSW.SituationalModifiers"
            },
            {
                id: "ConfactionDmg",
                name: "ConfactionDmg",
                button_name: "Confaction Dmg",
                dmgMod: "+1d6x",
                selector_type: "item_has_damage",
                selector_value: "true",
                section: "attack",
                group: "BRSW.SituationalModifiers"
            },
            {
                id: "Dirty Fighter",
                name: "Dirty Fighter",
                button_name: "Dirty Fighter",
                skillMod: "+2",
                and_selector: [
                    { selector_type: "actor_has_edge", selector_value: "Dirty Fighter" },
                    { selector_type: "skill", selector_value: "Fighting" }
                ],
                section: "character",
                group: "BRSW.Edges"
            },
            {
                id: "ExtraWildAttack",
                name: "Extra Wild Attack",
                button_name: "Extra Wild Attack (+4)",
                dmgMod: "+4",
                skillMod: "+4",
                isWildAttack: true,
                and_selector: [
                    { selector_type: "item_name", selector_value: "Stone and Bone" },
                    { selector_type: "skill", selector_value: "Fighting" }
                ],
                self_add_status: "extra-vulnerable",
                section: "attack",
                group: "BRSW.AttackOption"
            },
            {
                id: "HasExtraVuln",
                name: "Has Extra Vulnerable",
                button_name: "Has Extra Vulnerable",
                skillMod: "+2",
                selector_type: "target_has_effect",
                selector_value: "Extra Vulnerable",
                defaultChecked: "on",
                section: "attack",
                group: "BRSW.Target"
            },
            {
                id: "Improved Arcane Resistance Dmg",
                name: "Improved Arcane Resistance Dmg",
                button_name: "Improved Arcane Resistance",
                dmgMod: "-4",
                defaultChecked: "on",
                and_selector: [
                    { selector_type: "target_has_edge", selector_value: "Improved Arcane Resistance" },
                    { selector_type: "item_has_damage", selector_value: "true" },
                    {
                        not_selector: [
                            { selector_type: "item_type", selector_value: "power" }
                        ]
                    }
                ],
                section: "attack",
                group: "BRSW.Target"
            },
            {
                id: "POWERFULBLOW",
                name: "Powerful Blow",
                button_name: "Powerful Blow",
                dmgMod: "+2",
                and_selector: [
                    { selector_type: "actor_has_edge", selector_value: "Powerful Blow" },
                    { selector_type: "skill", selector_value: "Fighting" }
                ],
                section: "character",
                group: "BRSW.Edges"
            },
            {
                id: "Pounce",
                name: "Pounce",
                button_name: "Pounce",
                dmgMod: "+2",
                and_selector: [
                    { selector_type: "actor_has_ability", selector_value: "Pounce" },
                    { selector_type: "skill", selector_value: "Fighting" }
                ],
                section: "attack",
                group: "BRSW.AttackOption"
            },
            {
                id: "Savagery",
                name: "Savagery",
                button_name: "Savagery",
                dmgMod: "+2",
                and_selector: [
                    { selector_type: "actor_has_edge", selector_value: "Savagery" },
                    { selector_type: "skill", selector_value: "Fighting" }
                ],
                section: "attack",
                group: "BRSW.Edges"
            },
        ];

        game.brsw.add_actions(BR2_ACTIONS);
    }
}