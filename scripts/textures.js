import * as stmUtils from './stmUtils.js';
import { stmData } from './STMData.js';

export async function applyTexture(args,mysi){
    if(args[0].data.flags.spellTemplateManager != undefined){
        let placeable = stmUtils.getPlaceableTemplate(args[0].data.flags.spellTemplateManager?.item);
        if(placeable != undefined){
            spellTemplateManager.currentStatus.ApplyTextureComplete = true;
            try{
                clearInterval(mysi);
            }catch{}
            let scale = 1;

            let originalActor,originalItem,originalStmData;
            
            console.debug("Spell Template Manager | Moment of truth: ", placeable);

            if(placeable.data.flags.spellTemplateManager?.stmData == undefined){
                originalActor = game.actors.get(args[0].data.flags.spellTemplateManager?.actor);
                originalItem = args[0].data.flags.spellTemplateManager.item;
                originalStmData = stmUtils.generateStmData(originalActor,originalItem);
                
                console.debug("Texture stuff: ",originalActor,originalItem,originalStmData);
            }else{
                originalStmData = placeable.data.flags.spellTemplateManager.stmData;
            }

            writeTexture(placeable,originalStmData);        

        }
    }
}

export async function reapplyTexture(placeable){
    placeable.sortDirty=true;
    placeable.sortChildren();
    let child = placeable.children[0];
    while(child.zIndex == -1000){
        placeable.removeChild(child);
        child = placeable.children[0];
    }
    let scale = 1;
    let originalStmData = placeable.data.flags.spellTemplateManager.stmData;
    console.debug("Reapply STM Data!",originalStmData);
    if(("" != (originalStmData?.useTexture??"")) && "" != (originalStmData?.spellTexture??"")){
        writeTexture(placeable,originalStmData);
    }        
}

