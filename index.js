var https = require('https');
var mysql = require('mysql');

var connection;

var https = require('https');

exports.handler = (event, context) => {

  try {

    connection = mysql.createConnection({
            host     : 'DB_ENDPOINT',
            user     : 'USERNAME',
            ssl : 'Amazon RDS',
            password : 'PASSWORD',
            database : 'DB_NAME',
            port : '3306',
        });

        if (event.session.new) {
            newSessionHelper(event, context);
        } else {
            oldSessionHelper(event, context);
        }
        
    } 
    catch(error) { context.fail('Exception: '+error) }

};

newSessionHelper = (event,context) => {

    switch (event.request.type) {

      case "LaunchRequest":
        // Launch Request
        console.log(`LAUNCH REQUEST`);
        respondBack("Welcome to Teen Patti Variations. You can ask me to suggest a new variation for the game. "
                     +"Please say Help if you need any help with the skill flow", false, {}, context);
        break;
    

      case "IntentRequest":
                    
            switch(event.request.intent.name) {
                case "AMAZON.HelpIntent":
                    respondBack("Hello and welcome to Teen Patti Variations. I will walk you through the skill. "
                                + "You can either ask me to suggest a new variation or repeat the variation I just said. "
                                + "If you are satisfied with the variation you can exit from the skill by saying Stop. " 
                                + "Hope I was helpful. Let the game begin. Ask me to suggest you a variation" ,false, {}, context);
                    break;
                
                case "AMAZON.StopIntent":
                    respondBack("Enjoy, Have a great game." ,true, {}, context);
                    break;
                    
                case "AMAZON.CancelIntent":
                    respondBack("Enjoy, Have a great game." ,true, {}, context);
                    break;
                  
                case "repeatVariation":
                    respondBack("Sorry, I cannot repeat now. You first must ask me to suggest a variation. "
                                 +"Only after that I can repeat that variation. Thank you.", true, {} , context);
                    break;
                    
                    
                case "suggestVariation":
                    console.log(`Suggest Variations`);
                    
                    var randomNumber = Math.floor(Math.random() * (37 - 1) + 1);
                    console.log(randomNumber);
                    var query = "select * from variations where VariationId ='"+randomNumber+"'";
                    
                    getDBResponse(query, function(err, response){
                        if(response !== null && response !== undefined)
                        {
                            console.log(response[0].VariationName);
                            respondBack(response[0].VariationName+". "+response[0].VariationDescription+
                            ". You can tell me to repeat the variation or say stop to exit the skill and enjoy the game.", false, {
                                "VariationName": response[0].VariationName,
                                "VariationDescription": response[0].VariationDescription
                            }, context);
                        }
                        
                        else
                        {
                            respondBack("Sorry, I dont have that information.", true, {}, context);
                        }
                        connection.end();
                        
                    });
                    
                    break;
            }
                
        break;
    
      case "SessionEndedRequest":
                context.succeed();
                break;
        
        
    
      default:
        context.fail(`INVALID REQUEST TYPE: ${event.request.type}`);
    }
  } ;
  
 
oldSessionHelper = (event, context) => {

  var repeatName, repeatDescription;
  switch (event.request.type) {
      case "SessionEndedRequest":
            context.succeed();
            break;
    
      case "IntentRequest" :

          switch(event.request.intent.name) {
                        case "repeatVariation":
                            if(event.session.attributes)
                            {
                                repeatName = event.session.attributes.VariationName;
                                repeatDescription = event.session.attributes.VariationDescription;    
                                respondBack("Okay, I am repeating. '"+repeatName+"' . '"+repeatDescription+
                                           ". You can tell me to repeat the same variation, suggest a new variation or say stop to exit the skill and enjoy the game" ,false, {
                                "VariationName": repeatName,
                                "VariationDescription": repeatDescription
                                }, context);
                            }
                            else
                            {
                                respondBack("Sorry, I cannot repeat now. You first must ask me to suggest a variation. "
                                         +"Only after that I can repeat that variation. Thank you.", true, {} , context); 
                            }
                            break;
                          
                        case "AMAZON.StopIntent":
                            respondBack("Enjoy, Have a great game." ,true, {}, context);
                            break;  
                          
                        case "AMAZON.CancelIntent":
                            respondBack("Enjoy, Have a great game." ,true, {}, context);
                            break;
                         
                        case "AMAZON.HelpIntent":
                            respondBack("Hello and welcome to Teen Patti Variations. I will walk you through the skill. "
                                         +"You can either ask me to suggest a new variation or repeat the variation I just said. "
                                         +"If you are satisfied with the variation you can exit from the skill by saying Stop. " 
                                         +"Hope I was helpful. Let the game begin. Ask me to suggest you a variation."  ,false, {}, context);
                        break;  
                            
                        case "suggestVariation":
                            console.log(`Suggest Variations`);
                            
                            var randomNumber = Math.floor(Math.random() * (37 - 1) + 1);
                            console.log(randomNumber);
                            var query = "select * from variations where VariationId ='"+randomNumber+"'";
                            
                            getDBResponse(query, function(err, response){
                                if(response !== null && response !== undefined)
                                {
                                    console.log(response[0].VariationName);
                                    respondBack(response[0].VariationName+". "+response[0].VariationDescription+
                                        ". You can tell me to repeat the variation or say stop to exit the skill and enjoy the game", false, {
                                        "VariationName": response[0].VariationName,
                                        "VariationDescription": response[0].VariationDescription
                                    }, context);
                                }
                                
                                else
                                {
                                    respondBack("Sorry, I dont have that information.", true, {}, context);
                                }
                                connection.end();
                                
                            });
                            break;
                            
                        default : 
                            context.fail(`INVALID REQUEST TYPE: ${event.request.type}`);
                        
                    }
                break;
            }
};
        


//DB Conn
getDBResponse = (query, callback) => {
    
    connection.query(query, function (err, rows) {
        if (err) throw err;
        if (rows[0] !== undefined) {
            if(callback)
                callback(null, rows);
        } else {
            if(callback)
                callback(null, null);
        }
    });
};

//Response card
respondBack = (response, endSession, attributes, context) => {
    context.succeed(
        generateResponse(
            buildSpeechletResponse(response, endSession),
            attributes
        )
    );
};

//error message
errorResponse = (context) => {
    respondBack("I don't know what you meant by that. Can you please try again?", true, {}, context);
};
  
//Helpers  
buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "PlainText",
      text: outputText
    },
    shouldEndSession: shouldEndSession
  };
};
    
generateResponse = (speechletResponse, sessionAttributes) => {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  };
};