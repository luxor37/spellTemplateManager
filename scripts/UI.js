export async function promptDelete(){
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

export async function promptForAction(name){
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
                        let confirmation = await promptDelete();
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
                        let unitValue = await promptForUnits();
                        complete({action:"claim",units:unitValue.units,value:unitValue.value});
                    }
                }
            },
            default: "skip"
        }).render(true);
    })
    
}

export async function promptForUnits(){
    return new Promise(complete =>{
            new Dialog({
            title: "Claim for how long?",
            content: "<p>Choose the type of units for this template.</strong></p>",
            buttons: {
                rounds: {
                    label: "Rounds",
                    callback: async function() {
                        let numRounds = await promptForNumber(1,10,"rounds");
                        complete({units:"rounds",value:numRounds});
                    }
                },
                minutes: {
                    label: "Minutes",
                    callback: async function() {
                        let numMins = await promptForNumber(1,60,"minutes");
                        complete({units:"minutes",value:numMins});
                    }
                },
                hours: {
                    label: "Hours",
                    callback: async function() {
                        let numHours = await promptForNumber(1,24,"hours");
                        complete({units:"hours",value:numHours});
                    }
                },
                days: {
                    label: "Days",
                    callback: async function() {
                        let numDays = await promptForNumber(1,7,"days");
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

export async function promptForNumber(min,max,units){

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