async function writeTexture(placeable,stmDataObj){
    let originalStmData = new stmData(stmDataObj);
    console.log("writeTexture STMData: ",originalStmData)
    if(("" != (originalStmData.getUseTexture()??"")) && "" != (originalStmData.getSpellTexture()??"")){

        let STMtexture = undefined;	
        let textureSize = undefined;
        let sprite = undefined;
        let masker = undefined;
        let mask = undefined;
        let icon = undefined;
        let source = undefined;
        let workingWidth = undefined;
        let container = undefined;
        let scale = 1;
        switch(placeable.data.t){
            case "circle":
                console.debug("CIRCLE TEXTURE");
                if(STMtexture == undefined){
                    STMtexture = await loadTexture(originalStmData.getSpellTexture()+"?id="+placeable.id);
                    textureSize = placeable.height;
                    STMtexture.orig = { height: (textureSize * scale), width: textureSize * scale, x: -textureSize, y: -textureSize };
                    spellTemplateManager.textureMap.set(originalStmData.getSpellTexture(),STMtexture);
                }
                sprite = new PIXI.Sprite(STMtexture);
                sprite.anchor.set(0.5);
                sprite.alpha = originalStmData.getAlpha()/100
                icon = await placeable.addChild(sprite);
                source = getProperty(icon._texture, "baseTexture.resource.source");
                if (source && (source.tagName === "VIDEO")) {
                    source.loop = originalStmData.getLoopAnimations();
                    source.muted = true;
                    game.video.play(source);
                }
                icon.zIndex = -1000;
                masker = new PIXI.Graphics();
                masker.beginFill(0xFF0000, 1);
                masker.lineStyle(0);
                masker.drawCircle(0, 0, placeable.ray.distance);
                masker.endFill();
                masker.zIndex = -1000;
                mask = await placeable.addChild(masker);
                sprite.mask=masker;
                break;
            case "cone":
                {
                    switch(originalStmData.getConeOrigin()){
                        case 0:
                        default:
                            if(STMtexture == undefined){
                                STMtexture = await loadTexture(originalStmData.getSpellTexture()+"?id="+placeable.id);
                                workingWidth =  placeable.ray._distance;
                                textureSize = workingWidth * 2;
                                STMtexture.orig = { height: (textureSize * scale), width: textureSize * scale, x: -textureSize, y: -textureSize };
                                spellTemplateManager.textureMap.set(originalStmData.getSpellTexture(),STMtexture);
                            }
                            sprite = new PIXI.Sprite(STMtexture);
                            sprite.anchor.set(0.5);
                            sprite.alpha = originalStmData.getAlpha()/100
                            sprite.angle = placeable.data.direction;
                            icon = await placeable.addChild(sprite);
                            source = getProperty(icon._texture, "baseTexture.resource.source");
                            if (source && (source.tagName === "VIDEO")) {
                                source.loop = originalStmData.getLoopAnimations();
                                source.muted = true;
                                game.video.play(source);
                            }
                            icon.zIndex = -1000;
                            masker = new PIXI.Graphics();
                            masker.beginFill(0x00FF00);
                            masker.lineStyle(1, 0xFFFF00);
                            masker.moveTo(0, 0);
                            masker.arc(0, 0, workingWidth, (Math.PI/180*placeable.data.direction) - Math.PI/180/2*placeable.data.angle, (Math.PI/180*placeable.data.direction) + Math.PI/180/2*placeable.data.angle, false);
                            masker.lineTo(0, 0);
                            masker.endFill();
                            masker.zIndex = -1000;
                            placeable.addChild(masker);
                            sprite.mask=masker;
                            break;
                        case 1:											
                            if(STMtexture == undefined){
                                STMtexture = await loadTexture(originalStmData.getSpellTexture()+"?id="+placeable.id);
                                spellTemplateManager.textureMap.set(originalStmData.getSpellTexture(),STMtexture);
                            }
                            workingWidth =  placeable.ray._distance;
                            textureSize = placeable.data.height * canvas.grid.size;
                            sprite = new PIXI.Sprite(STMtexture)
                            sprite.anchor.set(0,0.5)
                            sprite.width=workingWidth;
                            sprite.height=Math.sqrt((workingWidth**2)+(workingWidth**2));
                            sprite.alpha = originalStmData.getAlpha()/100;
                            sprite.angle = placeable.data.direction;
                            icon = await placeable.addChild(sprite)
                            source = getProperty(icon._texture, "baseTexture.resource.source");
                            if (source && (source.tagName === "VIDEO")) {
                                source.loop = originalStmData.getLoopAnimations();
                                source.muted = true;
                                game.video.play(source);
                            }
                            icon.zIndex = -1000;
                            masker = new PIXI.Graphics();
                            masker.beginFill(0x00FF00);
                            masker.lineStyle(1, 0xFFFF00);
                            masker.moveTo(0, 0);
                            masker.arc(0, 0, workingWidth, (Math.PI/180*placeable.data.direction) - Math.PI/180/2*placeable.data.angle, (Math.PI/180*placeable.data.direction) + Math.PI/180/2*placeable.data.angle, false);
                            masker.lineTo(0, 0);
                            masker.endFill();
                            masker.zIndex = -1000;
                            placeable.addChild(masker);
                            sprite.mask=masker;
                            break;
                        case 2:														
                            if(STMtexture == undefined){
                                STMtexture = await loadTexture(originalStmData.getSpellTexture()+"?id="+placeable.id);
                                spellTemplateManager.textureMap.set(originalStmData.getSpellTexture(),STMtexture);
                            }
                            workingWidth =  placeable.ray._distance;
                            textureSize = placeable.data.height * canvas.grid.size;
                            sprite = new PIXI.Sprite(STMtexture)
                            sprite.anchor.set(1,0.5)
                            sprite.width=workingWidth*-1;
                            sprite.height=Math.sqrt((workingWidth**2)+(workingWidth**2));
                            sprite.alpha = originalStmData.getAlpha()/100;
                            sprite.angle = placeable.data.direction;
                            icon = await placeable.addChild(sprite)
                            source = getProperty(icon._texture, "baseTexture.resource.source");
                            if (source && (source.tagName === "VIDEO")) {
                                source.loop = originalStmData.getLoopAnimations();
                                source.muted = true;
                                game.video.play(source);
                            }
                            icon.zIndex = -1000;
                            masker = new PIXI.Graphics();
                                masker.beginFill(0x00FF00);
                                masker.lineStyle(1, 0xFFFF00);
                                masker.moveTo(0, 0);
                                masker.arc(0, 0, workingWidth, (Math.PI/180*placeable.data.direction) - Math.PI/180/2*placeable.data.angle, (Math.PI/180*placeable.data.direction) + Math.PI/180/2*placeable.data.angle, false);
                                masker.lineTo(0, 0);
                                masker.endFill();
                                masker.zIndex = -1000;
                                placeable.addChild(masker);
                                sprite.mask=masker;									
                                break;
                        case 3:								
                            if(STMtexture == undefined){
                                STMtexture = await loadTexture(originalStmData.getSpellTexture()+"?id="+placeable.id);
                                spellTemplateManager.textureMap.set(originalStmData.getSpellTexture(),STMtexture);
                            }
                            workingWidth =  placeable.ray._distance;
                            textureSize = placeable.data.height * canvas.grid.size;
                            container = new PIXI.Container;
                            container.zIndex = -1000;
                            sprite = new PIXI.Sprite(STMtexture)
                            container.pivot.x = 0.5;
                            container.pivot.y = 0.5;
                            sprite.width=Math.sqrt((workingWidth**2)+(workingWidth**2));
                            sprite.anchor.set(0.5,0.5);
                            sprite.angle=-90;
                            sprite.height=workingWidth;
                            sprite.alpha = originalStmData.getAlpha()/100;
                            sprite.x=sprite.height/2;
                            container.angle = placeable.data.direction;
                            icon = await container.addChild(sprite)
                            await placeable.addChild(container);
                            
                            source = getProperty(icon._texture, "baseTexture.resource.source");
                            if (source && (source.tagName === "VIDEO")) {
                                source.loop = originalStmData.getLoopAnimations();
                                source.muted = true;
                                game.video.play(source);
                            }
                            icon.zIndex = -1000;
                            masker = new PIXI.Graphics();
                            masker.beginFill(0x00FF00);
                            masker.lineStyle(1, 0xFFFF00);
                            masker.moveTo(0, 0);
                            masker.arc(0, 0, workingWidth, 0 - Math.PI/180/2*placeable.data.angle, 0 + Math.PI/180/2*placeable.data.angle, false);
                            masker.lineTo(0, 0);
                            masker.endFill();
                            masker.zIndex = -1000;
                            container.addChild(masker);
                            sprite.mask=masker;
                            break;
                        case 4:					
                                if(STMtexture == undefined){
                                    STMtexture = await loadTexture(originalStmData.getSpellTexture()+"?id="+placeable.id);
                                    spellTemplateManager.textureMap.set(originalStmData.getSpellTexture(),STMtexture);
                                }
                                workingWidth =  placeable.ray._distance;
                                textureSize = placeable.data.height * canvas.grid.size;
                                container = new PIXI.Container;
                                container.zIndex = -1000;
                                sprite = new PIXI.Sprite(STMtexture)
                                container.pivot.x = 0.5;
                                container.pivot.y = 0.5;
                                sprite.width=Math.sqrt((workingWidth**2)+(workingWidth**2));
                                sprite.anchor.set(0.5,0.5);
                                sprite.angle=90;
                                sprite.height=workingWidth;
                                sprite.alpha = originalStmData.getAlpha()/100;
                                sprite.x=sprite.height/2;
                                container.angle = placeable.data.direction;
                                icon = await container.addChild(sprite)
                                await placeable.addChild(container);
                                
                                source = getProperty(icon._texture, "baseTexture.resource.source");
                                if (source && (source.tagName === "VIDEO")) {
                                    source.loop = originalStmData.getLoopAnimations();
                                    source.muted = true;
                                    game.video.play(source);
                                }
                                icon.zIndex = -1000;
                                masker = new PIXI.Graphics();
                                masker.beginFill(0x00FF00);
                                masker.lineStyle(1, 0xFFFF00);
                                masker.moveTo(0, 0);
                                masker.arc(0, 0, workingWidth, 0 - Math.PI/180/2*placeable.data.angle, 0 + Math.PI/180/2*placeable.data.angle, false);
                                masker.lineTo(0, 0);
                                masker.endFill();
                                masker.zIndex = -1000;
                                container.addChild(masker);
                                sprite.mask=masker;
                                break;
                    }
                }
                break;


            case "rect":
                    if(STMtexture == undefined){
                    STMtexture = await loadTexture(originalStmData.getSpellTexture()+"?id="+placeable.id);
                    spellTemplateManager.textureMap.set(originalStmData.getSpellTexture(),STMtexture);
                }
                workingWidth =  placeable.ray._distance;
                sprite = new PIXI.Sprite(STMtexture)
                sprite.anchor.set(0,0)
                sprite.width=Math.floor((placeable.shape.width)/35)*35;
                sprite.height=Math.floor((placeable.shape.height)/35)*35;
                sprite.alpha = originalStmData.getAlpha()/100;
                icon = await placeable.addChild(sprite)
                await icon.position.set(
                    (placeable.shape.left == 0)?0:(-sprite.width),
                    (placeable.shape.top == 0)?0:(-sprite.height)
                )
                source = getProperty(icon._texture, "baseTexture.resource.source");
                if (source && (source.tagName === "VIDEO")) {
                    source.loop = originalStmData.getLoopAnimations();
                    source.muted = true;
                    game.video.play(source);
                }
                icon.zIndex = -1000;
                break;
            default:
                if(STMtexture == undefined){
                    STMtexture = await loadTexture(originalStmData.getSpellTexture()+"?id="+placeable.id);
                    spellTemplateManager.textureMap.set(originalStmData.getSpellTexture(),STMtexture);
                }
                sprite = new PIXI.Sprite(STMtexture)
                sprite.height=placeable.data.width*game.canvas.grid.size/5;
                sprite.width=placeable.data.distance*game.canvas.grid.size/5;
                sprite.y=0;
                sprite.anchor.set(0,0.5);
                sprite.rotation=placeable.ray.normAngle;
                sprite.alpha = originalStmData.getAlpha()/100;
                icon = await placeable.addChild(sprite);
                source = getProperty(icon._texture, "baseTexture.resource.source");
                if (source && (source.tagName === "VIDEO")) {
                    source.loop = originalStmData.getLoopAnimations();
                    source.muted = true;
                    game.video.play(source);
                }
                icon.zIndex = -1000;
                break;

        }
    }
}