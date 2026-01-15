import { FLAGS } from "./module-config.js";
import { Utils } from "./utils.js";
import { WarriorsGiftDialog } from "./warriors-gift-dialog.js";

export class BTeam {

    static onRenderCharacterSheet(app, html, data) {
        if (!data.actor.name.includes("B-Team")) return;

        html[0].querySelector(".gridcell.tabs").remove();
        html[0].querySelectorAll(`[data-tab="summary"]`).forEach(e => e.remove());
        html[0].querySelectorAll(`[data-tab="edges"]`).forEach(e => e.remove());
        html[0].querySelectorAll(`[data-tab="effects"]`).forEach(e => e.remove());
        html[0].querySelectorAll(`[data-tab="actions"]`).forEach(e => e.remove());
        html[0].querySelectorAll(`[data-tab="about"]`).forEach(e => e.remove());

        html[0].querySelectorAll(`[data-tab="inventory"]`).forEach(e => e.classList.add("active"));

        const gearTab = html[0].querySelector(".gridcell.sheet-body .tab");

        gearTab.querySelector(".encumbrance").parentElement.remove();

        const inventory = gearTab.querySelector(".inventory");
        const weaponHeader = inventory.querySelector(`.header.weapon`);
        const weaponList = weaponHeader.nextElementSibling;
        weaponHeader.remove();

        BTeam.removeInventorySection(inventory, "armor");
        BTeam.removeInventorySection(inventory, "shield");
        BTeam.removeInventorySection(inventory, "consumable");
        BTeam.removeInventorySection(inventory, "misc");

        [...weaponList.children]
            .sort((a, b) => a.querySelector(".item-name").innerText.toLowerCase() > b.querySelector(".item-name").innerText.toLowerCase() ? 1 : -1)
            .forEach(node => weaponList.appendChild(node));

        [...weaponList.children].forEach((node) => {
            const itemName = node.querySelector(".item-name");
            itemName.textContent = itemName.textContent.replace("(x1)", "");
            node.querySelector("span.damage").remove();
            node.querySelector("span.ap").remove();
            node.querySelector("span.note").remove();
            node.querySelector("span.weight").remove();
            node.querySelector("button.item-toggle").remove();
        });

        [...weaponList.children].forEach((node) => {
            if (node.querySelector(".fa-archive")) return;
            node.style.color = "beige";
            node.style.backgroundColor = "darkolivegreen";
            node.querySelectorAll("i").forEach(e => e.style.color = "beige");
            node.querySelector(".content.description").style.color = "beige";
            const desc = node.querySelector(".content.description");
            const cl = desc.querySelectorAll(".content-link");
            cl.forEach(e => e.style.color = "skyblue");
        });
    }

    static removeInventorySection(inventory, sectionClass) {
        const section = inventory.querySelector(`.header.${sectionClass}`);
        if (section.nextElementSibling.tagName == "UL") {
            section.nextElementSibling.remove();
        }
        section.remove();
    }
}