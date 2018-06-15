/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */

const Alexa = require('ask-sdk');
const lr = require('./modules/leagueRequest.js');
const SKILL_NAME = 'League Stats';

function nextChar(c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

function slotValue(slot){
    let value = {};
    let resolution = (slot.resolutions && slot.resolutions.resolutionsPerAuthority && slot.resolutions.resolutionsPerAuthority.length > 0) ? slot.resolutions.resolutionsPerAuthority[0] : null;
    if(resolution && resolution.status.code == 'ER_SUCCESS_MATCH'){
        let resolutionValue = resolution.values[0].value;
        value.id = resolutionValue.id;
        value.name = resolutionValue.name;
    }
    return value;
}

const LaunchRequest = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.session.new || handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        const responseBuilder = handlerInput.responseBuilder;

        const attributes = await attributesManager.getPersistentAttributes() || {};

        attributesManager.setSessionAttributes(attributes);

        const speak = (attributes.name && attributes.region) ? 'How can I help you?' : 'Welcome! Tell me your summoner name and region to get started.';
        const reprompt = (attributes.name && attributes.region) ? 'Try asking me what a champion\'s solo/duo rank is in your current game.' : 'Try telling me what your summoner name is.';
        return responseBuilder
            .speak(speak)
            .reprompt(reprompt)
            .getResponse();
    },
};

const ExitHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest'
            && (request.intent.name === 'AMAZON.CancelIntent'
                || request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Goodbye!')
            .getResponse();
    },
};

const SessionEndedRequest = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
        return handlerInput.responseBuilder.getResponse();
    },
};

const HelpIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;

        return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'If you tell me your summoner name and region, I can give you information about your current game.';
        const reprompt = 'Try saying what your summoner name is.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(reprompt)
            .getResponse();
    },
};

const UnhandledIntent = {
    canHandle() {
        return true;
    },
    handle(handlerInput) {
        const outputSpeech = 'Didn\'t quite catch that.';
        return handlerInput.responseBuilder
            .speak(outputSpeech)
            .reprompt(outputSpeech)
            .getResponse();
    },
};

const SetRegionIntent = {

    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'setRegionIntent';
    },

    async handle(handlerInput) {
        const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;
        
        const region = slotValue(requestEnvelope.request.intent.slots.region);

        const sessionAttributes = attributesManager.getSessionAttributes();

        if (region.name) {
            sessionAttributes.region = region;
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
            return responseBuilder
                .speak(`I have set your region to ${region.name}.`)
                .reprompt(sessionAttributes.name ? 'How can I help you?' : 'Try telling me your summoner name now.')
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak('Sorry, I didn\'t get that. Make sure you are in a region supported by League of Legends')
            .reprompt('Try saying: I am in North America')
            .getResponse();
    },
};

const GetNameIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getNameIntent';
    },

    async handle(handlerInput) {
        const { attributesManager, responseBuilder } = handlerInput;

        const sessionAttributes = attributesManager.getSessionAttributes();
        let name = sessionAttributes.name;

        if (name) {
            return responseBuilder
                .speak(`Your name is ${name}.`)
                .reprompt('Try asking me what a champion\'s flex rank is in your current game.')
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak('Your name is not set yet. Try saying: my name is, and then your summoner name')
            .reprompt('Try saying: I am in North America')
            .getResponse();
    },
}

const GetRegionIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getRegionIntent';
    },

    async handle(handlerInput) {
        const { attributesManager, responseBuilder } = handlerInput;

        const sessionAttributes = attributesManager.getSessionAttributes();
        let region = sessionAttributes.region;

        if (region && region.name) {
            return responseBuilder
                .speak(`You are in ${region.name}.`)
                .reprompt('Try asking me what a champion\'s flex rank is in your current game.')
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak('Your region is not set yet. Try saying: I am in, and then the region you are in.')
            .reprompt('Try saying: I am in North America')
            .getResponse();
    },
}

const SetNameIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'setUserIntent';
    },

    async handle(handlerInput) {
        const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;

        let name = '';
        let char = 'a';
        
        while (char != 'q' && requestEnvelope.request.intent.slots['c' + char].value) {
            let value = slotValue(requestEnvelope.request.intent.slots['c' + char]);
            let current = value.name;
            
            if(!current)
                break;

            switch (current) {
                case 'space':
                    current = ' ';
                    break;
                case 'zero':
                    current = '0';
                    break;
                case 'one':
                    current = '1'
                    break;
                case 'two':
                    current = '2'
                    break;
                case 'three':
                    current = '3'
                    break;
                case 'four':
                    current = '4'
                    break;
                case 'five':
                    current = '5'
                    break;
                case 'six':
                    current = '6'
                    break;
                case 'seven':
                    current = '7'
                    break;
                case 'eight':
                    current = '8'
                    break;
                case 'nine':
                    current = '9'
                    break;
            }

            name += current === ' ' ? current : current.charAt(0);
            char = nextChar(char);
        }

        const sessionAttributes = attributesManager.getSessionAttributes();

        if (name) {
            sessionAttributes.name = name;
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
            return responseBuilder
                .speak(`I have set your name to ${name}.`)
                .reprompt(sessionAttributes.region ? 'What can I do for you?' : 'Try telling me your region now.')
                .getResponse();
        }

        return handlerInput.responseBuilder
            .speak('Sorry, I didn\'t get that.')
            .reprompt('Sorry, I didn\'t get that.')
            .getResponse();
    },
};

const GetRankIntent = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' && request.intent.name === 'getRankIntent';
    },

    async handle(handlerInput) {
        const { requestEnvelope, attributesManager, responseBuilder } = handlerInput;

        const sessionAttributes = attributesManager.getSessionAttributes();

        if(!sessionAttributes.name || !sessionAttributes.region){
            return responseBuilder
                .speak('I can\'t get your game information until you set your name and your region.')
                .reprompt('Have you set your name and region?')
                .getResponse();
        }

        let ladder = slotValue(requestEnvelope.request.intent.slots.queue);
        let champion = slotValue(requestEnvelope.request.intent.slots.champion);
        if(champion.id && !ladder.id){
            return handlerInput.responseBuilder
            .speak(`You need to specify the rank you want, like solo or flex`)
            .reprompt('Try asking what a champion\'s solo rank is in your game.')
            .getResponse();
        }

        if(ladder.id && champion.name){
            let rank = await lr.getRank(sessionAttributes.region.id, parseInt(champion.id, 10), sessionAttributes.name, ladder.id);
            if(rank && rank.rank){
                return handlerInput.responseBuilder
                    .speak(`${champion.name} is ${rank.tier} ${rank.rank}, ${rank.lp} <say-as interpret-as="spell-out">lp</say-as>.`)
                    .reprompt('Try asking what a champion\'s rank is in your game.')
                    .getResponse();
            }else{
                return handlerInput.responseBuilder
                    .speak(`Couldn\'t find a rank for ${champion.name}. They might be unranked, or are not in the game.`)
                    .reprompt('Sorry, I didn\'t get that.')
                    .getResponse();
            }
        }

        return handlerInput.responseBuilder
            .speak('Sorry, I didn\'t get that. Make sure you tell me the champion and the ranked ladder you want to know about.')
            .reprompt('Sorry, I didn\'t get that.')
            .getResponse();
    },
}



const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak(`I encountered an error.`)
            .reprompt('Sorry, I can\'t understand the command. Please say again.')
            .getResponse();
    },
};

const FallbackHandler = {
    // 2018-May-01: AMAZON.FallackIntent is only currently available in en-US locale.
    //              This handler will not be triggered except in that locale, so it can be
    //              safely deployed for any locale.
    canHandle(handlerInput) {
        // handle fallback intent
        const request = handlerInput.requestEnvelope.request;
        return request.type === 'IntentRequest' &&
            (request.intent.name === 'AMAZON.FallbackIntent' ||
                request.intent.name === 'AMAZON.YesIntent' ||
                request.intent.name === 'AMAZON.NoIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Sorry, didnt get that')
            .reprompt('Sorry, didnt get that')
            .getResponse();
    },
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequest,
        ExitHandler,
        SessionEndedRequest,
        SetNameIntent,
        SetRegionIntent,
        GetRegionIntent,
        GetNameIntent,
        GetRankIntent,
        HelpIntent,
        FallbackHandler,
        UnhandledIntent,
)
    .addErrorHandlers(ErrorHandler)
    .withTableName('leaguestats')
    .withAutoCreateTable(true)
    .lambda();