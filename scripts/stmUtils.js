import { stmData } from './stmData.js';
import * as UI from './UI.js';
import * as stmUtils from './stmUtils.js';

export function getSourceTemplate(id){
    let templateI = undefined
    game.scenes.forEach( i => {
        let templateJ = undefined;
        i.templates.forEach(j => {
            if(id == j.id){
                templateJ = j;
            }
        });
        if(templateJ != undefined){
            templateI = templateJ;
        }
    });
    return templateI;		
}

export function getDuration(stmData, instantaneousSpellFade,roundSeconds){
    console.debug("Spell Template Manager | Duration Args: ", stmData,instantaneousSpellFade,roundSeconds);
    let value = stmData.item.data.data.duration.value;
    let units = stmData.item.data.data.duration.units;
    if(!stmData.ignoreDuration){
        console.debug("Do not ignore duration");
        switch(units) {
            case "day":
                stmData.duration = value * 10 * 60 * 24 * roundSeconds;
                break;
            case "hour":
                stmData.duration = value * 10 * 60 * roundSeconds;
                break;
            case "inst":
                stmData.duration = instantaneousSpellFade * roundSeconds;
                break;
            case "minute":
            case "minutes":
                stmData.duration = value * 10 * roundSeconds;
                break;
            case "round":
                stmData.duration = value * roundSeconds;
                break;
            case "spec":
            case "unti":
                stmData.duration = -1;
                break;
            default:
                stmData.duration = -1;
        }
    }else{
        stmData.duration=instantaneousSpellFade * roundSeconds;
    }
    console.debug("Spell Template Manager | Spell duration in seconds is ", stmData.duration);
    return stmData;
}

export function getData(dialog,html){
    let instantaneousSpellFade = spellTemplateManager.currentSettings.instantaneousSpellFade;
    let roundSeconds = spellTemplateManager.currentSettings.roundSeconds;
    console.log("Spell Template Manager | Collecting Item Data: ",dialog.item);
    let stmData = {
        item : dialog.item,
        actor : dialog.item.actor,
        scene : game.scenes.viewed.id,
        player : game.userId,
        spell : dialog.item.name,
        ignoreDuration : dialog.item.data.flags.spellTemplateManager?.stmData?.ignoreDuration??false,
        duration: undefined
    };
    if(stmData.item !== undefined){ console.debug("Spell Template Manager | determining spell duration");return getDuration(stmData,instantaneousSpellFade,roundSeconds); } else { return undefined;}
}

export async function deleteAllTemplates(){
    console.log("Spell Template Manager | Cleaning All Templates");
    let scenes = game.scenes;
    scenes.forEach(scene => {

        let templates = undefined;
        templates = scene.data.templates;
        if(templates !== undefined) {
            let deletions = templates.map(i => i.id);
            let updated = scene.deleteEmbeddedDocuments("MeasuredTemplate",deletions);					
        }else{
            console.log("Spell Template Manager | Nothing to delete!");
        }
    });
}

export function getPlaceableTemplate(templateID){
    let placeable = undefined;
    for(let i = game.canvas.templates.placeables.length -1; i > -1; i--){
        if (game.canvas.templates.placeables[i].data.flags.spellTemplateManager?.item == templateID || game.canvas.templates.placeables[i].data._id == templateID){
            placeable = game.canvas.templates.placeables[i];
            return placeable;
        }
    }		
    return placeable;
}

export async function deleteTemplate(templateId){
    console.log("Spell Template Manager | Deleting Template: ", templateId);
    game.scenes.forEach(scene => {
        if(game.user.isGM){
            setTimeout( () => {
                let templates = scene.data.templates.filter(i => (i.id == templateId && game.userId == i.author.id));
                let deletions = templates.map(i => i.id);
                let updated = scene.deleteEmbeddedDocuments("MeasuredTemplate",deletions);
            },500);
        }else{
            let templates = scene.data.templates.filter(i => (i.id == templateId && game.userId == i.author.id));
            let deletions = templates.map(i => i.id);
            let updated = scene.deleteEmbeddedDocuments("MeasuredTemplate",deletions);
        }
    });
}

