class spellTemplateManager {
	static currentItem = undefined;
	static currentActor = undefined;
	static currentPlayer = undefined;
	static currentDurationRounds = undefined;

	constructor(){

	}

	static getDuration(){
		let value = spellTemplateManager.currentItem.data.data.duration.value
		let units = spellTemplateManager.currentItem.data.data.duration.units
		switch(units) {
			case "day":
				spellTemplateManager.currentDurationRounds = value * 10 * 60 * 24;
				break;
			case "hour":
				spellTemplateManager.currentDurationRounds = value * 10 * 60;
				break;
			case "inst":
				spellTemplateManager.currentDurationRounds = 0;
				break;
			case "minute":
				spellTemplateManager.currentDurationRounds = value * 10;
				break;
			case "round":
				spellTemplateManager.currentDurationRounds = value;
				break;
			case "spec":
			case "unti":
				spellTemplateManager.currentDurationRounds = -1;
				break;
			default:
				spellTemplateManager.currentDurationRounds = 0;
		}
		console.log("Spell Template Manager | Spell duration in rounds is ", spellTemplateManager.currentDurationRounds);
	}

	static getData (dialog){
		console.log("Spell Template Manager | Collecting Item Data");
		spellTemplateManager.currentItem = undefined;
		spellTemplateManager.currentActor = undefined;
		spellTemplateManager.currentPlayer = undefined;
		spellTemplateManager.currentDurationRounds = undefined;
		spellTemplateManager.currentItem=dialog.item;
		spellTemplateManager.currentActor=dialog.item.options.actor;
		spellTemplateManager.currentPlayer=game.userId;
		if(spellTemplateManager.currentItem !== undefined) spellTemplateManager.getDuration();
	}



	static async deleteAllTemplates(){
		console.log("Spell Template Manager | Cleaning All Templates");
		let scene=game.scenes.active;
		let templates = scene.data.templates.filter(i => i.user === game.userId);
		let deletions = templates.map(i => i._id);
		let updated = await scene.deleteEmbeddedEntity("MeasuredTemplate",deletions);
	}

	static updateTemplate(scene,template,isConcentration,index){
		let done = false;
		if(index < 10 && !done){
			if(scene.data.templates.filter(i => i._id === template._id).length > 0){
				console.log("Spell Template Manager | Appending data");
				let update;
				if(isConcentration){
					update = {_id: template._id, flags: {"spellTemplateManager":{concentration: isConcentration, actor:spellTemplateManager.currentActor.data._id, duration: spellTemplateManager.currentDurationRounds}},borderColor:"#FFFF00"};
				}else if(spellTemplateManager.currentRoundsDuration>0){
					update = {_id: template._id, flags: {"spellTemplateManager":{concentration: isConcentration, actor:spellTemplateManager.currentActor.data._id, duration: spellTemplateManager.currentDurationRounds}},borderColor:"#00FF00"};					
				}else{
					update = {_id: template._id, flags: {"spellTemplateManager":{concentration: isConcentration, actor:spellTemplateManager.currentActor.data._id, duration: spellTemplateManager.currentDurationRounds}}};
				}
				let updated = scene.updateEmbeddedEntity("MeasuredTemplate", update);
				done = true;
			}else{
				console.log("try again");
				setTimeout(spellTemplateManager.updateTemplate(scene,template,isConcentration,index+1), 1000);
			}
		}else{
			console.log("Spell Template Manager | Failed to update template");
			done = true;
		}
	}


	static async evaluateTemplate(data,template){
		console.log("Spell Template Manager | Evaluating template");
		let scene=game.scenes.active;
		let isConcentration = spellTemplateManager.currentItem.data.data.components.concentration;
		let templates;
		if(isConcentration){
			console.log("Spell Template Manager | New concentration spell.  Clearing previous actor's concentration templates.");
			//templates = scene.data.templates.filter(i => (i.actor === spellTemplateManager.currentActor.data._id || i.actor == undefined) && i._id !== template._id && i.user === game.userId && i.flags.spellTemplateManager.concentration === true)
			templates = scene.data.templates.filter(
				function (i){
					if(i.flags.spellTemplateManager !== undefined){
						return ((i.actor === spellTemplateManager.currentActor.data._id || i.actor == undefined) && i._id !== template._id && i.user === game.userId && i.flags.spellTemplateManager.concentration === true);
					}else{
						return i._id !== template._id;
					}					
				}
			);
		}
		if(templates !== undefined) {
			let deletions = templates.map(i => i._id);
			let updated = await scene.deleteEmbeddedEntity("MeasuredTemplate",deletions);
		}
		console.log(templates);
		console.log("Spell Template Manager | UPDATE TEMPLATE!");
		setTimeout(spellTemplateManager.updateTemplate(scene,template,isConcentration,0), 100);
	}

