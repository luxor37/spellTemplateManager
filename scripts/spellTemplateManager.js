class spellTemplateManager {
	static running = false;
	static currentSystem = undefined;
	static currentItem = undefined;
	static currentActor = undefined;
	static currentPlayer = undefined;
	static currentDurationRounds = undefined;
	static currentScene = undefined;
	static inPUC = false;
	static ApplyTextureComplete = true;
	static capture = undefined;
	static currentException = undefined;
	static usingAT = false;
	static enforceConcentration = true;
	static worldConcentration = true;
	static instantaneousSpellFade = 0;
	static unmanagedTemplateAction = "prompt";
	static currentTT = undefined;
	static currentSpell = undefined
	static textureMap = new Map();
	static initialized = false;

	
	

	static resetItemData(){
		spellTemplateManager.currentItem = undefined;
		spellTemplateManager.currentActor = undefined;
		spellTemplateManager.currentPlayer = undefined;
		spellTemplateManager.currentDurationRounds = undefined;
		spellTemplateManager.currentScene = undefined;
		spellTemplateManager.currentException = undefined;
		spellTemplateManager.currentSpell = undefined;
	}

	static getSourceTemplate(id){
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



	static getDuration(){
		let value = spellTemplateManager.currentItem.data.data.duration.value
		let units = spellTemplateManager.currentItem.data.data.duration.units
		if(!(spellTemplateManager.currentException == "checked")){
			switch(units) {
				case "day":
					spellTemplateManager.currentDurationRounds = value * 10 * 60 * 24;
					break;
				case "hour":
					spellTemplateManager.currentDurationRounds = value * 10 * 60;
					break;
				case "inst":
					spellTemplateManager.currentDurationRounds = spellTemplateManager.instantaneousSpellFade;
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
		}else{
			spellTemplateManager.currentDuration=spellTemplateManager.instantaneousSpellFade;
		}
		console.debug("Spell Template Manager | Spell duration in rounds is ", spellTemplateManager.currentDurationRounds);
	}

	static getData (dialog, html){
		console.log("Spell Template Manager | Collecting Item Data");
		spellTemplateManager.currentItem = undefined;
		spellTemplateManager.currentActor = undefined;
		spellTemplateManager.currentPlayer = undefined;
		spellTemplateManager.currentDurationRounds = undefined;
		spellTemplateManager.currentItem=dialog.item;
		spellTemplateManager.currentActor=dialog.item.actor;
		spellTemplateManager.currentScene=game.scenes.viewed.id;
		spellTemplateManager.currentPlayer=game.userId;
		spellTemplateManager.currentSpell=spellTemplateManager.currentItem.name;
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

	static getPlaceableTemplate(templateID){
		let placeable = undefined;
		for(let i = game.canvas.templates.placeables.length -1; i > -1; i--){
			if (game.canvas.templates.placeables[i].data.flags.spellTemplateManager?.item == templateID || game.canvas.templates.placeables[i].data._id == templateID){
				placeable = game.canvas.templates.placeables[i];
				return placeable;
			}
		}		
		return placeable;
	}

	static async applyTexture(args,mysi){
		if(args[0].data.flags.spellTemplateManager != undefined){
			let placeable = spellTemplateManager.getPlaceableTemplate(args[0].data.flags.spellTemplateManager.item);
			if(placeable != undefined){
				spellTemplateManager.ApplyTextureComplete = true;
				try{
					clearInterval(mysi);
				}catch{}
				let scale = 1;
				
				let originalActor = game.actors.get(args[0].data.flags.spellTemplateManager?.actor);
				let originalSpellTexture = undefined;
				let useTexture = undefined;
				let alpha = 50;
				let coneOrigin = undefined;
				let loopAnimations = undefined;


					let originalToken = game.scenes.active.tokens.filter(i=>{return (i.actor.id==(args[0].data?.flags?.spellTemplateManager?.actor))})[0];
					let itemArray = (originalToken?.data.actorData.items??undefined);
					let foundSpell = undefined;
					if(itemArray != undefined){
						for (let i = 0; i < itemArray.length; i++){
							if(itemArray[i]._id == args[0].data.flags.spellTemplateManager.item){
								foundSpell = itemArray[i];
								break;
							}
						}
					}
					originalSpellTexture = foundSpell?.flags?.spellTemplateManager?.texture;
					originalSpellTexture = originalSpellTexture??originalActor.items.get(args[0].data.flags.spellTemplateManager.item).data.flags.spellTemplateManager.texture;

					useTexture = foundSpell?.flags?.spellTemplateManager?.useTexture;
					useTexture = useTexture ?? originalActor.items.get(args[0].data.flags.spellTemplateManager.item).data.flags.spellTemplateManager.useTexture;

					alpha = foundSpell?.flags?.spellTemplateManager?.alpha;
					alpha = (alpha??originalActor.items.get(args[0].data.flags.spellTemplateManager.item).data.flags.spellTemplateManager.alpha)??50;

					coneOrigin = foundSpell?.flags?.spellTemplateManager?.coneOrigin;
					coneOrigin = coneOrigin??originalActor.items.get(args[0].data.flags.spellTemplateManager.item).data.flags.spellTemplateManager.coneOrigin??1;

					loopAnimations = foundSpell?.flags?.spellTemplateManager?.loopAnimations;
					loopAnimations = loopAnimations??originalActor.items.get(args[0].data.flags.spellTemplateManager.item).data.flags.spellTemplateManager.loopAnimations??"checked";


				placeable.setFlag("spellTemplateManager","spellTexture",originalSpellTexture);
				placeable.setFlag("spellTemplateManager","useTexture",useTexture);
				placeable.setFlag("spellTemplateManager","alpha",alpha);
				placeable.setFlag("spellTemplateManager","coneOrigin",coneOrigin);
				placeable.setFlag("spellTemplateManager","loopAnimations",loopAnimations);
						
				if(("" != (useTexture??"")) && "" != (originalSpellTexture??"")){

					let STMtexture = undefined;	
					let textureSize = undefined;
					let sprite = undefined;
					let masker = undefined;
					let icon = undefined;
					let xPos = undefined;
					let yPos = undefined;
					let mask = undefined;
					let source = undefined;
					let workingWidth = undefined;
					let container = undefined;
					switch(placeable.data.t){
						case "circle":
								if(STMtexture == undefined){
								STMtexture = await loadTexture(originalSpellTexture);
								textureSize = placeable.height;
								STMtexture.orig = { height: (textureSize * scale), width: textureSize * scale, x: -textureSize, y: -textureSize };
								spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
							}
							sprite = new PIXI.Sprite(STMtexture);
							sprite.anchor.set(0.5);
							sprite.alpha = alpha/100
							icon = await placeable.addChild(sprite);
							source = getProperty(icon._texture, "baseTexture.resource.source");
							if (source && (source.tagName === "VIDEO")) {
								source.loop = (loopAnimations=="checked");
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
							let coneOrigin = placeable.getFlag("spellTemplateManager","coneOrigin");
							{
								switch(coneOrigin){
									case 0:
									default:
										if(STMtexture == undefined){
											STMtexture = await loadTexture(originalSpellTexture);
											workingWidth =  placeable.ray._distance;
											textureSize = workingWidth * 2;
											STMtexture.orig = { height: (textureSize * scale), width: textureSize * scale, x: -textureSize, y: -textureSize };
											spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
										}
										sprite = new PIXI.Sprite(STMtexture);
										sprite.anchor.set(0.5);
										sprite.alpha = alpha/100
										sprite.angle = placeable.data.direction;
										icon = await placeable.addChild(sprite);
										source = getProperty(icon._texture, "baseTexture.resource.source");
										if (source && (source.tagName === "VIDEO")) {
											source.loop = (loopAnimations=="checked");
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
											STMtexture = await loadTexture(originalSpellTexture);
											spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
										}
										workingWidth =  placeable.ray._distance;
										textureSize = placeable.data.height * canvas.grid.size;
										sprite = new PIXI.Sprite(STMtexture)
										sprite.anchor.set(0,0.5)
										sprite.width=workingWidth;
										sprite.height=Math.sqrt((workingWidth**2)+(workingWidth**2));
										sprite.alpha = alpha/100;
										sprite.angle = placeable.data.direction;
										icon = await placeable.addChild(sprite)
										source = getProperty(icon._texture, "baseTexture.resource.source");
										if (source && (source.tagName === "VIDEO")) {
											source.loop = (loopAnimations=="checked");
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
											STMtexture = await loadTexture(originalSpellTexture);
											spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
										}
										workingWidth =  placeable.ray._distance;
										textureSize = placeable.data.height * canvas.grid.size;
										sprite = new PIXI.Sprite(STMtexture)
										sprite.anchor.set(1,0.5)
										sprite.width=workingWidth*-1;
										sprite.height=Math.sqrt((workingWidth**2)+(workingWidth**2));
										sprite.alpha = alpha/100;
										sprite.angle = placeable.data.direction;
										icon = await placeable.addChild(sprite)
										source = getProperty(icon._texture, "baseTexture.resource.source");
										if (source && (source.tagName === "VIDEO")) {
											source.loop = (loopAnimations=="checked");
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
											STMtexture = await loadTexture(originalSpellTexture);
											spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
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
										sprite.alpha = alpha/100;
										sprite.x=sprite.height/2;
										container.angle = placeable.data.direction;
										icon = await container.addChild(sprite)
										await placeable.addChild(container);
										
										source = getProperty(icon._texture, "baseTexture.resource.source");
										if (source && (source.tagName === "VIDEO")) {
											source.loop = (loopAnimations=="checked");
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
												STMtexture = await loadTexture(originalSpellTexture);
												spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
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
											sprite.alpha = alpha/100;
											sprite.x=sprite.height/2;
											container.angle = placeable.data.direction;
											icon = await container.addChild(sprite)
											await placeable.addChild(container);
											
											source = getProperty(icon._texture, "baseTexture.resource.source");
											if (source && (source.tagName === "VIDEO")) {
												source.loop = (loopAnimations=="checked");
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
								STMtexture = await loadTexture(originalSpellTexture);
								spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
							}
							workingWidth =  placeable.ray._distance;
							sprite = new PIXI.Sprite(STMtexture)
							sprite.anchor.set(0,0)
							sprite.width=Math.floor((placeable.shape.width)/35)*35;
							sprite.height=Math.floor((placeable.shape.height)/35)*35;
							sprite.alpha = alpha/100;
							icon = await placeable.addChild(sprite)
							await icon.position.set(
								(placeable.shape.left == 0)?0:(-sprite.width),
								(placeable.shape.top == 0)?0:(-sprite.height)
							)
							source = getProperty(icon._texture, "baseTexture.resource.source");
							if (source && (source.tagName === "VIDEO")) {
								source.loop = (loopAnimations=="checked");
								source.muted = true;
								game.video.play(source);
							}
							icon.zIndex = -1000;
							break;
						default:
							if(STMtexture == undefined){
								STMtexture = await loadTexture(originalSpellTexture);
								spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
							}
							sprite = new PIXI.Sprite(STMtexture)
							sprite.height=placeable.data.width*game.canvas.grid.size/5;
							sprite.width=placeable.data.distance*game.canvas.grid.size/5;
							sprite.y=0;
							sprite.anchor.set(0,0.5);
							sprite.rotation=placeable.ray.normAngle;
							sprite.alpha = alpha/100;
							icon = await placeable.addChild(sprite);
							source = getProperty(icon._texture, "baseTexture.resource.source");
							if (source && (source.tagName === "VIDEO")) {
								source.loop = (loopAnimations=="checked");
								source.muted = true;
								game.video.play(source);
							}
							icon.zIndex = -1000;
							break;
		
					}
				}
			}
		}
	}


	static async reapplyTexture(placeable){
		placeable.sortDirty=true;
		placeable.sortChildren();
		let child = placeable.children[0];
		while(child.zIndex == -1000){
			placeable.removeChild(child);
			child = placeable.children[0];
		}
		let scale = 1;
		let originalSpellTexture = placeable.document.getFlag("spellTemplateManager","spellTexture");
		let alpha = placeable.getFlag("spellTemplateManager","alpha")??50;
		let useTexture = placeable.getFlag("spellTemplateManager","useTexture")??"checked";
		let loopAnimations = placeable.getFlag("spellTemplateManager","loopAnimations")??"checked";
		if(("" != (useTexture??"")) && "" != (originalSpellTexture??"")){

			let STMtexture = undefined;	
			let textureSize = undefined;
			let sprite = undefined;
			let masker = undefined;
			let icon = undefined;
			let xPos = undefined;
			let yPos = undefined;
			let mask = undefined;
			let source = undefined;
			let workingWidth = undefined;
			let container = undefined;
			switch(placeable.data.t){
				case "circle":
		        		if(STMtexture == undefined){
						STMtexture = await loadTexture(originalSpellTexture);
						textureSize = placeable.height;
						STMtexture.orig = { height: (textureSize * scale), width: textureSize * scale, x: -textureSize, y: -textureSize };
						spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
					}
					sprite = new PIXI.Sprite(STMtexture);
					sprite.anchor.set(0.5);
					sprite.alpha = alpha/100
					icon = await placeable.addChild(sprite);
					source = getProperty(icon._texture, "baseTexture.resource.source");
					if (source && (source.tagName === "VIDEO")) {
						source.loop = (loopAnimations=="checked");
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
					let coneOrigin = placeable.getFlag("spellTemplateManager","coneOrigin");
					{
						switch(coneOrigin){
							case 0:
							default:
								if(STMtexture == undefined){
									STMtexture = await loadTexture(originalSpellTexture);
									workingWidth =  placeable.ray._distance;
									textureSize = workingWidth * 2;
									STMtexture.orig = { height: (textureSize * scale), width: textureSize * scale, x: -textureSize, y: -textureSize };
									spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
								}
								sprite = new PIXI.Sprite(STMtexture);
								sprite.anchor.set(0.5);
								sprite.alpha = alpha/100
								sprite.angle = placeable.data.direction;
								icon = await placeable.addChild(sprite);
								source = getProperty(icon._texture, "baseTexture.resource.source");
								if (source && (source.tagName === "VIDEO")) {
									source.loop = (loopAnimations=="checked");
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
									STMtexture = await loadTexture(originalSpellTexture);
									spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
								}
								workingWidth =  placeable.ray._distance;
								textureSize = placeable.data.height * canvas.grid.size;
								sprite = new PIXI.Sprite(STMtexture)
								sprite.anchor.set(0,0.5)
								sprite.width=workingWidth;
								sprite.height=Math.sqrt((workingWidth**2)+(workingWidth**2));
								sprite.alpha = alpha/100;
								sprite.angle = placeable.data.direction;
								icon = await placeable.addChild(sprite)
								source = getProperty(icon._texture, "baseTexture.resource.source");
								if (source && (source.tagName === "VIDEO")) {
									source.loop = (loopAnimations=="checked");
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
									STMtexture = await loadTexture(originalSpellTexture);
									spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
								}
								workingWidth =  placeable.ray._distance;
								textureSize = placeable.data.height * canvas.grid.size;
								sprite = new PIXI.Sprite(STMtexture)
								sprite.anchor.set(1,0.5)
								sprite.width=workingWidth*-1;
								sprite.height=Math.sqrt((workingWidth**2)+(workingWidth**2));
								sprite.alpha = alpha/100;
								sprite.angle = placeable.data.direction;
								icon = await placeable.addChild(sprite)
								source = getProperty(icon._texture, "baseTexture.resource.source");
								if (source && (source.tagName === "VIDEO")) {
									source.loop = (loopAnimations=="checked");
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
									STMtexture = await loadTexture(originalSpellTexture);
									spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
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
								sprite.alpha = alpha/100;
								sprite.x=sprite.height/2;
								container.angle = placeable.data.direction;
								icon = await container.addChild(sprite)
								await placeable.addChild(container);
								
								source = getProperty(icon._texture, "baseTexture.resource.source");
								if (source && (source.tagName === "VIDEO")) {
									source.loop = (loopAnimations=="checked");
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
										STMtexture = await loadTexture(originalSpellTexture);
										spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
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
									sprite.alpha = alpha/100;
									sprite.x=sprite.height/2;
									container.angle = placeable.data.direction;
									icon = await container.addChild(sprite)
									await placeable.addChild(container);
									
									source = getProperty(icon._texture, "baseTexture.resource.source");
									if (source && (source.tagName === "VIDEO")) {
										source.loop = (loopAnimations=="checked");
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
						STMtexture = await loadTexture(originalSpellTexture);
						spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
					}
					workingWidth =  placeable.ray._distance;
					sprite = new PIXI.Sprite(STMtexture)
					sprite.anchor.set(0,0)
					sprite.width=Math.floor((placeable.shape.width)/35)*35;
					sprite.height=Math.floor((placeable.shape.height)/35)*35;
					sprite.alpha = alpha/100;
					icon = await placeable.addChild(sprite)
					await icon.position.set(
						(placeable.shape.left == 0)?0:(-sprite.width),
						(placeable.shape.top == 0)?0:(-sprite.height)
					)
					source = getProperty(icon._texture, "baseTexture.resource.source");
					if (source && (source.tagName === "VIDEO")) {
						source.loop = (loopAnimations=="checked");
						source.muted = true;
						game.video.play(source);
					}
					icon.zIndex = -1000;
					break;
				default:
					if(STMtexture == undefined){
						STMtexture = await loadTexture(originalSpellTexture);
						spellTemplateManager.textureMap.set(originalSpellTexture,STMtexture);
					}
					sprite = new PIXI.Sprite(STMtexture)
					sprite.height=placeable.data.width*game.canvas.grid.size/5;
					sprite.width=placeable.data.distance*game.canvas.grid.size/5;
					sprite.y=0;
					sprite.anchor.set(0,0.5);
					sprite.rotation=placeable.ray.normAngle;
					sprite.alpha = alpha/100;
					icon = await placeable.addChild(sprite);
					source = getProperty(icon._texture, "baseTexture.resource.source");
					if (source && (source.tagName === "VIDEO")) {
						source.loop = (loopAnimations=="checked");
						source.muted = true;
						game.video.play(source);
					}
					icon.zIndex = -1000;
					break;

			}
		}
	}







	static updateTemplate(scene,template,ignoreDuration,isConcentration,isSpecialSpell,index,duration=0){
		console.log("Spell Template Manager | Updating Template");
		let done = false;
		if(index < 10 && !done){
			if(scene.data.templates.filter(i => i.id === template.id).length > 0){
				console.log("Spell Template Manager | Appending data");
				let update;
				if(isConcentration){
					update = {_id: template.id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor?.data._id, 
							duration: spellTemplateManager.currentDurationRounds??duration,
							special: (isSpecialSpell),
							scene: scene.id,
							bd: spellTemplateManager.usingAT?game.Gametime.ElapsedTime.currentTimeSeconds():undefined,
							spell: spellTemplateManager.currentSpell,
							item: spellTemplateManager.currentItem?.id
						}
					},borderColor:("#"+(game.settings.get('spellTemplateManager', 'concentrationTemplateColor')).substring(1,7))};
				}else if(spellTemplateManager.currentDurationRounds>0){
					update = {_id: template.id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor?.data._id, 
							duration: spellTemplateManager.currentDurationRounds??duration,
							special: (isSpecialSpell),
							scene: spellTemplateManager.currentScene,
							bd: spellTemplateManager.usingAT?game.Gametime.ElapsedTime.currentTimeSeconds():undefined,
							spell: spellTemplateManager.currentSpell,
							item: spellTemplateManager.currentItem?.id
						}
					},borderColor:("#"+(game.settings.get('spellTemplateManager', 'enduringTemplateColor')).substring(1,7))};
				}else if(isSpecialSpell){
					update = {_id: template.id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor?.data._id, 
							duration: spellTemplateManager.currentDurationRounds??duration,
							special: (isSpecialSpell),
							scene: spellTemplateManager.currentScene,
							bd: spellTemplateManager.usingAT?game.Gametime.ElapsedTime.currentTimeSeconds():undefined,
							spell: spellTemplateManager.currentSpell,
							item: spellTemplateManager.currentItem?.id
						}
					},borderColor:("#"+(game.settings.get('spellTemplateManager', 'specialTemplateColor')).substring(1,7))};
				}else{
					update = {_id: template.id, flags: {
						"spellTemplateManager":{
							concentration: isConcentration, 
							actor:spellTemplateManager.currentActor?.data._id, 
							duration: spellTemplateManager.currentDurationRounds??duration,
							special: (isSpecialSpell),
							scene: spellTemplateManager.currentScene,
							bd: spellTemplateManager.usingAT?game.Gametime.ElapsedTime.currentTimeSeconds():undefined,
							spell: spellTemplateManager.currentSpell,
							item: spellTemplateManager.currentItem?.id
						}
					},borderColor:("#"+(game.settings.get('spellTemplateManager', 'standardTemplateColor')).substring(1,7))};
				}
				let updated = scene.updateEmbeddedDocuments("MeasuredTemplate", [update]);

				if(game.settings.get('spellTemplateManager','usingAT')){
					let roundSeconds = game.settings.get("about-time", "seconds-per-round");	
					let notifyTime = ignoreDuration?(spellTemplateManager.instantaneousSpellFade*roundSeconds):(spellTemplateManager.currentDurationRounds??duration)*roundSeconds;
					game.Gametime.notifyIn({seconds: notifyTime},"spellTemplateManager",template.id);
				}
				spellTemplateManager.resetItemData();  
				done = true;
			}else{
				console.debug("Spell Template Manager | Failed to update template.  Retrying. ", index);
				setTimeout(spellTemplateManager.updateTemplate(scene,template,ignoreDuration,isConcentration,isSpecialSpell,index+1), 100);
			}
		}else{
			console.log("Spell Template Manager | Failed to update template.");
			done = true;
		}
		
	}	

	static async deleteTemplate(templateId){
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

	static async evaluateTemplate(template,data,userID){
		console.log("Spell Template Manager | Evaluating template");
		if(spellTemplateManager.currentItem !== undefined){
			let isConcentration = ((spellTemplateManager.currentSystem=="dnd5e")?(spellTemplateManager.currentItem.data.data.components?spellTemplateManager.currentItem.data.data.components?.concentration:false):false);
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
					(i.data.flags.spellTemplateManager.duration < 1 || i.data.flags.spellTemplateManager.duration === undefined) &&
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

	static parseChatMessage2(args){
		if(spellTemplateManager.running){
			spellTemplateManager.currentPlayer = game.userId;
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
				spellTemplateManager.currentActor = game.actors.get(actorID);
				spellTemplateManager.currentScene = ((sceneIndex > -1)?mcontent.substring(sceneIndex+15,sceneIndex+15+16):game.scenes.viewed._id);
				mtoken = ((sceneIndex > -1)?game.scenes.get(spellTemplateManager.currentScene).data.tokens.get(mcontent.substring(sceneIndex+15+16+1,sceneIndex+15+16+1+16)):game.scenes.get(spellTemplateManager.currentScene).data.tokens.get(mcard.speaker.token));

				switch(mtoken.isLinked || (!mtoken.isLinked && sceneIndex == -1 )){
					case true:
						itemID = mcontent.substring(itemIndex+14,itemIndex+14+16);
						spellTemplateManager.currentItem = spellTemplateManager.currentActor.data.items.get(itemID);
						break;
					case false:
						itemID = mcontent.substring(itemIndex+14,itemIndex+14+16);
						spellTemplateManager.currentItem = {
							id:itemID,
							data:mtoken.data.actorData.items.find(element => element._id == itemID),
							type:mtoken.data.actorData.items.find(element => element._id == itemID).type
						};
						break;
				}
			spellTemplateManager.currentSpell = spellTemplateManager.currentItem.name;
			if(spellTemplateManager.currentItem.type == "spell"){
				console.log("Spell Template Manager | Checking for duration");
				if(spellTemplateManager.currentItem.data.data.duration?.value=="" || spellTemplateManager.currentItem.data.data.duration?.value==undefined){
					duration  = spellTemplateManager.instantaneousSpellFade;
				}else{
					let durationArray = spellTemplateManager.currentItem.data.data.duration.value.toLowerCase().split(" ");
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
							duration = value * 10 * 60 * 24 * 365;
							break;
						case "week":
						case "weeks":
							duration = value * 10 * 60 * 24 * 7;
							break;
						case "day":
						case "days":
							duration = value * 10 * 60 * 24;
							break;
						case "hour":
						case "hours":
							duration  = value * 10 * 60;
							break;
						case "inst":
						case "":
							duration  = spellTemplateManager.instantaneousSpellFade;
							break;
						case "minute":
						case "minutes":
						case "minue":
							duration  = value * 10;
							break;
						case "round":
						case "rounds":
						case "turn":
						case "turns":
							duration  = value;
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
							duration = -1;
					}
				}
				if(spellTemplateManager.currentItem.data.flags.spellTemplateManager === undefined){
					spellTemplateManager.currentException = "";
				}else{
					spellTemplateManager.currentException = (spellTemplateManager.currentItem.data.flags.spellTemplateManager["ignore-duration"]??"");					
				}
				spellTemplateManager.currentDurationRounds = (spellTemplateManager.currentException=="checked"?0:duration);
			}else{
				console.debug("Spell Template Manager | Ignoring chat message");
			}
		}else{
			console.debug("Spell Template Manager | Not ready");
		}
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

	switch(spellTemplateManager.currentSystem){
		case "dnd5e":
			new window.Ardittristan.ColorSetting("spellTemplateManager", "concentrationTemplateColor", {
				name: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.name"),
				hint: game.i18n.localize("spellTemplateManager.concentrationTemplateColor.hint"),
				label: "Click to select color",
				restricted: true,
				defaultColor: "#ffff00ff",
				scope: "world",
				onChange: (value) => { spellTemplateManager.resetTemplateBorders();}
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
					onChange: value => {spellTemplateManager.resetTemplateBorders();}
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
			default: (spellTemplateManager.currentSystem != "pf2e"),
			config: (spellTemplateManager.currentSystem == "dnd5e"),
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
                    	default: (spellTemplateManager.currentSystem != "pf2e"),
                    	config: (spellTemplateManager.currentSystem == "dnd5e"),
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
	spellTemplateManager.currentSystem = game.system.data.name;
	if((!spellTemplateManager.currentSystem == "dnd5e") && (!spellTemplateManager.currentSystem == "pf2e")){
		ui.notifications.notify('SpellTemplateManager is only compatible with the DnD5E and PF2E game systems.', "error");
	}	
	registerSpellTemplateManagerSettings();
	async function newHover(wrapped, ...args) {
		return true;
	}
	libWrapper.register("spellTemplateManager", "CONFIG.MeasuredTemplate.objectClass.prototype._canHover", newHover);
});

Hooks.once('ready', () => {
    try{window.Ardittristan.ColorSetting.tester} catch {
        ui.notifications.notify('Please make sure you have the "lib - ColorSettings" module installed and enabled.', "error");
    }
    spellTemplateManager.running = true;
    console.log("Spell Template Manager | Running!");
});

Hooks.on("renderItemSheet", (app, html) =>{
	const template_types = ["cone", "circle", "rect", "ray"];
	const add = spellTemplateManager.currentSystem == "dnd5e"?".tab.details":".tab.item-details";
	if(app.object.type !== "spell" && (!template_types.includes(app.object.data.data?.target?.type) || !template_types.includes(app.object.data.spellInfo?.area?.areaType))) return;
	let status = app.object.getFlag("spellTemplateManager","ignore-duration") ?? "";
	let currentTexture = app.object.getFlag("spellTemplateManager","texture")??"";
	let useTexture = app.object.getFlag("spellTemplateManager","useTexture")??"";
	let alpha = app.object.getFlag("spellTemplateManager","alpha")??"50";
	let coneOrigin = app.object.getFlag("spellTemplateManager","coneOrigin")??"";
	let loopAnimations = app.object.getFlag("spellTemplateManager","loopAnimations")??"checked";
	
	html.find(add).append(`		
		<h3 class="form-header">Templates</h3>
		<div class="form-group">
			<label>
				Ignore Spell Duration (Remove Immediately)				
			</label>
			<input type="checkbox" style="float:right;" name="spell.template.removal" ${status}>
		</div>
  	`);
	
	html.find(add).append(`		
		<div class="form-group">
			<label>
			Use Spell Texture				
			</label>
			<input type="checkbox" style="float:right;" name="spell.template.useTexture" ${useTexture}>
		</div>
  	`);
	
	html.find(add).append(`
		<div class="form-group">
			<label class="textureSelect" style="float:left;">Texture <input type="text" size="10" style="width: 65%;" name="spell.template.texture.text" value=${currentTexture}  >
				<input type="button" name="spell.template.texture.bttn" value="Select" style="width: 20%; text-align: center;">
			</label>
		</div>
	`);

	html.find(add).append(`		
		<div class="form-group">
			<label>
			Alpha (transparency)%				
			</label>
			<input type="number" style="float:right;" name="spell.template.alpha" min="10" max="100" value="${alpha}" >
		</div>
  	`);

	 html.find(add).append(`		
	  <div class="form-group">
		  <label>
		  Loop animations				
		  </label>
		  <input type="checkbox" style="float:right;" name="spell.template.loop.animations" ${loopAnimations}>
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
		let status = event.target.checked ? "checked" : "";
		app.object.setFlag("spellTemplateManager", "ignore-duration", status);
	}
	
		$('input[name="spell.template.useTexture"]')[0].onchange = (event) => {
		let useTexture = event.target.checked ? "checked" : "";
		app.object.setFlag("spellTemplateManager", "useTexture", useTexture);
	}

	$('input[name="spell.template.alpha"]')[0].onchange = (event) => {
		let alpha = (0+event.target.valueAsNumber);
		if(typeof alpha == 'number' && isFinite(alpha)){
			if(alpha <= 100 && alpha >= 0){
				app.object.setFlag("spellTemplateManager", "alpha", +alpha);
			}
		}
	}

	$('input[name="spell.template.texture.text"]')[0].onchange = (event) => {
		let currentTexture = event.target.value;
		app.object.setFlag("spellTemplateManager", "texture", currentTexture);
	}		

	let scale = 1;
	let mfpoptions = {
		type:"imagevideo",
		current:currentTexture, 
		callback: async (...args)=>{
			app.object.setFlag('spellTemplateManager','texture',args[0]);
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
			let coneOrigin = event.target.selectedIndex;
			app.object.setFlag("spellTemplateManager","coneOrigin",coneOrigin);
		}
	}

	$('input[name="spell.template.loop.animations"]')[0].onchange = (event) => {
		let loopAnimations = event.target.checked ? "checked" : "";
		app.object.setFlag("spellTemplateManager", "loopAnimations", loopAnimations);
	}
});

Hooks.on("renderAbilityUseDialog",(dialog, html) => {
	
	if(spellTemplateManager.currentSystem == "dnd5e"){	

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
					let spellLevelText = document.querySelectorAll("form#ability-use-form")[0][0][spellLevelSelect]?.innerText ?? "0";
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

	}

});	

Hooks.on("createMeasuredTemplate", (...args) => {
	if(game.userId == args[2]){
		spellTemplateManager.evaluateTemplate(args[0],args[1],args[2]);
		let attempts = 0;
		let mysi = setInterval(
		function(){
			spellTemplateManager.ApplyTextureComplete = false;
			if(!spellTemplateManager.ApplyTextureComplete && attempts < 20){
				attempts++;
				if(args[0].data?.flags?.spellTemplateManager?.actor != undefined){
					spellTemplateManager.applyTexture(args,mysi);
				}
			}else{
				clearInterval(mysi);
			}
		});	
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

Hooks.on("preCreateChatMessage",(...args) => {
	if(spellTemplateManager.currentSystem == "pf2e"){
		spellTemplateManager.parseChatMessage2(args);
	}
});

Hooks.on("deleteMeasuredTemplate",e=>{spellTemplateManager.currentTT?.remove();});
Hooks.on("hoverMeasuredTemplate",e=>{
	let sourceTemplate = spellTemplateManager.getSourceTemplate(e.data._id);
	let placeable = spellTemplateManager.getPlaceableTemplate(e.data._id);
	let mx = e.x;
	let my = e.y;
	mx += 30;
	my -= 30;
	let ttplayer = game.actors.get(sourceTemplate.data.flags.spellTemplateManager?.actor)?.name??(game.users.get(sourceTemplate.data.user)?.name??"Unknown");
	let ttspell = sourceTemplate.data.flags.spellTemplateManager?.spell??"???"
	let ttduration = "";
	
	if(spellTemplateManager.usingAT){
		let ttbd = (sourceTemplate.data.flags.spellTemplateManager?.bd)??0;
		let tttr = "Unknown";
		let ttod = (sourceTemplate.data.flags.spellTemplateManager?.duration)??0;
		if(ttbd > 0){
			tttr = ((ttod * 6) + ttbd - game.Gametime.ElapsedTime.currentTimeSeconds());
		}
		ttduration = "Remaining: "+(tttr)+" seconds";
		
	}else{
		ttduration = '<span style="font-weight:500;">Remaining: </span>' + ((sourceTemplate.data.flags.spellTemplateManager?.duration)??"Unknown") + " rounds";
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
				
				for(let i = 0; i < placeables.length; i++){
					if(placeables[i].data.flags.spellTemplateManager != undefined){
						spellTemplateManager.reapplyTexture(placeables[i]);		
					}
				}
			}
		}catch (e){}
	},300);
});

Hooks.on("updateMeasuredTemplate",async (e)=> {
	console.log("Spell Template Manager | updating template!",e);
	if((e.data.flags.spellTemplateManager?.spellTexture) != undefined){
		console.log("Spell Template Manager | Trying to apply texture!");
		let placeable = spellTemplateManager.getPlaceableTemplate(e.id);
		spellTemplateManager.reapplyTexture(placeable);		
	}
});

Hooks.on("renderMeasuredTemplateConfig", (app, html) =>{
	let addHeight = html.find('button[type="submit"]')[0].offsetHeight;
	let currentHeight = html.height();
	html[0].style.height=`${addHeight+currentHeight}px`;
	let template = app.object;
	let duration = template.getFlag("spellTemplateManager","duration")??"";
	html.find('button[type="submit"]')[0].insertAdjacentHTML('beforebegin', `<div class="form-group"><label>Duration (Rounds)</label><input type="number" style="float:right;" name="spell.template.duration" min="1" value="${duration}"></div>`);
	
	$('input[name="spell.template.duration"]')[0].onchange = (event) => {
		let duration = (0+event.target.valueAsNumber);
		if(typeof duration == 'number' && isFinite(duration)){
			spellTemplateManager.updateTemplate(game.scenes.viewed,app.object,"",false,true,0,duration);
		}
	}
});

globalThis.spellTemplateManager = spellTemplateManager;
