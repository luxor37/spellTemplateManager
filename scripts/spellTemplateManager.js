class spellTemplateManager {
	static currentItem = undefined;
	static currentActor = undefined;
	static currentPlayer = undefined;
	static currentDurationRounds = undefined;
	static currentScene = undefined;
	static inPUC = false;
	static capture = undefined;
	static currentException = undefined;
	static usingAT = false;
	static enforceConcentration = true;
	static worldConcentration = true;
	static instantaneousSpellFade = 0;
	static unmanagedTemplateAction = "prompt";

	static resetItemData(){
		spellTemplateManager.currentItem = undefined;
		spellTemplateManager.currentActor = undefined;
		spellTemplateManager.currentPlayer = undefined;
		spellTemplateManager.currentDurationRounds = undefined;
		spellTemplateManager.currentScene = undefined;
		spellTemplateManager.currentException = undefined;
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
				spellTemplateManager.currentDurationRounds = 0 + spellTemplateManager.instantaneousSpellFade;
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
		console.debug("Spell Template Manager | Spell duration in rounds is ", spellTemplateManager.currentDurationRounds);
	}

	static getData (dialog, html){
		console.log("Spell Template Manager | Collecting Item Data");
		console.log(dialog);
		spellTemplateManager.currentItem = undefined;
		spellTemplateManager.currentActor = undefined;
		spellTemplateManager.currentPlayer = undefined;
		spellTemplateManager.currentDurationRounds = undefined;
		spellTemplateManager.currentItem=dialog.item;
		spellTemplateManager.currentActor=dialog.item.actor;
		spellTemplateManager.currentScene=game.scenes.viewed.id;
		spellTemplateManager.currentPlayer=game.userId;
		if(dialog.item.data.flags.spellTemplateManager != undefined){
			spellTemplateManager.currentException=dialog.item.data.flags.spellTemplateManager["ignore-duration"];
		}else{
			spellTemplateManager.currentException=undefined;
		}		
		if(spellTemplateManager.currentItem !== undefined) spellTemplateManager.getDuration();
	}

	static async deleteAllTemplates(){
		console.log("Spell Template Manager | Cleaning All Templates");
		let scenes = game.scenes;
		scenes.forEach(scene => {

			console.debug(scene.name);
			let templates = undefined;
			templates = scene.data.templates;
			console.debug("Final deletions: ",templates);
			if(templates !== undefined) {
				let deletions = templates.map(i => i.id);
				let updated = scene.deleteEmbeddedDocuments("MeasuredTemplate",deletions);					
			}else{
				console.log("Spell Template Manager | Nothing to delete!");
			}
		});
			
	}

	static updateTemplate(scene,template,ignoreDuration,isConcentration,isSpecialSpell,index){
		console.log("UPDATE TEMPLATE");
		let done = false;
		if(index < 10 && !done){
			if(scene.data.templates.filter(i => i.id === template.id).length > 0){
				console.log("Spell Template Manager | Appending data");
				let update;
				if(isConcentration){
					update = {_id: template.id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor.data._id, 
							duration: (ignoreDuration?0:spellTemplateManager.currentDurationRounds),
							special: (isSpecialSpell),
							scene: scene.id
						}
					},borderColor:("#"+(game.settings.get('spellTemplateManager', 'concentrationTemplateColor')).substring(1,7))};
				}else if(spellTemplateManager.currentDurationRounds>0){
					update = {_id: template.id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor.data._id, 
							duration: (ignoreDuration?0:spellTemplateManager.currentDurationRounds),
							special: (isSpecialSpell),
							scene: spellTemplateManager.currentScene
						}
					},borderColor:("#"+(game.settings.get('spellTemplateManager', 'enduringTemplateColor')).substring(1,7))};
				}else if(spellTemplateManager.currentDurationRounds<0){
					update = {_id: template.id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor.data._id, 
							duration: (ignoreDuration?0:spellTemplateManager.currentDurationRounds),
							special: (isSpecialSpell),
							scene: spellTemplateManager.currentScene
						}
					},borderColor:("#"+(game.settings.get('spellTemplateManager', 'specialTemplateColor')).substring(1,7))};
				}else{
					update = {_id: template.id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor.data._id, 
							duration: (ignoreDuration?0:spellTemplateManager.currentDurationRounds),
							special: (isSpecialSpell),
							scene: spellTemplateManager.currentScene
						}
					},borderColor:("#"+(game.settings.get('spellTemplateManager', 'standardTemplateColor')).substring(1,7))};
				}
				let updated = scene.updateEmbeddedDocuments("MeasuredTemplate", [update]);

				if(game.settings.get('spellTemplateManager','usingAT')){
					let roundSeconds = game.settings.get("about-time", "seconds-per-round");					
					game.Gametime.notifyIn({seconds: ignoreDuration?6:spellTemplateManager.currentDurationRounds*roundSeconds},"spellTemplateManager",template.id);
				}
				spellTemplateManager.resetItemData();  
				done = true;
			}else{
				console.debug("Spell Template Manager | Failed to update template.  Retrying. ", index);
				setTimeout(spellTemplateManager.updateTemplate(scene,template,ignoreDuration,isConcentration,isSpecialSpell,index+1), 1000);
			}
		}else{
			console.log("Spell Template Manager | Failed to update template.");
			done = true;
		}
		
	}
	

	static async deleteTemplate(templateId){
		console.log("Spell Template Manager | Deleting Template: ", templateId);
		game.scenes.forEach(scene => {
			let templates = scene.data.templates.filter(i => i.id == templateId);
			let deletions = templates.map(i => i.id);
			let updated = scene.deleteEmbeddedDocuments("MeasuredTemplate",deletions);
		});
	}

	static async evaluateTemplate(template,data,userID){
		console.log("Spell Template Manager | Evaluating template");
		if(spellTemplateManager.currentItem !== undefined){
			let isConcentration = spellTemplateManager.currentItem.data.data.components?spellTemplateManager.currentItem.data.data.components?.concentration:false;
			let isSpecial = (spellTemplateManager.currentItem.data.data.duration.units === "unti" || spellTemplateManager.currentItem.data.data.duration.units === "spec");
			let ignoreDuration = (spellTemplateManager.currentException == "checked" ? true : false);
			if(isConcentration && spellTemplateManager.enforceConcentration){
				console.log("Spell Template Manager | New concentration spell.  Clearing actor's previous concentration templates.");
				game.scenes.forEach(scene => {
					console.debug(scene.name);
					let filtertemplates = scene.data.templates;
					console.debug("Filtering for world concentration",spellTemplateManager.worldConcentration);
					filtertemplates = filtertemplates.filter(i => {
						scene = i.parent; 
						return (i.data.flags.spellTemplateManager !== undefined)?(spellTemplateManager.worldConcentration?true:(scene.id == game.scenes.viewed.id)):false;
					});
					console.debug(filtertemplates);
					console.debug("Filtering for concentration");
					filtertemplates = filtertemplates.filter(i => {
							scene = i.parent;
							if(i.data.flags.spellTemplateManager !== undefined){
								//try{
									return ((spellTemplateManager.currentActor.data._id === i.data.flags.spellTemplateManager.actor) && (i.id !== template.id) && (i.data.user === game.userId) && (i.data.flags.spellTemplateManager.concentration === true) && (scene.id == i.data.flags.spellTemplateManager.scene));
								//}catch{
								//	console.log(i);
								//}
							}else{
								return false;
							}					
						}
					);
					console.debug("Final deletions: ",filtertemplates);
					if(filtertemplates !== undefined) {
						let deletions = filtertemplates.map(i => i.id);
						let updated = scene.deleteEmbeddedDocuments("MeasuredTemplate",deletions);					
					}else{
						console.log("Spell Template Manager | Nothing to delete!");
					}				
				});
			}
			setTimeout(spellTemplateManager.updateTemplate(game.scenes.viewed,template,ignoreDuration,isConcentration,isSpecial,0), 100);
		}else{
			console.log("Spell Template Manager | Could not find current feature data!  Failing!");
		}
	}

	static async cleanupTemplates(Combat){
		console.log("Spell Template Manager | Cleaning Templates: ", Combat.combatant.actor.id);
		let scene=Combat.scene;
		let prefilter = scene.data.templates.filter(i => i.data.flags.spellTemplateManager !== undefined);
		let templates = prefilter.filter(
			function(i){
				
				return (
					(i.data.flags.spellTemplateManager.actor === Combat.combatant.actor.id || i.data.flags.spellTemplateManager.actor === undefined) && 
					(i.data.flags.spellTemplateManager.duration <= 0 || i.data.flags.spellTemplateManager.duration === undefined) &&
					(!i.data.flags.spellTemplateManager.special || i.data.flags.spellTemplateManager.special === undefined)
				);
			}
		);
		let deletions = templates.map(i => i.id);
		let updated = undefined;
		updated = await scene.deleteEmbeddedDocuments("MeasuredTemplate",deletions);
		console.debug("Spell Template Manager | Cleaning Templates Completed");
		
		
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
				title: "Claim for how long?",
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


	static async ageTemplates(Combat){
		console.log("Spell Template Manger | Aging templates for ", Combat.combatant.actor.name);
		let controlling = Combat.scene.data.templates.filter(i => i.data.flags.spellTemplateManager !== undefined);
		let aging = controlling.filter(i => i.data.flags.spellTemplateManager.actor === Combat.combatant.actor.id);
		for(let i = 0; i < aging.length; i++){
				console.debug("Before: ",i);
				let update = {_id: aging[i].id, flags: {"spellTemplateManager":{duration: aging[i].data.flags.spellTemplateManager.duration-1}}};
				let updated = await Combat.scene.updateEmbeddedDocuments("MeasuredTemplate",[update]);
				console.debug("After: ",i);
		}
		console.debug("Spell Template Manager | Aging templates done.");
	}

	static async manageUnmanaged(Combat,GM=false){
		console.log("Spell Template Manager | Looking for Unmanaged Templates");
		let scene=Combat.scene;
		let turnActor = Combat.combatant?.actor;
		if(!turnActor) return;

		let name = turnActor.name;
		let managing = scene.data.templates.filter(i => i.data.flags.spellTemplateManager === undefined && (GM || i.data.user === game.userId));
		for(let i = 0; i < managing.length; i++){
			let action = spellTemplateManager.unmanagedTemplateAction;			
			let response = null;
			if(action === "prompt"){
				await canvas.animatePan({x : managing[i].data.x, y : managing[i].data.y, duration : 250});
				response = await spellTemplateManager.promptForAction(turnActor.name);
			}
			if(action === "delete" || (action==="prompt" && response?.action === "delete")){
				let deleted = scene.deleteEmbeddedDocuments("MeasuredTemplate",[managing[i].id]);
			}
			if(action === "claim"){
				await canvas.animatePan({x : managing[i].data.x, y : managing[i].data.y, duration : 250});
				response = await spellTemplateManager.promptForUnits();
			}
			if(action === "claim" || (action === "prompt" && response?.action === "claim")){
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
					let update = {_id: managing[i].id, flags: {
						"spellTemplateManager":{
							concentration: false, 
							actor: turnActor.id, 
							duration: valueInRounds,
							special: spellIsSpecial,
							scene: Combat.scene.id
						}
					},borderColor:(game.settings.get('spellTemplateManager', (spellIsSpecial?'specialTemplateColor':'enduringTemplateColor')))};
					let updated = scene.updateEmbeddedDocuments("MeasuredTemplate", [update]);	


					if(game.settings.get('spellTemplateManager','usingAT')){
						let roundSeconds = game.settings.get("about-time", "seconds-per-round");					
						game.Gametime.notifyIn({seconds: spellTemplateManager.currentDurationRounds*roundSeconds},"spellTemplateManager",template.id);
					}
			}
		}
	}

	static async updateCombat(Combat) {
		if (Combat.combatant) {
			if(!spellTemplateManager.usingAT){
				await spellTemplateManager.ageTemplates(Combat);
				await spellTemplateManager.cleanupTemplates(Combat);
			}
		}
	}

	static async preUpdateCombat(Combat, userID=''){
		if (Combat.combatant) {
			if(!spellTemplateManager.usingAT){
				await spellTemplateManager.cleanupTemplates(Combat);
			}
			await spellTemplateManager.manageUnmanaged(Combat, (userID ? true : false));
		}
		spellTemplateManager.inPUC = false;
	}

	static resetTemplateBorders(){
		
		game.scenes.forEach(i => {i.data.templates.forEach(j => {
			let update = {};
			if(j.data.flags.spellTemplateManager?.concentration){
				update = {_id: j.id, borderColor:("#"+(game.settings.get('spellTemplateManager', 'concentrationTemplateColor')).substring(1,7))};
			}else if(j.data.flags.spellTemplateManager?.duration > 0){
				update = {_id: j.id, borderColor:("#"+(game.settings.get('spellTemplateManager', 'enduringTemplateColor')).substring(1,7))};
			}else if(j.data.flags.spellTemplateManager?.special){
				update = {_id: j.id, borderColor:("#"+(game.settings.get('spellTemplateManager', 'specialTemplateColor')).substring(1,7))};
			}else {
				update = {_id: j.id, borderColor:("#"+(game.settings.get('spellTemplateManager', 'standardTemplateColor')).substring(1,7))};
			}				
			let updated = i.updateEmbeddedDocuments("MeasuredTemplate", [update]);

		})});

	}


	static createATEvents(){
		console.log("Spell Template Manager | Creating About Time notification events");
		game.scenes.forEach(i => {i.data.templates.forEach(j => {
			

			let searchID = j.id;
			let match = false;
			for(let i = 0; i < game.Gametime.ElapsedTime._eventQueue.array.length; i++){
				if(game.Gametime.ElapsedTime._eventQueue.array[i]._args[0]=="spellTemplateManager"){
					if(game.Gametime.ElapsedTime._eventQueue.array[i]._args[1]==searchID){
						match=true;
						break;
					}
				}
			}
			if(!match){
				let newDuration = j.data.flags.spellTemplateManager.duration * game.settings.get("about-time", "seconds-per-round");
				console.debug("Spell Template Manager | Creating Notify Event for template ", j.id, " in ", newDuration, " seconds."); 
				game.Gametime.notifyIn({seconds: newDuration},"spellTemplateManager",j.id);
			
			}
		})});
	}	

}

