import { ApplyInjuryDialog } from "./apply-injury-dialog.js";
import { DEFAULT_CONFIG, PATH } from "./module-config.js";
import { Utils } from "./utils.js";

export class Misc {

    static async healWounds(targets) {
        const wounds = await foundry.applications.api.DialogV2.wait({
            window: { title: "Healing Result" },
            content: "<label><p>Wounds to remove (put -1 if a critical failure increases the target's wounds level by one)</p><input type='number' id='wounds' value='1'/></label>",
            buttons: [
                {
                    icon: 'fa-solid fa-kit-medical',
                    label: "Heal",
                    action: "default",
                    callback: (event, button, dialog) => { return Number(dialog.element.querySelector('#wounds').value); },
                },
            ]
        });

        if (!wounds) {
            return;
        }

        let targetIds = targets.map(t => t.actor.uuid);
        game.foundryDumpingGround.socket.executeAsGM("executeHealWounds", targetIds, wounds);
    }

    static async executeHealWounds(targetIds, wounds) {
        let targets = targetIds.map(t => fromUuidSync(t));
        for (let target of targets) {
            const currentWounds = target.system.wounds.value;
            const newWounds = Math.max(currentWounds - wounds, 0);
            if (newWounds <= target.system.wounds.max) {
                await target.update({ "system.wounds.value": newWounds });
                game.succ.removeCondition("incapacitated", target);
                game.succ.removeCondition("dead", target);
                game.succ.removeCondition("bleeding-out", target);
            } else {
                target.update({ "system.wounds.value": target.system.wounds.max });
                game.succ.addCondition("incapacitated", target);
            }
        }
    }

    static async exportItems(items) {
        const data = { items: [] };
        for (let itemId of items) {
            const item = fromUuidSync(itemId);
            const itemData = {};
            itemData.name = item.name;
            itemData.type = item.type;
            itemData.range = item.system.range;
            itemData.damage = item.system.damage;
            itemData.ap = item.system.ap;
            itemData.parry = item.system.parry;
            itemData.cover = item.system.cover;
            itemData.armor = item.system.armor;
            itemData.toughness = item.system.toughness;
            itemData.minStr = item.system.minStr;
            itemData.desc = item.system.description;

            data.items.push(itemData);
        }
        const content = await foundry.applications.handlebars.renderTemplate(DEFAULT_CONFIG.templates.exportedItems, data);
        saveDataToFile(content, "text/html", "item-export.html");
    }

    static async dealDamage(targets) {
        if (!targets.length) {
            ui.notifications.warn("No targets selected.");
            return;
        }

        const damageInfo = await foundry.applications.api.DialogV2.wait({
            window: { title: "Deal Damage" },
            content: `
                    <div class="form-group">
                        Damage: <input type='text' id='damage'/>
                    </div>
                    <div class="form-group">
                        AP: <input type='number' id='ap'/>
                    </div>
                    <div class="form-group">
                        Roll Each Target: <input type="checkbox" id="separate-damage">
                    </div>`,
            buttons: [
                {
                    icon: 'fa-solid fa-axe-battle',
                    label: "Apply",
                    action: "default",
                    callback: (event, button, dialog) => {
                        return {
                            separateDamage: dialog.element.querySelector('#separate-damage').checked,
                            damage: dialog.element.querySelector('#damage').value,
                            ap: dialog.element.querySelector('#ap').value,
                        };
                    },
                },
            ]
        });

        if (!damageInfo) {
            return;
        }

        if (!damageInfo.damage) {
            ui.notifications.warn("No damage entered.");
            return;
        }

        damageInfo.damage = damageInfo.damage.replace(/\b\d*d\d+(?!x)\b/g, m => m + "x");

        let damage = 0;
        async function rollDamage() {
            const roll = new Roll(damageInfo.damage);
            await roll.evaluate();
            damage = roll.total;
            if (game.dice3d) {
                await game.dice3d.showForRoll(roll);
            }
        }

        if (!damageInfo.separateDamage) {
            await rollDamage();
        }

        const apString = damageInfo.ap > 0 ? `<br>AP ${damageInfo.ap}` : "";
        let chatOutput = `<p>Results:${apString}</p><ul style="list-style-type: none; padding: 0; margin: 0;">`;
        for (let target of targets) {
            if (damageInfo.separateDamage) {
                await rollDamage();
            }

            let finalDamage = damage - target.actor.system.stats.toughness.value;
            if (damageInfo.ap > 0) {
                finalDamage += Math.min(damageInfo.ap, target.actor.system.stats.toughness.armor);
            }

            let resultString = "";
            if (finalDamage < 0) {
                //No result
                resultString = '<i class="brsw-red-text fas fa-minus-circle"></i>';
            } else if (finalDamage < 4) {
                //Shaken
                resultString = '<i class="brsw-blue-text fas fa-certificate"></i>';
            } else if (finalDamage < 8) {
                //1 Wound
                resultString = '<i class="brsw-red-text fas fa-tint"></i>';
            } else {
                //Multiple Wounds
                const wounds = Math.floor(finalDamage / 4);
                resultString = wounds + " " + '<i class="brsw-red-text fas fa-tint"></i>';
            }

            chatOutput += `<li>${target.name}: <span class="brsw-damage-roll brsw-blue-text">${damage}</span>${resultString}</li>`;

            if (finalDamage >= 0) {
                await game.brsw.create_damage_card(target.id, finalDamage);
            }
        }
        chatOutput += "</ul>";

        let chatData = {
            user: game.user,
            content: chatOutput,
        };
        ChatMessage.create(chatData);
    }