export async function resetTemplateBorders(){		
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

export async function cleanupTemplates(Combat){
    console.log("Spell Template Manager | Cleaning Templates: ", Combat.combatant.actor.id);
    let scene=Combat.scene;
    let prefilter = scene.data.templates.filter(i => i.data.flags.spellTemplateManager !== undefined);
    let templates = prefilter.filter(
        function(i){
            
            return (
                (i.data.flags.spellTemplateManager.actor === Combat.combatant.actor.id || i.data.flags.spellTemplateManager.actor === undefined) && 
                (i.data.flags.spellTemplateManager.duration < 1 || i.data.flags.spellTemplateManager.duration === undefined) &&
                (!i.data.flags.spellTemplateManager.special || i.data.flags.spellTemplateManager.special === undefined)
            );
        }
    );
    let deletions = templates.map(i => i.id);
    await scene.deleteEmbeddedDocuments("MeasuredTemplate",deletions);
    console.debug("Spell Template Manager | Cleaning Templates Completed");
}

export function createATEvents(){
    console.log("Spell Template Manager | Creating About Time notification events");
    game.scenes.forEach(i => {i.data.templates.forEach(j => {
        

        let update = {};
        update = {_id: j.id, flags: {
                "spellTemplateManager":{
                    bd: game.Gametime.ElapsedTime.currentTimeSeconds()
                }
            }
        };
        let updated = i.updateEmbeddedDocuments("MeasuredTemplate", [update]);


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
            try{
                let newDuration = j.data.flags.spellTemplateManager.duration * game.settings.get("about-time", "seconds-per-round");
                console.debug("Spell Template Manager | Creating Notify Event for template ", j.id, " in ", newDuration, " seconds."); 
                game.Gametime.notifyIn({seconds: newDuration},"spellTemplateManager",j.id);
            }catch{
                console.debug("Spell Template Manager | Could not create notify event for template ", j.id);
            }			
        }
    })});
}

export async function ageTemplates(Combat){
    console.log("Spell Template Manager | Aging templates for ", Combat.combatant.actor.name);
    let controlling = Combat.scene.data.templates.filter(i => i.data.flags.spellTemplateManager !== undefined);
    console.debug("Controlling: ",controlling);
    console.debug("Combat Actor: ",Combat.combatant.actor.id);
    let aging = controlling.filter(i => i.data.flags.spellTemplateManager.actor === Combat.combatant.actor.id);
    console.debug("Aging: ",aging);
    for(let i = 0; i < aging.length; i++){
            console.debug("Template: ",i.id);
            console.debug("Before: ",aging[i].data.flags.spellTemplateManager.duration);
            let update = {_id: aging[i].id, flags: {"spellTemplateManager":{duration: aging[i].data.flags.spellTemplateManager.duration-spellTemplateManager.currentSettings.roundSeconds}}};
            await Combat.scene.updateEmbeddedDocuments("MeasuredTemplate",[update]);
            console.debug("after: ",aging[i].data.flags.spellTemplateManager.duration);
    }
    console.debug("Spell Template Manager | Aging templates done.");
}

export async function manageUnmanaged(Combat,settings,GM=false){
    console.log("Spell Template Manager | Looking for Unmanaged Templates");
    let scene=Combat.scene;
    let turnActor = Combat.combatant?.actor??game.userId;
    if(!turnActor) return;

    let name = turnActor.name;
    let managing = scene.data.templates.filter(i => i.data.flags.spellTemplateManager === undefined && (GM || i.data.user === game.userId));
    for(let i = 0; i < managing.length; i++){
        let action = spellTemplateManager.currentSettings.unmanagedTemplateAction;			
        let response = null;
        if(action === "prompt"){
            await canvas.animatePan({x : managing[i].data.x, y : managing[i].data.y, duration : 250});
            response = await UI.promptForAction(turnActor.name);
        }
        if(action === "delete" || (action==="prompt" && response?.action === "delete")){
            await scene.deleteEmbeddedDocuments("MeasuredTemplate",[managing[i].id]);
        }
        if(action === "claim"){
            await canvas.animatePan({x : managing[i].data.x, y : managing[i].data.y, duration : 250});
            response = await UI.promptForUnits();
        }
        if(action === "claim" || (action === "prompt" && response?.action === "claim")){
                let duration = 0;
                let spellIsSpecial = false;
                switch(response.units) {
                    case "day":
                        duration = response.value * 10 * 60 * 24 * settings.roundSeconds;
                        break;
                    case "hours":
                        duration = response.value * 10 * 60 * settings.roundSeconds;
                        break;
                    case "minutes":
                        duration = response.value * 10 * settings.roundSeconds;
                        break;
                    case "rounds":
                        duration = response.value * settings.roundSeconds;
                        break;
                    case "special":
                        duration = -1;
                        spellIsSpecial = true;
                        break;
                    default:
                        duration = -1;
                        break;
                }
                let update = {_id: managing[i].id, flags: {
                    "spellTemplateManager":{
                        concentration: false, 
                        actor: turnActor.id, 
                        duration: duration,
                        special: spellIsSpecial,
                        scene: Combat.scene.id
                    }
                },borderColor:(game.settings.get('spellTemplateManager', (spellIsSpecial?'specialTemplateColor':'enduringTemplateColor')))};
                await scene.updateEmbeddedDocuments("MeasuredTemplate", [update]);	


                if(game.settings.get('spellTemplateManager','usingAT')){
                    game.Gametime.notifyIn({seconds: (duration==-1?0:duration)},"spellTemplateManager",template.id);
                }
        }
    }
}