function registerSpellTemplateManagerSettings(){

	new window.Ardittristan.ColorSetting("spellTemplateManager", "standardTemplateColor", {
		name: game.i18n.localize("spellTemplateManager.standardTemplateColor.name"),
		hint: game.i18n.localize("spellTemplateManager.standardTemplateColor.hint"),
		label: "Click to select color",
		restricted: true,
		defaultColor: "#000000ff",
		scope: "world",
		onChange: (value) => { spellTemplateManager.resetTemplateBorders();}
	});

	new window.Ardittristan.ColorSetting("spellTemplateManager", "concentrationTemplateColor", {
		name: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.name"),
		hint: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.hint"),
		label: "Click to select color",
		restricted: true,
		defaultColor: "#ffff00ff",
		scope: "world",
		onChange: (value) => { spellTemplateManager.resetTemplateBorders();}
	});

	new window.Ardittristan.ColorSetting("spellTemplateManager", "enduringTemplateColor", {
		name: game.i18n.localize("spellTemplateManager.enduringTemplateColor.name"),
		hint: game.i18n.localize("spellTemplateManager.enduringTemplateColor.hint"),
		label: "Click to select color",
		restricted: true,
		defaultColor: "#00ff00ff",
		scope: "world",
		onChange: (value) => { spellTemplateManager.resetTemplateBorders();}
	});

	new window.Ardittristan.ColorSetting("spellTemplateManager", "specialTemplateColor", {
		name: game.i18n.localize("spellTemplateManager.specialTemplateColor.name"),
		hint: game.i18n.localize("spellTemplateManager.specialTemplateColor.hint"),
		label: "Click to select color",
		restricted: true,
		defaultColor: "#ffffffff",
		scope: "world",
		onChange: (value) => { spellTemplateManager.resetTemplateBorders();}
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
			onChange: value => {spellTemplateManager.unmanagedTemplateAction = value;}
		}
	);
	spellTemplateManager.unmanagedTemplateAction = game.settings.get("spellTemplateManager","unmanagedTemplateAction");

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
			onChange: value => {spellTemplateManager.instantaneousSpellFade = value;}
		}
	);
	spellTemplateManager.instantaneousSpellFade = game.settings.get("spellTemplateManager","instantaneousSpellFade");

	game.settings.register(
		"spellTemplateManager","enforceConcentration", {
			name: game.i18n.localize("spellTemplateManager.enforceConcentration.name"),
			hint: game.i18n.localize("spellTemplateManager.enforceConcentration.hint"),
			type: Boolean,
			default: true,
			config: true,
			scope: "world",
			onChange: value => {spellTemplateManager.enforceConcentration = value;}
		}
	);
	spellTemplateManager.enforceConcentration = game.settings.get("spellTemplateManager","enforceConcentration");

	game.settings.register(
		"spellTemplateManager","worldConcentration", {
               		name: game.i18n.localize("spellTemplateManager.worldConcentration.name"),
			hint: game.i18n.localize("spellTemplateManager.worldConcentration.hint"),
                    	type: Boolean,
                    	default: true,
                    	config: true,
        	       	scope: "world",
	              	onChange: value => {spellTemplateManager.worldConcentration = value;}
        	}
	);
	spellTemplateManager.worldConcentration = game.settings.get("spellTemplateManager","worldConcentration");

	let ATInstalled = false;
	let ATEnabled = false;
	try{ ATInstalled = !(game.modules.get("about-time") == undefined); }catch{}
	try{ ATEnabled = game.modules.get("about-time").active; }catch{}
	game.settings.register(
		"spellTemplateManager","usingAT", {
               		name: game.i18n.localize("spellTemplateManager.usingAT.name"),
			hint: game.i18n.localize("spellTemplateManager.usingAT.hint"),
	               	type: Boolean,
	               	default: true,
	               	config: (ATInstalled && ATEnabled),
	               	scope: "world",
	               	onChange: value => {
				spellTemplateManager.usingAT = value;
				if(value){
					spellTemplateManager.createATEvents();
				}
			}
        	}
	);
	spellTemplateManager.usingAT = (ATInstalled && ATEnabled && game.settings.get("spellTemplateManager","usingAT"));	
}