    static async applyInjury(targets) {
        if (!targets.length) {
            ui.notifications.warn("No targets selected.");
            return;
        }

        let result = await new ApplyInjuryDialog().wait();
        if (!result) {
            return;
        }

        for (let target of targets) {
            game.brsw.create_injury_effect(target.actor, result.duration, result.baseInjury, result.secondaryInjury);
        }
    }

    static async energyDrain(targets) {
        const attributes = Object.entries(CONFIG.SWADE.attributes).map(([att, val]) => ({
            value: att,
            label: val.long
        }));
        attributes.sort((a, b) => a.label.localeCompare(b.label));

        const selectGroup = new foundry.data.fields.StringField({
            label: "Attribute",
            required: true
        }).toFormGroup({}, { options: attributes, name: "attributeId" }).outerHTML;

        const attribute = await foundry.applications.api.DialogV2.input({
            window: { title: "Energy Drain" },
            content: selectGroup,
            ok: {
                icon: "fa-solid fa-bolt",
                label: "Apply"
            }
        });

        if (!attribute) {
            return;
        }

        let targetIds = targets.map(t => t.actor.uuid);
        game.foundryDumpingGround.socket.executeAsGM("executeEnergyDrain", targetIds, attribute.attributeId);
    }

    static async executeEnergyDrain(targetIds, attributeId) {
        const effectName = "Energy Drain: " + CONFIG.SWADE.attributes[attributeId].long;
        const key = `system.attributes.${attributeId}.die.sides`;
        const img = "icons/magic/control/debuff-energy-hold-teal-blue.webp";

        let targets = targetIds.map(t => fromUuidSync(t));
        for (let target of targets) {
            const currentVal = parseInt(foundry.utils.getProperty(target, key));
            let drainEffect = target.effects.find(e => e.name == effectName);

            if (currentVal <= 4) {
                game.succ.addCondition("incapacitated", target);

                if (!drainEffect) {
                    drainEffect = {
                        name: effectName,
                        img: img,
                        duration: { rounds: 999 },
                    };

                    //If we're draining vigor, the target has to roll or die at the end of their next turn
                    if (attributeId === "vigor") {
                        drainEffect.system = { expiration: 3 };
                        drainEffect.duration = { rounds: 1 };
                    }

                    await target.createEmbeddedDocuments("ActiveEffect", [drainEffect]);
                } else if (attributeId === "vigor") {
                    //If we're draining vigor, the target has to roll or die at the end of their next turn
                    let updates = drainEffect.toObject();
                    updates.system.expiration = 3;
                    updates.duration.rounds = 1;
                    await drainEffect.update(updates);
                }

                continue;
            }

            if (drainEffect) {
                let updates = drainEffect.toObject().changes;
                updates[0].value = parseInt(updates[0].value) - 2;
                await drainEffect.update({ "changes": updates });
            } else {
                drainEffect = {
                    name: effectName,
                    img: img,
                    changes: [{
                        key: key,
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: -2
                    }],
                    duration: { rounds: 999 },
                };
                await target.createEmbeddedDocuments("ActiveEffect", [drainEffect]);
            }
        }
    }

    static async healEnergyDrain(targets) {
        const attributes = Object.entries(CONFIG.SWADE.attributes).map(([att, val]) => ({
            value: att,
            label: val.long
        }));
        attributes.sort((a, b) => a.label.localeCompare(b.label));

        const selectGroup = new foundry.data.fields.StringField({
            label: "Attribute",
            required: true
        }).toFormGroup({}, { options: attributes, name: "attributeId" }).outerHTML;

        const result = await foundry.applications.api.DialogV2.wait({
            window: { title: "Heal Drain" },
            content: selectGroup,
            buttons: [
                {
                    label: "Success",
                    icon: "fa-solid fa-check",
                    action: "success",
                    callback: (event, button, dialog) => { return { action: "success", attributeId: dialog.element.querySelector('select[name="attributeId"]').value }; },
                },
                {
                    label: "Raise",
                    icon: "fa-solid fa-check-double",
                    action: "raise",
                    callback: (event, button, dialog) => { return { action: "raise", attributeId: dialog.element.querySelector('select[name="attributeId"]').value }; },
                },
            ],
        });

        if (!result) {
            return;
        }

        let targetIds = targets.map(t => t.actor.uuid);
        game.foundryDumpingGround.socket.executeAsGM("executeHealEnergyDrain", targetIds, result.attributeId, result.action);
    }

    static async executeHealEnergyDrain(targetIds, attributeId, action) {
        const effectName = "Energy Drain: " + CONFIG.SWADE.attributes[attributeId].long;

        let targets = targetIds.map(t => fromUuidSync(t));
        for (let target of targets) {
            const drainEffect = target.effects.find(e => e.name == effectName);
            if (!drainEffect) {
                continue;
            }

            let updates = drainEffect.toObject().changes;
            const oldVal = parseInt(updates[0].value);
            const delta = action === "success" ? 2 : 4;
            if (Math.abs(oldVal) <= delta) {
                await target.deleteEmbeddedDocuments('ActiveEffect', [drainEffect.id]);
            } else {
                updates[0].value = oldVal + delta;
                await drainEffect.update({ "changes": updates });
            }
        }
    }
}
