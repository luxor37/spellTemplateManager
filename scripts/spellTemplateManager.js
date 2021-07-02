import * as stmUtils from './stmUtils.js';
import {stmHooks} from './Hooks.js';

class spellTemplateManager {
	static currentTT = undefined;
	static textureMap = new Map();
		
	static currentStatus = {
		running : false,
		inPUC : false,
		ApplyTextureComplete : true,
		initialized : false
	};

	static currentSettings = {
		usingAT : false,
		enforceConcentration: true,
		worldConcentration: true,
		instantaneousSpellFade : 0,
		unmanagedTemplateAction : "prompt",
		system: undefined,
		reuseItems: false
	};
	static currentData = {
		item:undefined,
		actor:undefined,
		player:undefined,
		duration:undefined,
		scene:undefined,
		ignoreDuration:undefined,
		spell:undefined
	};
	

	static resetItemData(){
		spellTemplateManager.currentData = {
			item:undefined,
			actor:undefined,
			player:undefined,
			duration:undefined,
			scene:undefined,
			ignoreDuration:undefined,
			spell:undefined
		};
	}




	static async updateCombat(Combat) {
		if (Combat.combatant) {
			if(!spellTemplateManager.usingAT){
				await stmUtils.ageTemplates(Combat);
				await stmUtils.cleanupTemplates(Combat);
			}
		}
	}

	static async preUpdateCombat(Combat, userID=''){
		if (Combat.combatant) {
			if(!spellTemplateManager.usingAT){
				await stmUtils.cleanupTemplates(Combat);
			}
			await stmUtils.manageUnmanaged(Combat, spellTemplateManager.currentSettings,(userID ? true : false));
		}
		spellTemplateManager.inPUC = false;
	}
}

stmHooks.setHooks();
spellTemplateManager.currentStatus.running = true;

globalThis.spellTemplateManager = spellTemplateManager;