export function generateStmData(actor,item){
    console.debug("Spell Template Manager | Generating STM Data");
    let originalActor = actor;
    let originalToken = game.scenes.active.tokens.filter(i=>{return (i.actor.id==originalActor.id)})[0];
    let itemArray = (originalToken?.data.actorData.items??undefined);
    let foundSpell = undefined;
    if(itemArray != undefined){
        for (let i = 0; i < itemArray.length; i++){
            if(itemArray[i]._id == item){
                foundSpell = itemArray[i];
                break;
            }
        }
    }
    let originalSpellTexture = foundSpell?.flags?.spellTemplateManager?.texture;
    originalSpellTexture = originalSpellTexture??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.stmData?.spellTexture;
    originalSpellTexture = originalSpellTexture??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.texture??""
   
    let useTexture = foundSpell?.flags?.spellTemplateManager?.useTexture;
    useTexture = useTexture??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.stmData?.useTexture;
    useTexture = useTexture??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.useTexture=="checked"??false;

    let alpha = foundSpell?.flags?.spellTemplateManager?.alpha;
    alpha = alpha??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.stmData?.alpha;
    alpha = alpha??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.alpha??50;

    let coneOrigin = foundSpell?.flags?.spellTemplateManager?.coneOrigin;
    coneOrigin = coneOrigin??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.stmData?.coneOrigin;
    coneOrigin = coneOrigin??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.coneOrigin??1;

    let loopAnimations = foundSpell?.flags?.spellTemplateManager?.loopAnimations;
    loopAnimations = loopAnimations??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.stmData?.loopAnimations;
    loopAnimations = loopAnimations??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.loopAnimations=="checked"??true;

    let ignoreDuration = foundSpell?.flags?.spellTemplateManager?.ignoreDuration;
    ignoreDuration = ignoreDuration??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.stmData?.ignoreDuration;
    ignoreDuration = ignoreDuration??originalActor.items.get(spellTemplateManager.currentData.item?.id).data.flags.spellTemplateManager?.ignoreDuration=="checked"??false;

    let stmDataTemp = {
        spellTexture:originalSpellTexture,
        useTexture:useTexture,
        alpha:alpha,
        coneOrigin:coneOrigin,
        loopAnimations:loopAnimations,
        ignoreDuration:ignoreDuration                
    }

    console.debug("Precommitted STMDATA: ",stmDataTemp);

    let generatedStmData = new stmData(stmDataTemp);
    return generatedStmData;
}

