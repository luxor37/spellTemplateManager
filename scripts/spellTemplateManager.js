class spellTemplateManager {
	static currentItem = undefined;
	static currentActor = undefined;
	static currentPlayer = undefined;
	static currentDurationRounds = undefined;

	static resetItemData(){
		spellTemplateManager.currentItem = undefined;
		spellTemplateManager.currentActor = undefined;
		spellTemplateManager.currentPlayer = undefined;
		spellTemplateManager.currentDurationRounds = undefined;
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
			case "minutes":
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
				spellTemplateManager.currentDurationRounds = -1;
		}
		console.log("Spell Template Manager | Spell duration in rounds is ", spellTemplateManager.currentDurationRounds);
	}

	static getData (dialog, html){
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

	static updateTemplate(scene,template,isConcentration,isSpecialSpell,index){
		let done = false;
		if(index < 10 && !done){
			if(scene.data.templates.filter(i => i._id === template._id).length > 0){
				console.log("Spell Template Manager | Appending data");
				let update;
				if(isConcentration){
					update = {_id: template._id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor.data._id, 
							duration: spellTemplateManager.currentDurationRounds,
							special: (isSpecialSpell)
						}
					},borderColor:("#"+game.settings.get('spellTemplateManager', 'concentrationTemplateColor'))};
				}else if(spellTemplateManager.currentDurationRounds>0){
					update = {_id: template._id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor.data._id, 
							duration: spellTemplateManager.currentDurationRounds,
							special: (isSpecialSpell)
						}
					},borderColor:("#"+game.settings.get('spellTemplateManager', 'enduringTemplateColor'))};
				}else if(spellTemplateManager.currentDurationRounds<0){
					update = {_id: template._id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor.data._id, 
							duration: spellTemplateManager.currentDurationRounds,
							special: (isSpecialSpell)
						}
					},borderColor:("#"+game.settings.get('spellTemplateManager', 'specialTemplateColor'))};
				}else{
					update = {_id: template._id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor.data._id, 
							duration: spellTemplateManager.currentDurationRounds,
							special: (isSpecialSpell)
						}
					},borderColor:("#"+game.settings.get('spellTemplateManager', 'standardTemplateColor'))};
				}
				let updated = scene.updateEmbeddedEntity("MeasuredTemplate", update);
				spellTemplateManager.resetItemData();
				done = true;
			}else{
				setTimeout(spellTemplateManager.updateTemplate(scene,template,isConcentration,isSpecialSpell,index+1), 1000);
			}
		}else{
			console.log("Spell Template Manager | Failed to update template");
			done = true;
		}
		
	}


	static async evaluateTemplate(data,template){
		console.log("Spell Template Manager | Evaluating template");
		if(spellTemplateManager.currentItem !== undefined){
			let scene=game.scenes.active;
			let isConcentration = spellTemplateManager.currentItem.data.data.components.concentration;
			let isSpecial = (spellTemplateManager.currentItem.data.data.duration.units === "unti");
			let templates;
			if(isConcentration){
				console.log("Spell Template Manager | New concentration spell.  Clearing actor's previous concentration templates.");
				templates = scene.data.templates.filter(
					function (i){
						if(i.flags.spellTemplateManager !== undefined){
							return ((i.actor === spellTemplateManager.currentActor.data._id || i.actor == undefined) && i._id !== template._id && i.user === game.userId && i.flags.spellTemplateManager.concentration === true);
						}else{
							return false;
						}					
					}
				);
			}
			if(templates !== undefined) {
				let deletions = templates.map(i => i._id);
				let updated = await scene.deleteEmbeddedEntity("MeasuredTemplate",deletions);
			}
			setTimeout(spellTemplateManager.updateTemplate(scene,template,isConcentration,isSpecial,0), 100);
		}
	}

	static async cleanupTemplates(turnActor){
		console.log("Spell Template Manager | Cleaning Templates");
		let scene=game.scenes.active;
		let prefilter = scene.data.templates.filter(i => i.flags.spellTemplateManager !== undefined && i.user === game.userId);
		let templates = prefilter.filter(
			function(i){
				return (
					(i.flags.spellTemplateManager.actor === turnActor || i.flags.spellTemplateManager.actor === undefined) && 
					(i.flags.spellTemplateManager.duration <= 0 || i.flags.spellTemplateManager.duration === undefined) &&
					(!i.flags.spellTemplateManager.special || i.flags.spellTemplateManager.special === undefined)
				);
			}
		);
		let deletions = templates.map(i => i._id);
		let updated = scene.deleteEmbeddedEntity("MeasuredTemplate",deletions);
	}

	static async promptDelete(){
		return new Promise(confirm =>{
        		new Dialog({
				title: "Delete Template",
				content: "Are you sure you want to delete this template?",
				buttons: {
					yes: {
						label: "Yes",
						callback: () => {confirm("yes");}
					},
              				no: {
						label: "No",
						callback: () => {confirm("no");}
					},
				},
				default: "close",
				close: () => confirm('no')
			}).render(true);
		})
	}


	static async promptForAction(name){
		return new Promise(complete => {
			new Dialog({
				title: "Specify Units",
				content: "<p>Choose what "+name+" will do with this template.</strong></p>",
				buttons: {
					skip: {
						label: "Skip",
						callback: () => {complete({action:"skip",units:"none",value:0});}
					},
              				delete: {
						label: "Delete",
						callback: async function() {
							let confirmation = await spellTemplateManager.promptDelete();
							if(confirmation === "yes"){
								complete({action:"delete",units:"none",value:0});
							}else{
								complete({action:"skip",units:"none",value:0});
							}
						}
					},
					claim: {
						label: "Claim",
						callback: async function() {
							let unitValue = await spellTemplateManager.promptForUnits();
							complete({action:"claim",units:unitValue.units,value:unitValue.value});
						}
					}
				},
				default: "skip"
			}).render(true);
		})
		
	}

	static async promptForUnits(){
		return new Promise(complete =>{
        		new Dialog({
				title: "For how long?",
				content: "<p>Choose the type of units for this template.</strong></p>",
				buttons: {
					rounds: {
						label: "Rounds",
						callback: async function() {
							let numRounds = await spellTemplateManager.promptForNumber(1,10,"rounds");
							complete({units:"rounds",value:numRounds});
						}
					},
					minutes: {
						label: "Minutes",
						callback: async function() {
							let numMins = await spellTemplateManager.promptForNumber(1,60,"minutes");
							complete({units:"minutes",value:numMins});
						}
					},
					hours: {
						label: "Hours",
						callback: async function() {
							let numHours = await spellTemplateManager.promptForNumber(1,24,"hours");
							complete({units:"hours",value:numHours});
						}
					},
					days: {
						label: "Days",
						callback: async function() {
							let numDays = await spellTemplateManager.promptForNumber(1,7,"days");
							complete({units:"days",value:numDays});
						}
					},
					special: {
						label: "Special",
						callback: () => {complete({units:"special",value:-1});}
					}
				},
				default: {units:"rounds",value:"1"}
			}).render(true);
		})
	}


	static async promptForNumber(min,max,units){

		return new Promise(complete =>{
			let numberButtons = {};
			for (let i = min; i < max+1 ; i++){
				numberButtons[i]={label:i,callback:() => complete(i)};
			}
        		new Dialog({
				title: "How many?",
				content: "<p>Choose a number of <strong>"+units+".</strong></p>",
				buttons: numberButtons,
				default: "1"
			}).render(true);
		})
	}


	static async ageTemplates(turnActor){
		console.log("Spell Template Manger | Aging templates for ", game.combats.active.combatants[game.combats.active.combatants.findIndex(x => x.tokenId === game.combats.active.current.tokenId)].name);
		let controlling = game.scenes.active.data.templates.filter(i => i.flags.spellTemplateManager !== undefined && i.user === game.userId);
		let aging = controlling.filter(i => i.flags.spellTemplateManager.actor === turnActor);
		for(let i = 0; i < aging.length; i++){
			let update = {_id: aging[i]._id, flags: {"spellTemplateManager":{duration: aging[i].flags.spellTemplateManager.duration-1}}};
			let updated = await game.scenes.active.updateEmbeddedEntity("MeasuredTemplate",update);
			let newTemplate = game.scenes.active.getEmbeddedEntity("MeasuredTemplate", aging[i]._id);	
		}
	}

	static async manageUnmanaged(name,id){
		let scene=game.scenes.active;
		let managing = scene.data.templates.filter(i => i.flags.spellTemplateManager === undefined && i.user === game.userId);
		for(let i = 0; i < managing.length; i++){
			await canvas.animatePan({x : managing[i].x, y : managing[i].y, duration : 250});
			let response = await spellTemplateManager.promptForAction(name);
			switch(response.action){
				case "delete":
					let deleted = scene.deleteEmbeddedEntity("MeasuredTemplate",managing[i]._id);
					break;
				case "skip":
					break;
				case "claim":
					let valueInRounds = 0;
					let spellIsSpecial = false;
					switch(response.units) {
						case "day":
							valueInRounds = response.value * 10 * 60 * 24;
							break;
						case "hours":
							valueInRounds = response.value * 10 * 60;
							break;
						case "minutes":
							valueInRounds = response.value * 10;
							break;
						case "rounds":
							valueInRounds = response.value;
							break;
						case "special":
							valueInRounds = -1;
							spellIsSpecial = true;
							break;
						default:
							valueInRounds = -1;
					}
					let update = {_id: managing[i]._id, flags: {
						"spellTemplateManager":{
							concentration: false, 
							actor:id, 
							duration: valueInRounds,
							special: spellIsSpecial
						}
					},borderColor:("#"+game.settings.get('spellTemplateManager', (spellIsSpecial?'specialTemplateColor':'enduringTemplateColor')))};
					let updated = scene.updateEmbeddedEntity("MeasuredTemplate", update);
					break;
			}
		}
	}

	static async preUpdateCombat(){
		if(spellTemplateManager.haveActiveTemplates()){
			let turnActor = game.combats.active.combatant.actor._id
			let name = game.combats.active.combatant.actor.name
			await spellTemplateManager.cleanupTemplates(turnActor);
			await spellTemplateManager.manageUnmanaged(name,turnActor);
		}
	}
	static async updateCombat(){
		if(spellTemplateManager.haveActiveTemplates()){
			let turnActor = game.combats.active.combatant.actor._id
			let isMyActor = (canvas.tokens.controlled.filter(i => i.actor.data._id) !== undefined);
			if(isMyActor){
				await spellTemplateManager.ageTemplates(turnActor);
			}
			await spellTemplateManager.cleanupTemplates(turnActor);
		}
	}

	static haveActiveTemplates(){
		if(game.scenes.active === undefined ){
			console.log("Spell Template Manager | No active scene found!  Nothing to do.");
			return false;
		}else{
			return game.scenes.active.data.templates.filter(i=> i.user === game.userId).length > 0;
		}
	}

	static resetTemplateBorders(){
		game.scenes.forEach(i => {console.log(i);i.data.templates.forEach(j => {
			let update = {};
			if(j.flags.spellTemplateManager.concentration){
				update = {_id: j._id, borderColor:("#"+game.settings.get('spellTemplateManager', 'concentrationTemplateColor'))};
			}else if(j.flags.spellTemplateManager.duration > 0){
				update = {_id: j._id, borderColor:("#"+game.settings.get('spellTemplateManager', 'enduringTemplateColor'))};
			}else if(j.flags.spellTemplateManager.special){
				update = {_id: j._id, borderColor:("#"+game.settings.get('spellTemplateManager', 'specialTemplateColor'))};
			}else {
				update = {_id: j._id, borderColor:("#"+game.settings.get('spellTemplateManager', 'standardTemplateColor'))};
			}				
			let updated = i.updateEmbeddedEntity("MeasuredTemplate", update);

		})});
	}	

}

