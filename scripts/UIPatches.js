import {stmData} from './stmData.js';
import * as stmUtils from './stmUtils.js';

export function patchItemSheet(args){

    let app = args[0];
    let html = args[1];


    const template_types = ["cone", "circle", "rect", "ray"];
    let add = "";
    switch(spellTemplateManager.currentSettings.system){
        case "dnd5e":
            add = ".tab.details";
            break;
        case "pf2e":
            add = ".tab.item-details";
            break;
    }
    if(!["spell","feat"].includes(app.object.type) && (!template_types.includes(app.object.data.data?.target?.type) || !template_types.includes(app.object.data.spellInfo?.area?.areaType))) return;
    let itemData = new stmData(app.object.getFlag("spellTemplateManager","stmData"));
    console.log("First Data: ",itemData);
    if(itemData == undefined || Object.keys(itemData).length === 0){
        console.debug("No Item Data");
        let tempData = {
            ignoreDuration:app.object.getFlag("spellTemplateManager","ïgnore-duration")??false,
            spellTexture:app.object.getFlag("spellTemplateManager","texture")??"",
            useTexture:app.object.getFlag("spellTemplateManager","useTexture")??false,
            alpha:app.object.getFlag("spellTemplateManager","alpha")??50,
            coneOrigin:app.object.getFlag("spellTemplateManager","coneOrigin")??1,
            loopAnimations:app.object.getFlag("spellTemplateManager","loopAnimations")??true
        }
        itemData = new stmData(tempData);
        app.object.setFlag("spellTemplateManager","stmData",itemData);        
        app.object.unsetFlag("spellTemplateManager","ignore-duration");
        app.object.unsetFlag("spellTemplateManager","texture");
        app.object.unsetFlag("spellTemplateManager","üseTexture");
        app.object.unsetFlag("spellTemplateManager","alpha");
        app.object.unsetFlag("spellTemplateManager","coneOrigin");
        app.object.unsetFlag("spellTemplateManager","loopAnimations");
    }
    console.debug("Item Data: ", itemData);
    let ignoreDuration = itemData.getIgnoreDuration()??false;
    let spellTexture = itemData.getSpellTexture()??"";
    let useTexture = itemData.getUseTexture()??false;
    let alpha = itemData.getAlpha()??50;
    let coneOrigin = itemData.getConeOrigin()??1;
    let loopAnimations = itemData.getLoopAnimations()??true;
    console.debug("Spell Template Manager | Loaded Use Texture: ",useTexture);
    console.debug("Spell Template Manager | Loaded Loop Animations: ",loopAnimations);
    
    html.find(add).append(`		
        <h3 class="form-header">Templates</h3>
        <div class="form-group">
            <label>
                Ignore Spell Duration (Remove Immediately)				
            </label>
            <input type="checkbox" style="float:right;" name="spell.template.removal" ${ignoreDuration?"checked":""}>
        </div>
    `);
    
    html.find(add).append(`		
        <div class="form-group">
            <label>
            Use Spell Texture				
            </label>
            <input type="checkbox" style="float:right;" name="spell.template.useTexture" ${useTexture?"checked":""}>
        </div>
    `);
    
    html.find(add).append(`
        <div class="form-group">
            <label class="textureSelect" style="float:left;">Texture <input type="text" size="10" style="width: 65%;" name="spell.template.texture.text" value=${spellTexture}  >
                <input type="button" name="spell.template.texture.bttn" value="Select" style="width: 20%; text-align: center;">
            </label>
        </div>
    `);

    html.find(add).append(`		
        <div class="form-group">
            <label>
            Alpha (Opacity)%				
            </label>
            <input type="number" style="float:right;" name="spell.template.alpha" min="10" max="100" value="${alpha}" >
        </div>
    `);

    html.find(add).append(`		
    <div class="form-group">
        <label>
        Loop animations				
        </label>
        <input type="checkbox" style="float:right;" name="spell.template.loop.animations" ${loopAnimations?"checked":""}>
    </div>
    `);

    if(app.object.data.data?.target?.type == "cone" || app.object.data.spellInfo?.area?.areaType == "cone"){
        html.find(add).append(`		
        <div class="form-group">
            <label>
            Cone texture Origin				
            </label><select name="spell.template.cone.origin">
                <option value="Center" ${coneOrigin==0?"selected":""}>Center</option>
                <option value="Left" ${coneOrigin==1?"selected":""}>Left</option>
                <option value="Right" ${coneOrigin==2?"selected":""}>Right</option>
                <option value="Top" ${coneOrigin==3?"selected":""}>Top</option>
                <option value="Bottom" ${coneOrigin==4?"selected":""}>Bottom</option>
            </select>
        </div>
        `);	
    }

    $('input[name="spell.template.removal"]')[0].onchange = (event) => {
        ignoreDuration = event.target.checked ? true : false;
        app.object.setFlag("spellTemplateManager", "stmData", (new stmData(app.object.getFlag("spellTemplateManager","stmData"))).setIgnoreDuration(ignoreDuration));
    }
    
    $('input[name="spell.template.useTexture"]')[0].onchange = (event) => {
        useTexture = event.target.checked ? true : false;
        app.object.setFlag("spellTemplateManager", "stmData", (new stmData(app.object.getFlag("spellTemplateManager","stmData"))).setUseTexture(useTexture));
        console.debug("Spell Template Manager | useTexture set to: ",useTexture);
    }

    $('input[name="spell.template.alpha"]')[0].onchange = (event) => {
        alpha = (0+event.target.valueAsNumber);
        if(typeof alpha == 'number' && isFinite(alpha)){
            if(alpha <= 100 && alpha >= 0){
                app.object.setFlag("spellTemplateManager", "stmData", (new stmData(app.object.getFlag("spellTemplateManager","stmData"))).setAlpha(+alpha));
            }
        }
    }

    $('input[name="spell.template.texture.text"]')[0].onchange = (event) => {
        spellTexture = event.target.value;
        app.object.setFlag("spellTemplateManager", "stmData", (new stmData(app.object.getFlag("spellTemplateManager","stmData"))).setSpellTexture(spellTexture));
    }		

    let mfpoptions = {
        type:"imagevideo",
        current:spellTexture, 
        callback: async (...args)=>{
            app.object.setFlag("spellTemplateManager", "stmData", (new stmData(app.object.getFlag("spellTemplateManager","stmData"))).setSpellTexture(args[0]));
            $('input[name="spell.template.texture.text"]')[0].value=args[0];
        },
        allowUpload:true
    };

    $('input[name="spell.template.texture.bttn"]')[0].onclick = (event) => {
        let mfp = new FilePicker(mfpoptions);
        mfp.render();
    }

    if(app.object.data.data?.target?.type == "cone" || app.object.data.spellInfo?.area?.areaType == "cone"){
        $('select[name="spell.template.cone.origin"]')[0].onchange = (event) => {
            coneOrigin = event.target.selectedIndex;
            app.object.setFlag("spellTemplateManager", "stmData", (new stmData(app.object.getFlag("spellTemplateManager","stmData"))).setConeOrigin(coneOrigin));
        }
    }

    $('input[name="spell.template.loop.animations"]')[0].onchange = (event) => {
        loopAnimations = event.target.checked ? true : false;
        app.object.setFlag("spellTemplateManager", "stmData", (new stmData(app.object.getFlag("spellTemplateManager","stmData"))).setLoopAnimations(loopAnimations));
        console.debug("Spell Template Manager | loopAnimations set to: ",loopAnimations);
    }
}

export function patchAbilityUseDialog(args){
    console.debug("Patches args: ",args);
   let dialog = args[0];
   let html = args[1];
            
    if(spellTemplateManager.currentSettings.system == "dnd5e"){	    
        console.log("Spell Template Manager | Ability Use Dialog Capture");
        document.getElementsByClassName("dialog-button")[0].addEventListener("click",
            async () => {
                console.debug("Spell Template Manager | Dialog: ", dialog);
                if(["spell","feat"].includes(dialog.item.type) && (dialog.item.data.data.uses.value <= dialog.item.data.data.uses.max)){
                    let stmData = stmUtils.getData(dialog,html);
                    console.debug("Spell Template Manager | Current Data: ",stmData);
                    spellTemplateManager.currentData = stmData;
                    return stmData;
                }else{
                    console.debug("Spell Template Manager | Unknown Ability Type: ",dialog.item.type);
                    spellTemplateManager.currentData = undefined;
                    return undefined;
                }
            }
        );
    }	        
}