Hooks.once("init", () => {
	registerSpellTemplateManagerSettings();
});

Hooks.once('ready', () => {
    try{window.Ardittristan.ColorSetting.tester} catch {
        ui.notifications.notify('Please make sure you have the "lib - ColorSettings" module installed and enabled.', "error");
    }
});

Hooks.on(`renderItemSheet`, (app, html) =>{
	spellTemplateManager.capture = html;
  const template_types = ["cone", "circle", "rect", "ray"];
  const add = ".tab.details";

  //do not add new value to a item that doesn't need it
  if(app.object.type !== "spell" && !template_types.includes(app.object.data.data.target.type)) return;
  //define what the value is
  let status = app.object.getFlag(`spellTemplateManager`,`ignore-duration`) ?? "";
  
  //add the checkbox to the item
  html.find(add).append(`
	<h3 class="form-header">Spell Templates</h3>
	<div class="form-group">
    <label class="checkbox">
      <input type="checkbox" name="spell.template.removal" ${status}>
      Ignore Spell Duration (Remove Immediately)
    </label>
	</div>
  `);
  
  //react to the checkbox being changed, saving the value in a flag
  $('input[name="spell.template.removal"]')[0].onchange = (event) => {
    let status = event.target.checked ? "checked" : "";
    app.object.setFlag(`spellTemplateManager`, `ignore-duration`, status);
  }
});


