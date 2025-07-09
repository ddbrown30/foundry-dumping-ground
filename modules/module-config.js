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
        exportedItem: `${PATH}/templates/partials/exported-item.hbs`,
        exportedItems: `${PATH}/templates/exported-items.hbs`,
    },
}

export const FLAGS = {
}

export const SETTING_KEYS = {
    lastGitCheck: "lastGitCheck",
    viewedReleaseUpdate: "viewedReleaseUpdate",
}

