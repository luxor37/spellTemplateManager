import * as patches from './UIPatches.js';
import * as stmUtils from './stmUtils.js';
import {registerSpellTemplateManagerSettings} from './settings.js';
import * as textures from './textures.js';


export class stmHooks{
    static hooksLoaded = false;
    static setHooks(){
        
        Hooks.once("init", () => {
            if((!game.system.id == "dnd5e") && (!game.system.id == "pf2e")){
                ui.notifications.notify('SpellTemplateManager is only compatible with the DnD5E and PF2E game systems.', "error");
            }	
            spellTemplateManager.currentSettings = registerSpellTemplateManagerSettings(game.system.data.name,spellTemplateManager.currentStatus,spellTemplateManager.currentSettings,spellTemplateManager.currentData);
            spellTemplateManager.currentData.system = game.system.data.name; 
            async function newHover(wrapped, ...args) {
                return true;
            }
            libWrapper.register("spellTemplateManager", "CONFIG.MeasuredTemplate.objectClass.prototype._canHover", newHover);

        });
        
        Hooks.once('ready', () => {
            try{window.Ardittristan.ColorSetting.tester} catch {
                ui.notifications.notify('Please make sure you have the "lib - ColorSettings" module installed and enabled.', "error");
            }
            stmHooks.hooksLoaded = true;
        });
        
        Hooks.on("renderItemSheet", (...args) => {patches.patchItemSheet(args)});
        
        Hooks.on("renderAbilityUseDialog", (...args) => {spellTemplateManager.currentData = patches.patchAbilityUseDialog(args);console.debug("Spell Template Manager | CurrentData post lookup: ",spellTemplateManager.currentData)});
           
        
        Hooks.on("createMeasuredTemplate", (...args) => {
            console.debug("Spell Template Manager | Creating Measured Template",args);
            if(game.userId == args[2]){
                stmUtils.evaluateTemplate(args[0],args[1],args[2]);
                if(args[0].data?.flags.spellTemplateManager?.stmData?.useTexture && (args[0].data?.flags.spellTemplateManager?.stmData?.spellTexture != "")){
                    let attempts = 0;
                    let mysi = setInterval(
                    function(){
                        spellTemplateManager.curentStatus.ApplyTextureComplete = false;
                        if(!spellTemplateManager.currentStatus.ApplyTextureComplete && attempts < 20){
                            attempts++;
                            textures.applyTexture(args,mysi);                            
                        }else{
                            clearInterval(mysi);
                        }
                    });	
                }
            }	
        });
        
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
            if(args[0] == "spellTemplateManager" && spellTemplateManager.currentSettings.usingAT){
                stmUtils.deleteTemplate(args[1]);
            }
        });
        
        Hooks.on("preCreateChatMessage",(...args) => {
            if(spellTemplateManager.currentSettings.system == "pf2e"){
                stmUtils.parseChatMessage2(args);
            }
        });
        
        Hooks.on("deleteMeasuredTemplate",e=>{spellTemplateManager.currentTT?.remove();});
        Hooks.on("hoverMeasuredTemplate",e=>{
            let sourceTemplate = stmUtils.getSourceTemplate(e.data._id);
            let placeable = stmUtils.getPlaceableTemplate(e.data._id);
            let mx = e.x;
            let my = e.y;
            mx += 30;
            my -= 30;
            let ttplayer = game.actors.get(sourceTemplate.data.flags.spellTemplateManager?.actor)?.name??(game.users.get(sourceTemplate.data.user)?.name??"Unknown");
            let ttspell = sourceTemplate.data.flags.spellTemplateManager?.spell??"???"
            let ttduration = "";
            
            if(spellTemplateManager.currentSettings.usingAT){
                let ttbd = (sourceTemplate.data.flags.spellTemplateManager?.birthday)??0;
                let tttr = "Unknown";//time remaining
                let ttod = (sourceTemplate.data.flags.spellTemplateManager?.duration)??0;
                if(ttbd > 0){
                    tttr = (ttod + ttbd - game.Gametime.DTNow()._timestamp);
                }
                ttduration = "Remaining: "+(tttr)+" seconds";
                
            }else{
                ttduration = '<span style="font-weight:500;">Remaining: </span>' + ((sourceTemplate.data.flags.spellTemplateManager?.duration)??"Unknown") + " seconds";
            }
            let scale = document.getElementById("hud").style.transform.substring(6,document.getElementById("hud").style.transform.length-1);
            if(e._hover){
                if(spellTemplateManager.currentTT == undefined){
                    spellTemplateManager.currentTT = document.createElement("DIV");
                }
                spellTemplateManager.currentTT.innerHTML = '<table style="border:0px;padding:0px;margin:0px;border-collapse: collapse;"><tr style="font-weight:bold;font-size:115%"><td>'+ttplayer+'</td></tr><tr style="font-weight:500"><td>'+ttspell+'</td></tr><tr><td>'+ttduration+'</</td></tr></table>';
                spellTemplateManager.currentTT.setAttribute("id", "spell-template-manager-tooltip");
                spellTemplateManager.currentTT.style.position = "absolute";
                spellTemplateManager.currentTT.style.borderColor = "black";
                spellTemplateManager.currentTT.style.borderWidth = "2px";
                spellTemplateManager.currentTT.style.borderStyle = "solid";
                spellTemplateManager.currentTT.style.backgroundColor = "white";
                spellTemplateManager.currentTT.style.borderRadius = "5px";
                spellTemplateManager.currentTT.style.padding = "5px";
                spellTemplateManager.currentTT.style.left = (mx+"px");
                spellTemplateManager.currentTT.style.visibility = "visible";
                spellTemplateManager.currentTT.style.left = (placeable.worldTransform.tx+(placeable.controlIcon.width*scale/2)+10+"px");
                spellTemplateManager.currentTT.style.top = (placeable.worldTransform.ty-(placeable.controlIcon.width*scale/2)+"px");
                document.body.appendChild(spellTemplateManager.currentTT);
                
            }else{
                spellTemplateManager.currentTT?.remove();
            }
        });
        
        Hooks.on("canvasReady",e=> {
            let placeables = game.canvas.templates.placeables;
            let mysi = setInterval(
            function(){
                try{
                    if(placeables != undefined){
                        clearInterval(mysi);
                        console.debug("Spell Temlate Manager | Applying textures post-reload")
                        for(let i = 0; i < placeables.length; i++){
                            console.debug("Spell Template Manager | Now applying to: ",placeables[i]);
                            if(placeables[i].data.flags.spellTemplateManager != undefined){
                                textures.reapplyTexture(placeables[i]);		
                            }
                        }
                    }else{
                        console.debug("Spell Template Manager | Placeables not ready!");
                    }
                }catch (e){}
            },300);
        });
        
        Hooks.on("updateMeasuredTemplate",async (e)=> {
            console.log("Spell Template Manager | updating template!",e);
            if(e.data.flags.spellTemplateManager?.useTexture == "checked" || e.data.flags.spellTemplateManager.stmData.useTexture){
                console.log("Spell Template Manager | Trying to apply texture!");
                let placeable = stmUtils.getPlaceableTemplate(e.id);
                textures.reapplyTexture(placeable);		
            }
        });
        
        Hooks.on("renderMeasuredTemplateConfig", (app, html) =>{
            let addHeight = html.find('button[type="submit"]')[0].offsetHeight;
            let currentHeight = html.height();
            html[0].style.height=`${addHeight+currentHeight}px`;
            let template = app.object;
            let duration = template.getFlag("spellTemplateManager","duration")??"";
            html.find('button[type="submit"]')[0].insertAdjacentHTML('beforebegin', `<div class="form-group"><label>Duration (Seconds)</label><input type="number" style="float:right;" name="spell.template.duration" min="1" value="${duration}"></div>`);
            
            $('input[name="spell.template.duration"]')[0].onchange = (event) => {
                let duration = (0+event.target.valueAsNumber);
                if(typeof duration == 'number' && isFinite(duration)){
                    stmUtils.updateTemplate(game.scenes.viewed,app.object,"",false,true,0,duration);
                }
            }
        });
        console.log("Spell Template Manager | Hooks loaded.");
    }
}
