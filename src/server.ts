import { Router } from 'itty-router';
import {
  InteractionResponseType,
  InteractionType,
  verifyKey,
} from 'discord-interactions';
import { DOCBOT_COMMAND, EDIT_COMMAND } from './commands';
import { InteractionResponseFlags } from 'discord-interactions';
import { FlowFlags } from 'typescript';




export interface Env {
	DISCORD_PUBLIC_KEY: string;
	DISCORD_APPLICATION_ID: string;
	DISCORD_TOKEN: string;
	DISCORD_TEST_GUILD_ID: string;
	DB: D1Database;
}
class JsonResponse extends Response {
  constructor(body: any, init: any) {
    const jsonBody = JSON.stringify(body);
    init = init || {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    };
    super(jsonBody, init);
  }
}

const EDIT_MODAL_ID = "edit_modal";
const router = Router();
router.get('/', (request, env) => {
	console.log("Get request");
  return new Response(`👋 app id "${env.DISCORD_APPLICATION_ID}"; DISCORD_PUBLIC_KEY "${env.DISCORD_PUBLIC_KEY}"` );
});
router.post('/', async (request, env:Env) => {
	console.log("Got post");
  const { isValid, interaction } = await server.verifyDiscordRequest(
    request,
    env,
  );
  if (!isValid || !interaction) {
		console.log(`isvalid ${isValid}, interaction ${interaction}`);
    return new Response('Bad request signature.', { status: 401 });
  }
	console.log("valid post");
  if (interaction.type === InteractionType.PING) {
		console.log("Got ping");
    // The `PING` message is used during the initial webhook handshake, and is
    // required to configure the webhook in the developer portal.
    return new JsonResponse({
      type: InteractionResponseType.PONG,
    },{});
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {

		switch (interaction.data.name.toLowerCase()) {
      case DOCBOT_COMMAND.name.toLowerCase(): {
				let sendMessageUrl = `https://discord.com/api/channels/${interaction.channel_id}/messages`;

				await fetch(sendMessageUrl, {
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bot ${env.DISCORD_TOKEN}`,
					},
					method: 'POST',
					body: JSON.stringify({"content": interaction.data.options[0].value}),
				});

				return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Sent message!",
						flags: 1 << 6
          },
        },undefined);
      }
			case EDIT_COMMAND.name.toLowerCase():{
				let targetMsgId = interaction.data.target_id
				let authorId = interaction.data.resolved.messages[targetMsgId].author.id;
				if(authorId != env.DISCORD_APPLICATION_ID)
					return new JsonResponse({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: {
							content: "Can't edit others messages!",
							flags: 1 << 6
						},
					},undefined);


				return new JsonResponse({
          type: InteractionResponseType.MODAL,
          data: {
						"title": "Edit Message",
						"custom_id": EDIT_MODAL_ID,
						"components": [{
							"type": 1,
							"components": [
									{
										"type": 4,
										"custom_id": "message_id",
										"label": "Message id",
										"style": 1,
										"min_length": 1,
										"max_length": 4000,
										"value": targetMsgId,
										"required": true
									}
								]
							},
							{
								"type": 1,
								"components": [{
									"type": 4,
									"custom_id": "message_value",
									"label": "Message text",
									"style": 2,
									"min_length": 1,
									"max_length": 4000,
									"value": interaction.data.resolved.messages[targetMsgId].content,
									"required": true
								}]
							}
						]
          },
        },undefined);
			}
      default:
        return new JsonResponse({ error: 'Unknown Type' }, { status: 400 });
    }
  }

	else if (interaction.type === InteractionType.MODAL_SUBMIT){
		switch(interaction.data.custom_id){
			case EDIT_MODAL_ID:{
				let messageId = interaction.data.components[0].components[0].value;
				let messageValue = interaction.data.components[1].components[0].value;
				let messageUrl = `https://discord.com/api/channels/${interaction.channel_id}/messages/${messageId}`;
				console.log(messageUrl);
				let response = await fetch(messageUrl, {
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bot ${env.DISCORD_TOKEN}`,
					},
					method: "PATCH",
					body:JSON.stringify({content:messageValue}),
				});

				if(!response.ok){
					return new JsonResponse({
						type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
						data: {
							content: "Failed updating message!",
							flags: 1 << 6
						},
					},undefined);
				}

				return new JsonResponse({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: "Updated message successfully!",
						flags: 1 << 6
          },
        },undefined);
			}
		}
	}
});

router.all('*', () => new Response('Not Found.', { status: 404 }));

async function verifyDiscordRequest(request: any, env: Env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest =
    signature &&
    timestamp &&
    verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);
	console.log(`signature: "${signature}"; timestamp: "${timestamp}"; body: "${body}"; key: "${env.DISCORD_PUBLIC_KEY}"; isvalid: ${isValidRequest}`);
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body), isValid: true };
}

const server = {
  verifyDiscordRequest: verifyDiscordRequest,
  fetch: async function (request: any, env: Env) {
    return router.handle(request, env);
  },
};
export default server;
