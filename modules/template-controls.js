export class TemplateControls {

    static presetNames = ["swcone", "swscone", "stream", "sbt", "mbt", "lbt"];

    /**
     * Moves the SWADE measured template preset buttons out of the Regions controls and into their own top level scene control group
     */
    static onGetSceneControlButtons(controls) {
        if (!controls.regions?.tools) {
            return;
        }

        const tools = {};
        for (const name of TemplateControls.presetNames) {
            const tool = controls.regions.tools[name];
            if (!tool) {
                continue;
            }

            tools[name] = { ...tool, visible: true };
            delete controls.regions.tools[name];
        }

        if (!Object.keys(tools).length) {
            return;
        }

        controls.swadeTemplates = {
            name: "swadeTemplates",
            title: "Measured Templates",
            layer: "swadeTemplates",
            icon: "fa-solid fa-ruler-combined",
            visible: controls.regions.visible,
            tools: tools,
            order: (controls.regions.order ?? 0) + 0.5,
        };
    }
}
