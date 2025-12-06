import { DEFAULT_CONFIG, SETTING_KEYS } from "./module-config.js";
import { Utils } from "./utils.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Dialog for granting edges from warrior's gift and martial flexibility
 */
export class WarriorsGiftDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "warriors-gift-dialog",
        tag: "form",
        classes: ["fdg"],
        window: { title: "Warrior's Gift", contentClasses: ["fdg-dialog"] },
        position: { width: "auto", height: "auto" },
        actions: {
            grant: function (event, button) {
                const selectedEdges = [];
                const checkboxes = this.element.querySelectorAll(".edge input");
                for (const checkbox of checkboxes) {
                    if (checkbox.checked) {
                        selectedEdges.push(checkbox.value);
                    }
                }
                this.submit({ edges: selectedEdges });
            },
            toggleFavourite: function (event, button) {
                event.stopPropagation();
                event.preventDefault();
                const uuid = button.closest("div").dataset.uuid;
                const index = this.favourites.indexOf(uuid);
                if (index != -1) {
                    this.favourites.splice(index, 1); // 2nd parameter means remove one item only
                    button.firstElementChild.classList.remove("fas");
                    button.firstElementChild.classList.add("far");
                } else {
                    this.favourites.push(uuid);
                    button.firstElementChild.classList.remove("far");
                    button.firstElementChild.classList.add("fas");
                }
                Utils.setSetting(SETTING_KEYS.warriorFavourites, this.favourites);
            },
            cancel: function (event, button) { this.submit(false); }
        },
    };

    static PARTS = {
        form: {
            template: DEFAULT_CONFIG.templates.warriorsGiftDialog,
        }
    };

    constructor(options = {}) {
        super(options);
        this.options.window.title = options.type == "wg" ? "Warrior's Gift" : "Martial Flexibility";
        this.type = options.type;
        this.rankFilter = options.rankFilter ?? -1;
        this.favourites = Utils.getSetting(SETTING_KEYS.warriorFavourites);
    }

    getEdgeRank(edge) {
        for (const req of edge.system.requirements) {
            if (req.type == "rank") {
                return { value: req.value, name: CONFIG.SWADE.ranks[req.value] };
            }
        }
        return { value: 0, name: "Novice" };
    }

    static compareEdgePacks(a, b, pref) {
        if (a == b) { return 0; }

        //Edges with no pack are always the highest since they must be a custom edge
        if (!a) { return -1; }
        if (!b) { return 1; }

        //Edges from the user's chosen pack are the next highest
        if (a == pref) { return -1; }
        if (b == pref) { return 1; }

        if (pref == "swade-core-rules.swade-edges") {
            //If our pref is the core then that also means we want to prefer the fc rules
            if (a == "swade-fantasy-companion.swade-fc-edges") { return -1; }
            if (b == "swade-fantasy-companion.swade-fc-edges") { return 1; }
        }

        if (pref == "swpf-core-rules.swpf-edges") {
            //If our pref is pf then that also means we want to prefer the apg rules
            if (a == "swpf-apg.swpf-apg-edges") { return -1; }
            if (b == "swpf-apg.swpf-apg-edges") { return 1; }
        }

        //Edges from the swpf come next
        if (a == "swpf-core-rules.swpf-edges") { return -1; }
        if (b == "swpf-core-rules.swpf-edges") { return 1; }

        //Edges from the fc come next
        if (a == "swade-fantasy-companion.swade-fc-edges") { return -1; }
        if (b == "swade-fantasy-companion.swade-fc-edges") { return 1; }

        //Edges from the core rules module come next
        if (a == "swade-core-rules.swade-edges") { return -1; }
        if (b == "swade-core-rules.swade-edges") { return 1; }

        //If we don't have a specific sort preference, just compare the ids directly
        return a < b ? -1 : 1;
    }

    async _prepareContext(options) {
        let edges = [];
        for (const pack of game.packs) {
            if (pack.metadata.type !== "Item" || pack.metadata.packageName === "swade") {
                continue;
            }
            const index = await pack.getIndex({ fields: ["system.category", "system.requirements", "system.description"] });
            for (const item of index) {
                if (item.type != "edge" || !item.system?.category?.toLowerCase().includes("combat")) {
                    continue;
                }

                const rank = this.getEdgeRank(item);
                if (this.rankFilter < 0 || rank.value <= this.rankFilter) {
                    edges.push({
                        name: item.name,
                        label: `${item.name}, ${rank.name} (${pack.metadata.packageName})`,
                        uuid: item.uuid,
                        favourite: !!this.favourites.find((f) => f == item.uuid),
                        tooltip: this.cleanDescription(item.system.description),
                        pack: pack,
                    });
                }
            }
        }

        for (const item of game.items) {
            if (item.type != "edge" || item.system?.category?.toLowerCase() != "combat") {
                continue;
            }

            const rank = this.getEdgeRank(item);
            if (this.rankFilter < 0 || rank.value <= this.rankFilter) {
                edges.push({
                    name: item.name,
                    label: `${item.name}, ${rank.name} (World)`,
                    uuid: item.uuid,
                    favourite: !!this.favourites.find((f) => f == item.uuid),
                    tooltip: this.cleanDescription(item.system.description),
                });
            }
        }

        if (!edges.length) {
            ui.notifications.warn("No Combat Edges found in available compendiums.");
            this.close();
            return;
        }

        const warriorPackPref = Utils.getSetting(SETTING_KEYS.warriorPack);

        edges.sort(function (a, b) {
            let textA = a.name.toUpperCase();
            let textB = b.name.toUpperCase();
            if (textA != textB) {
                return textA < textB ? -1 : 1;
            }
            let packA = a.pack?.metadata?.id;
            let packB = b.pack?.metadata?.id;
            return WarriorsGiftDialog.compareEdgePacks(packA, packB, warriorPackPref);
        });

        //Remove duplicate edges
        edges = edges.filter(function (edge, idx, array) {
            return idx == 0 || edge.name != array[idx - 1].name;
        })

        edges.sort((a, b) => {
            if (a.favourite != b.favourite) {
                return a.favourite ? -1 : 1;
            }
            return a.label.localeCompare(b.label);
        });

        let mfImage = "assets/icons/martial-flexibility.webp";
        let wgImage = "modules/succ/assets/icons/m-warriors-gift.svg";
        if (game.succ) {
            const wgCond = game.succ.getCondition("warriors-gift");
            wgImage = wgCond?.img;
        }

        const img = this.type == "wg" ? wgImage : mfImage;

        let ranks = [];
        ranks.push({ id: -1, label: "All" });
        for (let [rank, value] of Object.entries(CONFIG.SWADE.ranks)) {
            ranks.push({ id: Number(rank), label: value });
        }

        return {
            title: this.options.window.title,
            img: img,
            type: this.type,
            edges: edges,
            ranks: ranks,
            rankFilter: this.rankFilter,
        };
    };

    _onRender(context, options) {
        const selector = this.element.querySelector('select[id="rank-filter"]');
        if (selector) {
            selector.addEventListener("change", async event => {
                const selection = $(event.target).find("option:selected");
                this.rankFilter = selection.val();
                this.render();
            });
        }
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

    cleanDescription(description) {
        let outDesc = description;

        let searchIdx = outDesc.search("<h3>");
        while (searchIdx >= 0) {
            const h3Close = outDesc.search("</h3>", searchIdx);
            outDesc = outDesc.slice(0, searchIdx) + outDesc.slice(h3Close + 6);
            searchIdx = outDesc.search("<h3>");
        }

        searchIdx = outDesc.search("@UUID");
        while (searchIdx >= 0) {
            const openBrace = outDesc.indexOf("{", searchIdx);
            const closeBrace = outDesc.indexOf("}", openBrace);
            outDesc = outDesc.slice(0, searchIdx) + outDesc.slice(openBrace + 1, closeBrace) + outDesc.slice(closeBrace + 1);
            searchIdx = outDesc.search("@UUID");
        }

        searchIdx = outDesc.search("@Compendium");
        while (searchIdx >= 0) {
            const openBrace = outDesc.indexOf("{", searchIdx);
            const closeBrace = outDesc.indexOf("}", openBrace);
            outDesc = outDesc.slice(0, searchIdx) + outDesc.slice(openBrace + 1, closeBrace) + outDesc.slice(closeBrace + 1);
            searchIdx = outDesc.search("@Compendium");
        }

        searchIdx = outDesc.search("<img");
        while (searchIdx >= 0) {
            const closeChar = outDesc.indexOf(">", searchIdx);
            outDesc = outDesc.slice(0, searchIdx) + outDesc.slice(closeChar + 1);
            searchIdx = outDesc.search("<img");
        }

        searchIdx = outDesc.search("Requirements");
        if (searchIdx >= 0) {
            const beforeReq = outDesc.slice(0, searchIdx);
            const pOpen = beforeReq.lastIndexOf("<p>");
            const pClose = outDesc.search("</p>", pOpen);
            outDesc = outDesc.slice(0, pOpen) + outDesc.slice(pClose + 5);
        }

        searchIdx = outDesc.search("<article");
        if (searchIdx >= 0) {
            const articleOpenEnd = outDesc.search(">", searchIdx);
            const articleClose = outDesc.search("</article>", searchIdx);
            outDesc = outDesc.slice(0, searchIdx) + outDesc.slice(articleOpenEnd + 1, articleClose) + outDesc.slice(articleClose + "</article>".length);
        }

        searchIdx = outDesc.search("swpf-core");
        while (searchIdx >= 0) {
            outDesc = outDesc.slice(0, searchIdx) + outDesc.slice(searchIdx + "swpf-core".length);
            searchIdx = outDesc.search("swpf-core");
        }

        return outDesc;
    }
}