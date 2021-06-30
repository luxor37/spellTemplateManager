export class stmData{
    constructor(...args){
        if (args.length == 0){
            this.spellTexture = "";
            this.useTexture = false;
            this.alpha = 50;
            this.coneOrigin = 1;
            this.loopAnimations = true;
            this.ignoreDuration = false;
        }else{
            args[0] && Object.assign(this, args[0]);    
        }
    }
    setSpellTexture(texture){
        this.spellTexture = texture; 
        return this;
    }
    setUseTexture(useTexture){
        this.useTexture = useTexture;
        return this;
    }
    setAlpha(alpha){
        this.alpha = alpha;
        return this;
    }
    setConeOrigin(coneOrigin){
        this.coneOrigin = coneOrigin;
        return this;
    }
    setLoopAnimations(loopAnimations){
        this.loopAnimations=loopAnimations;
        return this;
    }
    setIgnoreDuration(ignoreDuration){
        this.ignoreDuration = ignoreDuration;
        return this;
    }

    getSpellTexture(){
        return this.spellTexture; 
    }
    getUseTexture(){
        return this.useTexture;
    }
    getAlpha(){
        return this.alpha;
    }
    getConeOrigin(){
        return this.coneOrigin;
    }
    getLoopAnimations(){
        return this.loopAnimations;
    }
    getIgnoreDuration(){
        return this.ignoreDuration;
    }
}