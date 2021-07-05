import * as stmUtils from './stmUtils.js';

export function registerSpellTemplateManagerSettings(system,stmSettings){

	new window.Ardittristan.ColorSetting("spellTemplateManager", "standardTemplateColor", {
		name: game.i18n.localize("spellTemplateManager.standardTemplateColor.name"),
		hint: game.i18n.localize("spellTemplateManager.standardTemplateColor.hint"),
		label: "Click to select color",
		restricted: true,
		defaultColor: "#000000ff",
		scope: "world",
		onChange: () => { stmUtils.resetTemplateBorders();}
	});

	switch(system){
		case "dnd5e":
			new window.Ardittristan.ColorSetting("spellTemplateManager", "concentrationTemplateColor", {
				name: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.name"),
				hint: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.hint"),
				label: "Click to select color",
				restricted: true,
				defaultColor: "#ffff00ff",
				scope: "world",
				onChange: () => { stmUtils.resetTemplateBorders();}
			});
			break;

		default:
			game.settings.register(
				"spellTemplateManager", "concentrationTemplateColor", {
					name: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.name"),
					hint: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.hint"),
					scope: "world",
					config: false,
					type: String,
					default: "#ffff00ff",
					onChange: () => {stmUtils.resetTemplateBorders();}
				}
			);
			break;			
	}

	new window.Ardittristan.ColorSetting("spellTemplateManager", "enduringTemplateColor", {
		name: game.i18n.localize("spellTemplateManager.enduringTemplateColor.name"),
		hint: game.i18n.localize("spellTemplateManager.enduringTemplateColor.hint"),
		label: "Click to select color",
		restricted: true,
		defaultColor: "#00ff00ff",
		scope: "world",
		onChange: () => { stmUtils.resetTemplateBorders();}
	});

	new window.Ardittristan.ColorSetting("spellTemplateManager", "specialTemplateColor", {
		name: game.i18n.localize("spellTemplateManager.specialTemplateColor.name"),
		hint: game.i18n.localize("spellTemplateManager.specialTemplateColor.hint"),
		label: "Click to select color",
		restricted: true,
		defaultColor: "#ffffffff",
		scope: "world",
		onChange: () => { stmUtils.resetTemplateBorders();}
	});

	game.settings.register(
		"spellTemplateManager", "unmanagedTemplateAction", {
  			name: game.i18n.localize("spellTemplateManager.unmanagedTemplateAction.name"),
			hint: game.i18n.localize("spellTemplateManager.unmanagedTemplateAction.hint"),
			scope: "client",
			config: true,
			type: String,
			choices: {
				"prompt": game.i18n.localize("spellTemplateManager.unmanagedTemplateAction.prompt"),
				"skip": game.i18n.localize("spellTemplateManager.unmanagedTemplateAction.skip"),
				"delete": game.i18n.localize("spellTemplateManager.unmanagedTemplateAction.delete"),
				"claim": game.i18n.localize("spellTemplateManager.unmanagedTemplateAction.claim")
			},
			default: "prompt",
			onChange: () => {stmSettings.unmanagedTemplateAction = value;}
		}
	);
	stmSettings.unmanagedTemplateAction = game.settings.get("spellTemplateManager","unmanagedTemplateAction");

	game.settings.register(
		"spellTemplateManager", "instantaneousSpellFade", {
			name: game.i18n.localize("spellTemplateManager.instantaneousSpellFade.name"),
			hint: game.i18n.localize("spellTemplateManager.instantaneousSpellFade.hint"),
			scope: "world",
			config: true,
			type: Number,
			range: {
				min: 0,
				max: 10,
				step: 1
			},
			default: 0,
			onChange: (value) => {stmSettings.instantaneousSpellFade = value;}
		}
	);
	stmSettings.instantaneousSpellFade = game.settings.get("spellTemplateManager","instantaneousSpellFade");

	game.settings.register(
		"spellTemplateManager","enforceConcentration", {
			name: game.i18n.localize("spellTemplateManager.enforceConcentration.name"),
			hint: game.i18n.localize("spellTemplateManager.enforceConcentration.hint"),
			type: Boolean,
			default: (system != "pf2e"),
			config: (system == "dnd5e"),
			scope: "world",
			onChange: (value) => {stmSettings.enforceConcentration = value;}
		}
	);
	stmSettings.enforceConcentration = game.settings.get("spellTemplateManager","enforceConcentration");

	game.settings.register(
		"spellTemplateManager","worldConcentration", {
               		name: game.i18n.localize("spellTemplateManager.worldConcentration.name"),
			        hint: game.i18n.localize("spellTemplateManager.worldConcentration.hint"),
                    type: Boolean,
                    default: (system != "pf2e"),
                    config: (system == "dnd5e"),
        	       	scope: "world",
	              	onChange: (value) => {stmSettings.worldConcentration = value;}
        	}
	);
	stmSettings.worldConcentration = game.settings.get("spellTemplateManager","worldConcentration");

	let ATInstalled = false;
	let ATEnabled = false;
	try{ ATInstalled = !(game.modules.get("about-time") == undefined); }catch{}
	try{ ATEnabled = game.modules.get("about-time").active; }catch{}
	game.settings.register(
		"spellTemplateManager","usingAT", {
            name: game.i18n.localize("spellTemplateManager.usingAT.name"),
            hint: game.i18n.localize("spellTemplateManager.usingAT.hint"),
            type: Boolean,
            default: false,
            config: (ATInstalled && ATEnabled),
            scope: "world",
            onChange: (value) => {
                stmSettings.usingAT = value;
                if(value){
                    stmUtils.createATEvents();
                }
            }
        }
	);
    stmSettings.usingAT = (ATInstalled && ATEnabled && game.settings.get("spellTemplateManager","usingAT"));
    stmSettings.system = game.system.data.name;
    if(stmSettings.usingAT){
        stmSettings.roundSeconds = CONFIG.time.roundTime;
    }else{
        stmSettings.roundSeconds = 6;
    }

	game.settings.register(
		"spellTemplateManager","reuseItems", {
            name: game.i18n.localize("spellTemplateManager.reuseItems.name"),
            hint: game.i18n.localize("spellTemplateManager.reuseItems.hint"),
            type: Boolean,
            default: false,
            config: true,
            scope: "world",
            onChange: (value) => {
                stmSettings.reuseItems = value;
            }
        }
	);
	stmSettings.reuseItems = game.settings.get("spellTemplateManager","reuseItems");

    return stmSettings;	
}