Hooks.on("renderAbilityUseDialog",(dialog, html) => {
	console.log("Spell Template Manager | Ability Use Dialog Capture");
	document.getElementsByClassName("dialog-button")[0].addEventListener("click",
		async () => {
			
			
			let isSpell = false;
			let isFeature = false;
			let isAvailable = false;
			let isAtWill = false
	
			console.log("Spell Template Manager | Evaluating Dialog");
			
			for(let i = 0; i < document.querySelectorAll("form#ability-use-form")[0].children.length; i++){
				if("Consume Available Usage?" == document.querySelectorAll("form#ability-use-form")[0].children[i].innerText){
					isFeature=true;
					if(document.querySelectorAll("form#ability-use-form")[0].children[1].innerText.indexOf("This feat has") > -1){
						console.debug("Spell Template Manager | Feature Detected");
						isAvailable = (document.querySelectorAll("form#ability-use-form")[0].children[1].innerText.indexOf(" 0 of") === -1 ||
						   document.querySelectorAll("form#ability-use-form")[0].children[i].children[0].children[0].checked == false);	
					}
				}			
				if("Consume Spell Slot?" == document.querySelectorAll("form#ability-use-form")[0].children[i]?.children[0]?.innerText){
					isSpell=true;
					console.debug("Spell Template Manager | Spell Cast Detected");
					let spellLevelSelect = document.querySelectorAll("form#ability-use-form")[0][0].selectedIndex;
					let spellLevelText = document.querySelectorAll("form#ability-use-form")[0][0][spellLevelSelect]?.innerText ?? 0;
					let isConsuming = document.querySelectorAll("form#ability-use-form")[0].children[i].children[0].children[0].checked;
					isAvailable = (spellLevelText.indexOf("0") === -1 || !isConsuming);
				}	
				if("Consume Recharge?" == document.querySelectorAll("form#ability-use-form")[0].children[i].innerText){
					isFeature=true;
					if(document.querySelectorAll("form#ability-use-form")[0].children[1].innerText.indexOf("This feat ") > -1){
						console.debug("Spell Template Manager | Recharge Feat Detected");
						isAvailable = (document.querySelectorAll("form#ability-use-form")[0].children[1].innerText.indexOf("depleted") === -1 ||
						   document.querySelectorAll("form#ability-use-form")[0].children[i].children[0].children[0].checked == false);	
					}
				}
			}
			if(!isSpell && !isFeature){
				isAtWill = true;
				console.debug("At-will Ability Detected");
			}
			if( ((isSpell || isFeature) && isAvailable) ||
			    (isAtWill)
			){
				await spellTemplateManager.getData(dialog,html);
			}else{
				console.debug("Spell Template Manager | Unknown Form: ",document.querySelectorAll("form#ability-use-form")[0].children);
			}
		}
	);
});	