export function updateTemplate(scene,template,ignoreDuration,isConcentration,isSpecialSpell,index,duration=0){
    console.log("Spell Template Manager | Updating Template");
    let done = false;
    if(index < 10 && !done){
        if(scene.data.templates.filter(i => i.id === template.id).length > 0){
            console.log("Spell Template Manager | Appending data");
            //////////////starting here
            let originalActor = spellTemplateManager.currentData.actor;
            let originalItem = spellTemplateManager.currentData.item;
            console.log(originalActor,originalItem);
            let gottenData = generateStmData(originalActor,originalItem);

            console.debug("Spell Template Manager | GottenData: ",gottenData);

            //////////////////ending here
            let update =  {_id: template.id, flags: {
                "spellTemplateManager":{
                    concentration: isConcentration, 
                    actor:spellTemplateManager.currentData.actor?.data._id, 
                    duration: spellTemplateManager.currentData.duration??duration,
                    special: (isSpecialSpell),
                    scene: scene.id,
                    birthday: spellTemplateManager.currentSettings.usingAT?game.Gametime.ElapsedTime.currentTimeSeconds():undefined,
                    spell: spellTemplateManager.currentData.spell,
                    item: spellTemplateManager.currentData.item?.id,
                    stmData: gottenData
                }
            }};
            

            if(isConcentration){
                update.borderColor = ("#"+(game.settings.get('spellTemplateManager', 'concentrationTemplateColor')).substring(1,7));
            }else if(spellTemplateManager.currentData.duration>0){
                update.borderColor = ("#"+(game.settings.get('spellTemplateManager', 'enduringTemplateColor')).substring(1,7));                
            }else if(isSpecialSpell){
                update.borderColor = ("#"+(game.settings.get('spellTemplateManager', 'specialTemplateColor')).substring(1,7));
            }else{
                update.borderColor = ("#"+(game.settings.get('spellTemplateManager', 'standardTemplateColor')).substring(1,7));
            }

            console.debug("Spell Template Manager | Generated update: ",update);
            scene.updateEmbeddedDocuments("MeasuredTemplate", [update]);
            console.debug("Template Updated");
            if(game.settings.get('spellTemplateManager','usingAT')){
                let roundSeconds = game.settings.get("about-time", "seconds-per-round");	
                let notifyTime = ignoreDuration?(spellTemplateManager.currentSettings.instantaneousSpellFade*roundSeconds):(spellTemplateManager.currentData.duration??duration);
                game.Gametime.notifyIn({seconds: notifyTime},"spellTemplateManager",template.id);
            }
            spellTemplateManager.resetItemData();  
            done = true;
        }else{
            console.debug("Spell Template Manager | Failed to update template.  Retrying. ", index);
            setTimeout(stmUtils.updateTemplate(scene,template,ignoreDuration,isConcentration,isSpecialSpell,index+1), 100);
        }
    }else{
        console.log("Spell Template Manager | Failed to update template.");
        done = true;
    }
    
}	