	static cleanupTemplates(turnActor){
		console.log("Spell Template Manager | Cleaning Templates");
		let scene=game.scenes.active;
		console.log("Initial templates: ", scene.data.templates);
		//console.log("game.userId: ", game.userId);
		let templates = scene.data.templates.filter(
			function(i){
				console.log("i._id: ",i._id);
				//console.log("i.user: ",i.user);
				//console.log("game.userId: ",game.userId);
				console.log("i.flags.spellTemplateManager.duration: ", i.flags.spellTemplateManager.duration);
				console.log("i.flags.spellTemplateManager.actor: ", i.flags.spellTemplateManager.actor);
				console.log("turnActor: ", turnActor);
				return (
					i.user === game.userId && 
					(i.flags.spellTemplateManager.actor === turnActor || i.flags.spellTemplateManager.actor === undefined) && 
					(i.flags.spellTemplateManager.duration === 0 || i.flags.spellTemplateManager.duration === undefined)
				);
			}
		);
		console.log("Returned templates: ", templates);
		let deletions = templates.map(i => i._id);
		let updated = scene.deleteEmbeddedEntity("MeasuredTemplate",deletions);
	}

	static async ageTemplates(turnActor){
		console.log("Spell Template Manger | Aging templates for ", game.combats.active.combatants[game.combats.active.combatants.findIndex(x => x.tokenId === game.combats.active.current.tokenId)].name);
		let aging = game.scenes.active.data.templates.filter(i => i.flags.spellTemplateManager.actor === turnActor);

		for(let i = 0; i < aging.length; i++){
			console.log("ID: ", aging[i]._id, "Initial duration: ", aging[i].flags.spellTemplateManager.duration);
			let update = {_id: aging[i]._id, flags: {"spellTemplateManager":{duration: aging[i].flags.spellTemplateManager.duration-1}}};
			let updated = await game.scenes.active.updateEmbeddedEntity("MeasuredTemplate",update);
			let newTemplate = game.scenes.active.getEmbeddedEntity("MeasuredTemplate", aging[i]._id);
			console.log(game.scenes.active.data.templates[0].flags.spellTemplateManager.duration);
			console.log("New duration: ", newTemplate.flags.spellTemplateManager.duration);	
		}
		console.log("New aged templates: ",game.scenes.active.data.templates);
	}

	

	static async preUpdateCombat(){
		let turnActor = game.combats.active.combatants[game.combats.active.combatants.findIndex(x => x.tokenId === game.combats.active.current.tokenId)].actor.data._id;
		console.log("Spell Template Manager | Leaving turn: ", game.combats.active.combatants[game.combats.active.combatants.findIndex(x => x.tokenId === game.combats.active.current.tokenId)].name);
		spellTemplateManager.cleanupTemplates(turnActor);
	}

	static async updateCombat(){
		console.log("Spell Template Manager | Current Turn: ", game.combats.active.combatants[game.combats.active.combatants.findIndex(x => x.tokenId === game.combats.active.current.tokenId)].name);
		let turnActor = game.combats.active.combatants[game.combats.active.combatants.findIndex(x => x.tokenId === game.combats.active.current.tokenId)].actor.data._id;
		let isMyActor = (canvas.tokens.controlled.filter(i => i.actor.data._id) !== undefined);
		if(isMyActor){
			await spellTemplateManager.ageTemplates(turnActor);
		}
		spellTemplateManager.cleanupTemplates(turnActor);
	}
	
}
Hooks.on("renderAbilityUseDialog",spellTemplateManager.getData);
Hooks.on("createMeasuredTemplate",spellTemplateManager.evaluateTemplate);
Hooks.on("preUpdateCombat",spellTemplateManager.preUpdateCombat);
Hooks.on("updateCombat",spellTemplateManager.updateCombat);