function registerSpellTemplateManagerSettings(){
	game.settings.register(
		"spellTemplateManager", "standardTemplateColor", {
			name: game.i18n.localize("spellTemplateManager.standardTemplateColor.name"),
			hint: game.i18n.localize("spellTemplateManager.standardTemplateColor.hint"),
			scope: "world",
			config: true,
			default: "000000",
			type: String,
			onChange: () => { spellTemplateManager.resetTemplateBorders();}
		}
	);
	game.settings.register(
		"spellTemplateManager", "concentrationTemplateColor", {
			name: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.name"),
			hint: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.hint"),
			scope: "world",
			config: true,
			default: "ffff00",
			type: String,
			onChange: () => { spellTemplateManager.resetTemplateBorders();}
		}
	);
	game.settings.register(
		"spellTemplateManager", "enduringTemplateColor", {
			name: game.i18n.localize("spellTemplateManager.enduringTemplateColor.name"),
			hint: game.i18n.localize("spellTemplateManager.enduringTemplateColor.hint"),
			scope: "world",
			config: true,
			default: "00ff00",
			type: String,
			onChange: () => { spellTemplateManager.resetTemplateBorders();}
		}
	);
	game.settings.register(
		"spellTemplateManager", "specialTemplateColor", {
			name: game.i18n.localize("spellTemplateManager.specialTemplateColor.name"),
			hint: game.i18n.localize("spellTemplateManager.specialTemplateColor.hint"),
			scope: "world",
			config: true,
			default: "ffffff",
			type: String,
			onChange: () => { spellTemplateManager.resetTemplateBorders();}
		}
	);
}


Hooks.once("init", () => {
    registerSpellTemplateManagerSettings();
});

Hooks.on("renderAbilityUseDialog",(dialog, html) => {
	console.log("Spell Template Manager | Ability Use Dialog Capture");
	document.getElementsByClassName("dialog-button")[0].addEventListener("click",
		async () => {
			let spellLevelSelect = document.querySelectorAll("form#ability-use-form")[0][0].selectedIndex;
			let spellLevelText = document.querySelectorAll("form#ability-use-form")[0][0][spellLevelSelect]?.innerText ?? 0;
			let slotsAvailable = (spellLevelText.indexOf("0") === -1);
			if(slotsAvailable){
				await spellTemplateManager.getData(dialog,html);
			}
		}
	);
});	

Hooks.on("createMeasuredTemplate",spellTemplateManager.evaluateTemplate);

Hooks.on("preUpdateCombat",spellTemplateManager.preUpdateCombat);

Hooks.on("updateCombat",spellTemplateManager.updateCombat);