Hooks.on("createMeasuredTemplate",spellTemplateManager.evaluateTemplate);

Hooks.on("preUpdateCombat",(Combat,Round,Diff,User) => {
	console.debug("Spell Template Manager | PUC Starting");
	spellTemplateManager.inPUC = true;
	if((User == game.user.id) && game.user.isGM){
		console.debug("Spell Template Manager | Initiating PUC as GM!");
		spellTemplateManager.preUpdateCombat(Combat,User);
	}else if(User == game.user.id  && !game.user.isGM){
		console.debug("Spell Template Manager | Initiating PUC as PC!");
		spellTemplateManager.preUpdateCombat(Combat);
	}else{
		console.debug("Spell Template Manager | The thing that should not be.");
	}
});

Hooks.on("updateCombat", (Combat,Round,Diff,User) => {
	let mysi = setInterval(
	function(){ 
		let UCComplete = false;
		if(!spellTemplateManager.inPUC){	
			console.debug("Spell Template Manager | UC Starting");
			if(game.user.isGM){
				console.debug("Spell Template Manager | Initiating UC as GM!");
				spellTemplateManager.updateCombat(Combat);
			}
			clearInterval(mysi);
		}else{
			console.debug("Spell Template Manager | preUpdateCombat not complete: ",spellTemplateManager.inPUC);
		}
	}, 30);	
});

Hooks.on("about-time.eventTrigger", (...args) => {
	if(args[0] == "spellTemplateManager" && spellTemplateManager.usingAT){
		spellTemplateManager.deleteTemplate(args[1]);
	}
});
globalThis.spellTemplateManager = spellTemplateManager;
