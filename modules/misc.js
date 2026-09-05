import { ApplyInjuryDialog } from "./apply-injury-dialog.js";
import { MassRollDialog } from "./mass-roll-dialog.js";
import * as MODULE_CONFIG from "./module-config.js";
import { SpellstrikeDialog } from "./spellstrike-dialog.js";
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
        const content = await foundry.applications.handlebars.renderTemplate(MODULE_CONFIG.DEFAULT_CONFIG.templates.exportedItems, data);
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
                await game.brsw.createDamageCard(target.id, finalDamage);
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
            game.brsw.createInjuryEffect(target.actor, result.duration, result.baseInjury, result.secondaryInjury);
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

    static async spellstrike(sourceToken) {
        sourceToken ??= canvas?.tokens?.controlled[0];
        if (!sourceToken) {
            ui.notifications.warn("No source token selected.");
            return;
        }

        const weapons = sourceToken.actor.items.filter(el => el.type == "weapon");
        if (!weapons.length) {
            ui.notifications.warn('No weapons');
            return;
        }

        const powers = sourceToken.actor.items.filter(el => el.type == "power");
        if (!powers.length) {
            ui.notifications.warn('No powers');
            return;
        }

        const options = { weapons, powers };
        const result = await new SpellstrikeDialog(options).wait();
        if (!result) {
            return;
        }

        game.brsw.createItemCard(sourceToken.actor, result.weapon);
        game.brsw.createItemCard(sourceToken.actor, result.power);
    }

    static async massRoll(tokens, options) {
        if (!tokens.length) {
            ui.notifications.warn("No tokens selected.");
            return;
        }

        const result = await new MassRollDialog({ ...options, tokens }).wait();
        if (!result) {
            return;
        }

        const { trait, rollMod } = result;

        const isAttr = (trait === "agility" || trait === "smarts" || trait === "spirit" || trait === "strength" || trait === "vigor");
        const rollModString = rollMod > 0 ? ` + ${rollMod}` : ` - ${Math.abs(rollMod)}`;

        let chatOutput = `
            <section class="fdg">
                <h5 style="text-transform: capitalize;">${trait}${rollMod ? rollModString : ""}</h5>
                <hr>
                <ul class="mass-roll-results" style="list-style-type: none; padding: 0; margin: 0;">
        `;

        for (const token of tokens) {
            const actor = token.actor;
            let skill;
            let unskilled = false;
            if (!isAttr) {
                skill = actor.items.find(s => s.type == "skill" && s.name.toLowerCase() === trait.toLowerCase());
                if (!skill) {
                    unskilled = true;
                    skill = actor.items.find(s => s.type == "skill" && s.name.toLowerCase().includes("unskilled"));
                    if (!skill) {
                        ui.notifications.warn("Token does not have the skill nor an unskilled skill");
                        continue;
                    }
                }
            }

            let brCard;
            if (isAttr) {
                brCard = await game.brsw.createAttributeCard(token, trait, { options: { createChatMessage: false } });
                await game.brsw.rollAttribute(brCard, false);
            } else {
                brCard = await game.brsw.createSkillCard(token, skill.id, { options: { createChatMessage: false } });
                await game.brsw.rollSkill(brCard, false);
            }

            const dice = brCard.traitRoll.currentRoll.dice;
            const critFail = brCard.traitRoll.currentRoll.isCritFail;

            let highestDie = 0;
            if (dice[1] != null) {
                highestDie = dice[1].raw_total > dice[0].raw_total ? 1 : 0;
            }

            let modTooltip = unskilled ? "<b>Unskilled<b><br>" : "";
            for (const mod of brCard.traitRoll.modifiers) {
                modTooltip += `<b>${mod.name}:</b> ${mod.value}<br>`;
            }

            chatOutput += `<li data-token="${token.id}" data-tooltip="${modTooltip}"}}><span class="token-name">${token.name}</span>`;
            chatOutput += `<span class="mass-roll-result">`;
            chatOutput += `<span class="die ${critFail || highestDie !== 0 ? "discarded" : ""}" style="background-image: url(icons/svg/d${dice[0].sides}-grey.svg);">${dice[0].raw_total}</span>`;
            if (dice[1] != null) {
                chatOutput += `<span class="die ${critFail || highestDie !== 1 ? "discarded" : ""}" style="background-image: url(icons/svg/d${dice[1].sides}-grey.svg);">${dice[1].raw_total}</span>`;
            }

            if (rollMod) {
                chatOutput += rollModString;
            }

            const totalModifiers = brCard.traitRoll.total_modifiers;
            if (totalModifiers) {
                chatOutput += totalModifiers > 0 ? ` + ${totalModifiers}` : ` - ${Math.abs(totalModifiers)}`;
            }

            if (critFail) {
                chatOutput += ` = <span class="crit-fail">Crit Fail</span>`;
            } else {
                chatOutput += ` = ${dice[highestDie].final_total + rollMod }`;
            }

            chatOutput += "</span></li>";
        }

        chatOutput += "</ul></section>";

        const chatData = {
            user: game.user,
            content: chatOutput,
            flags: { [MODULE_CONFIG.NAME]: { type: "mass" } }
        };
        ChatMessage.create(chatData);
    }

    static onRenderActorSheet(app, html, data) {
        Misc.reshapeChargesSummaries(html.querySelector("section.inventory"), data.actor);
        Misc.reshapeChargesSummaries(html.querySelector('section[data-tab="edges"]'), data.actor);
        Misc.addQuickAccessCharges(html.querySelector('section[data-tab="summary"] .quickaccess'), data.actor);
    }

    // Quick Access cards don't render a charges-summary at all, so there's nothing to reshape -
    // render swade's own partial from the item's charge data, then run it through the same chip
    // builder used elsewhere. Its value input has no swade-attached change listener (that's only
    // wired up for inputs present at swade's own initial render), so bind it here ourselves.
    static async addQuickAccessCharges(quickAccess, actor) {
        if (!quickAccess) return;

        for (const li of quickAccess.querySelectorAll("li.item[data-item-id]")) {
            const item = actor.items.get(li.dataset.itemId);
            if (!item || item.type === "consumable" || !item.system.charges?.hasCharges) continue;

            const details = li.querySelector(":scope > details");
            if (!details) continue;

            const charges = item.system.charges.charges.map(charge => ({
                charge,
                rechargeType: CONFIG.SWADE.chargeRechargeTypes[charge.rechargeType],
            }));
            const content = await foundry.applications.handlebars.renderTemplate(
                "systems/swade/templates/actors/character/partials/charges-summary.hbs",
                { charges }
            );

            const wrapper = document.createElement("div");
            wrapper.innerHTML = content;
            const chargesSummary = wrapper.firstElementChild;
            if (!chargesSummary) continue;

            details.insertAdjacentElement("afterend", chargesSummary);
            Misc.buildChargeChips(chargesSummary, item);

            chargesSummary.querySelectorAll('.chip-fields input[name="value"]').forEach(input => {
                input.addEventListener("change", () => Misc.onChargeValueChange(input, actor));
            });
        }
    }

    static async onChargeValueChange(input, actor) {
        const item = actor.items.get(input.closest(".item")?.dataset.itemId);
        const charge = item?.system.charges.find(input.dataset.chargeId);
        if (!charge) return;

        charge.value = Number(input.value);
        await item.update({ "system.charges.charges": item.system.charges.charges });
    }

    static reshapeChargesSummaries(container, actor) {
        if (!container) return;

        for (const details of container.querySelectorAll("li.item > details")) {
            const chargesSummary = details.querySelector(":scope > .charges-summary");
            if (!chargesSummary) continue;

            const isConsumable = details.querySelector(":scope > summary")?.classList.contains("consumable");
            if (!isConsumable) details.insertAdjacentElement("afterend", chargesSummary);

            const itemId = details.closest("li.item")?.dataset.itemId;
            Misc.buildChargeChips(chargesSummary, actor.items.get(itemId));
        }
    }

    static RECHARGE_ICONS = {
        manual: "fa-hand",
        encounter: "fa-swords",
        day: "fa-sun",
    };

    static buildChargeChips(chargesSummary, item) {
        const chargeList = chargesSummary.querySelector(":scope > ul.charge-list");
        if (!chargeList) return;

        chargesSummary.classList.add("charge-panel");

        const chipRow = document.createElement("div");
        chipRow.className = "chip-row";

        for (const row of chargeList.querySelectorAll(":scope > li.charge-row")) {
            const valueInput = row.querySelector('input[name="value"]');
            if (!valueInput) continue; // the first row is the column header, which has no inputs

            const maxInput = row.querySelector('input[name="max"]');
            const rechargeButton = row.querySelector('[data-action="rechargeManual"]');
            const [nameSpan, rechargeSpan] = row.querySelectorAll(":scope > span");

            const chargeId = valueInput.dataset.chargeId;
            const rechargeType = item?.system.charges.charges.find(c => c.id === chargeId)?.rechargeType;
            const iconClass = Misc.RECHARGE_ICONS[rechargeType];

            let icon = null;
            if (iconClass) {
                icon = document.createElement("i");
                icon.className = `fas ${iconClass} chip-icon`;
                icon.dataset.tooltip = rechargeSpan?.textContent.trim() ?? "";
            }

            const name = document.createElement("span");
            name.className = "chip-name";
            name.textContent = nameSpan?.textContent.trim() ?? "";

            const sep = document.createElement("span");
            sep.className = "chip-sep";
            sep.textContent = "/";

            const fields = document.createElement("span");
            fields.className = "chip-fields";
            fields.append(valueInput, sep);
            if (maxInput) {
                maxInput.readOnly = true;
                maxInput.tabIndex = -1;
                maxInput.addEventListener("mousedown", (event) => event.preventDefault());
                fields.append(maxInput);
            }

            const chip = document.createElement("span");
            chip.className = "chip";
            if (icon) chip.append(icon);
            chip.append(name, fields);
            if (rechargeButton) chip.append(rechargeButton);

            chipRow.append(chip);
        }

        chargeList.replaceWith(chipRow);
    }

    static async onRenderMassRollMessage(message, html) {
        html.querySelectorAll(".fdg .mass-roll-result").forEach((e) => {
            const li = e.closest("li");

            if (game.user.isGM) {
                li.addEventListener("click", async (ev) => {
                    const token = game.canvas.tokens.get(ev.currentTarget.dataset.token);
                    if (token) {
                        canvas.ping(token.center);
                        token.control({ releaseOthers: true });
                    }
                });
            }

            li.addEventListener("mouseover", async (ev) => {
                const token = game.canvas.tokens.get(ev.currentTarget.dataset.token);
                if (token) {
                    token._onHoverIn(ev);
                }
            });

            li.addEventListener("mouseout", async (ev) => {
                const token = game.canvas.tokens.get(ev.currentTarget.dataset.token);
                if (token) {
                    token._onHoverOut(ev);
                }
            });
        });
    }
}