export async function evaluateTemplate(template,data,userID){
    console.log("Spell Template Manager | Evaluating template");
    console.log("Test: ",template,data,userID);
    if(spellTemplateManager.currentData.item !== undefined){
        let isConcentration = ((game.system.data.name=="dnd5e")?(spellTemplateManager.currentData.item.data.data.components?spellTemplateManager.currentData.item.data.data.components?.concentration:false):false);
        let isSpecial = (spellTemplateManager.currentData.item.data.data.duration.units === "unti" || spellTemplateManager.currentData.item.data.data.duration.units === "spec");
        let ignoreDuration = (spellTemplateManager.currentData.ignoreDuration);
        if(isConcentration && spellTemplateManager.currentSettings.enforceConcentration){
            console.log("Spell Template Manager | New concentration spell.  Clearing actor's previous concentration templates.");
            game.scenes.forEach(scene => {
                console.debug(scene.name);
                let filtertemplates = scene.data.templates;
                console.debug("Filtering for world concentration",spellTemplateManager.currentSettings.worldConcentration);
                filtertemplates = filtertemplates.filter(i => {
                    scene = i.parent; 
                    return (i.data.flags.spellTemplateManager !== undefined)?(spellTemplateManager.currentSettings.worldConcentration?true:(scene.id == game.scenes.viewed.id)):false;
                });
                console.debug(filtertemplates);
                console.debug("Filtering for concentration");
                filtertemplates = filtertemplates.filter(i => {
                        scene = i.parent;					
                        return i.data.flags.spellTemplateManager?.concentration??false;
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
        setTimeout(updateTemplate(game.scenes.viewed,template,ignoreDuration,isConcentration,isSpecial,0), 100);
    }else{
        console.log("Spell Template Manager | Could not find current feature data!  Failing!");
    }
}

export function parseChatMessage2(args){
    console.debug("Spell Template Manager | Parsing chat message");
    if(spellTemplateManager.currentStatus.running){
        spellTemplateManager.currentData.player = game.userId;
        let mmessage = args[0];
        let mcard = args[1];
        let mcontent = mcard.content;
        let duration = 0;
        let units = "";
        let value=0;
        let mitem = undefined;
        let mscene = undefined
        let itemIndex=mcontent.indexOf('data-item-id=');
        let actorIndex=mcontent.indexOf('data-actor-id=');
        let sceneIndex=mcontent.indexOf('data-token-id=');
        let valid = true;
        let mtoken = undefined;
        let itemID = undefined;

            let actorID = mcard.speaker?.actor ?? mcontent.substring(actorIndex+15,actorIndex+15+16);
            spellTemplateManager.currentData.actor = game.actors.get(actorID);
            spellTemplateManager.currentData.scene = ((sceneIndex > -1)?mcontent.substring(sceneIndex+15,sceneIndex+15+16):game.scenes.viewed._id);
            mtoken = ((sceneIndex > -1)?game.scenes.get(spellTemplateManager.currentData.scene).data.tokens.get(mcontent.substring(sceneIndex+15+16+1,sceneIndex+15+16+1+16)):game.scenes.get(spellTemplateManager.currentData.scene).data.tokens.get(mcard.speaker.token));

            switch(mtoken.isLinked || (!mtoken.isLinked && sceneIndex == -1 )){
                case true:
                    itemID = mcontent.substring(itemIndex+14,itemIndex+14+16);
                    spellTemplateManager.currentData.item = spellTemplateManager.currentData.actor.data.items.get(itemID);
                    break;
                case false:
                    itemID = mcontent.substring(itemIndex+14,itemIndex+14+16);
                    spellTemplateManager.currentData.item = {
                        id:itemID,
                        data:mtoken.data.actorData.items.find(element => element._id == itemID),
                        type:mtoken.data.actorData.items.find(element => element._id == itemID).type
                    };
                    break;
            }
        spellTemplateManager.currentData.spell = spellTemplateManager.currentData.item.name;
        if(["spell","feat"].includes(spellTemplateManager.currentData.item.type)){
            console.log("Spell Template Manager | Checking for duration");
            if(spellTemplateManager.currentData.item.data.data.duration?.value=="" || spellTemplateManager.currentData.item.data.data.duration?.value==undefined){
                duration  = spellTemplateManager.currentData.instantaneousSpellFade;
            }else{
                let durationArray = spellTemplateManager.currentData.item.data.data.duration.value.toLowerCase().split(" ");
                if(durationArray.length > 1){
                    value = durationArray[durationArray.length-2];
                    units = durationArray[durationArray.length-1];
                }else{
                    value = 1;
                    units = durationArray[0];
                }
                if(value == "next") value = 1;	
                if(value == "current") value = 0;
                if(String(value).indexOf("d")>-1) value = value.substring(value.indexOf("d")+1,value.length);					
                switch(units) {
                    case "year":
                    case "years":
                        duration = value * 10 * 60 * 24 * 365 * spellTemplateManager.currentSettings.roundSeconds;
                        break;
                    case "week":
                    case "weeks":
                        duration = value * 10 * 60 * 24 * 7 * spellTemplateManager.currentSettings.roundSeconds;
                        break;
                    case "day":
                    case "days":
                        duration = value * 10 * 60 * 24 * spellTemplateManager.currentSettings.roundSeconds;
                        break;
                    case "hour":
                    case "hours":
                        duration  = value * 10 * 60 * spellTemplateManager.currentSettings.roundSeconds;
                        break;
                    case "inst":
                    case "":
                        duration  = spellTemplateManager.currentSettings.instantaneousSpellFade * spellTemplateManager.currentSettings.roundSeconds;
                        break;
                    case "minute":
                    case "minutes":
                    case "minue":
                        duration  = value * 10 * spellTemplateManager.currentSettings.roundSeconds;
                        break;
                    case "round":
                    case "rounds":
                    case "turn":
                    case "turns":
                        duration  = value * spellTemplateManager.currentSettings.roundSeconds;
                        break;
                    case "spec":
                    case "unti":
                    case "until":
                    case "varies":
                    case "sustained":
                    case "unlimited":
                    case "preparations":
                    case "text":
                    case "below)":
                    case "longer)":
                    case "stance":
                    case "dismissed":
                        duration  = -1;
                        break;
                    default:
                        duration = 0;
                }
            }
            if(spellTemplateManager.currentData.item.data.flags.spellTemplateManager?.stmData === undefined){
                spellTemplateManager.currentData.ignoreDuration = false;
            }else{
                spellTemplateManager.currentData.ignoreDuration = (spellTemplateManager.currentData.item.data.flags.spellTemplateManager.stmData.ignoreDuration??false);					
            }
            spellTemplateManager.currentData.duration = (spellTemplateManager.currentData.ignoreDuration?0:duration);
        }else{
            console.debug("Spell Template Manager | Ignoring chat message");
        }
    }else{
        console.debug("Spell Template Manager | Not ready");
    }
}
