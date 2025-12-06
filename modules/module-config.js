export const NAME = "foundry-dumping-ground";

export const TITLE = "Foundry Dumping Ground";
export const SHORT_TITLE = "FDG";

export const PATH = "modules/foundry-dumping-ground";

export const CONST = {
    teleportSuccessDist: 12,
    teleportRaiseDist: 24,
}

export const DEFAULT_CONFIG = {
    templates: {
        blindDialog: `${PATH}/templates/blind-dialog.hbs`,
        warriorsGiftDialog: `${PATH}/templates/warriors-gift-dialog.hbs`,
        summonDialog: `${PATH}/templates/summon-dialog.hbs`,
        exportedItem: `${PATH}/templates/partials/exported-item.hbs`,
        exportedItems: `${PATH}/templates/exported-items.hbs`,
    },
    warriorPacks: {
        "swpf-core-rules.swpf-edges": "PF",
        "swade-core-rules.swade-edges": "Core",
    },
}

export const FLAGS = {
    tempEdges: "tempEdges",
}

export const SETTING_KEYS = {
    warriorFavourites: "warriorFavourites",
    warriorPack: "warriorPack",
}

