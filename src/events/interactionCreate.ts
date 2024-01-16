import { Interaction, RepliableInteraction } from 'discord.js';
import { DiscordEvent } from '../structure/DiscordEvent';
import { Embed, EmbedColor } from '../structure/Embed';

module.exports = {
	async execute(interaction: Interaction) {
		if (interaction.isCommand()) {
			interaction.client.commands
				.find(command => interaction.commandName == command.data.name)
				.onCommandInteraction(interaction)
				.catch((error: Error) => {
					reportError(error, interaction);
				});

			const random = Math.round(Math.random() * 20);

			if (random == 0) {
				await interaction.fetchReply();
				interaction.followUp({
					embeds: [
						new Embed({
							color: EmbedColor.primary,
							title: 'Leave a Review',
							description: 'Do you like what your seeing? Don\'t forget to leave us a [review](https://top.gg/bot/904730769929429072#reviews).'
						})
					],
					ephemeral: true
				});
			}
			else if (random == 1) {
				await interaction.fetchReply();
				interaction.followUp({
					embeds: [
						new Embed({
							color: EmbedColor.primary,
							title: 'Vote',
							description: 'Support elias bot by [voting](https://top.gg/bot/904730769929429072/vote).'
						})
					],
					ephemeral: true
				});
			}
		}

		if (interaction.isButton()) {
			interaction.client.commands
				.find(
					command => interaction.message.interaction.commandName
						.split(' ')[0] == command.data.name
				)
				.onButtonInteraction(interaction)
				.catch((error: Error) => {
					reportError(error, interaction);
				});
			return;
		}

		if (interaction.isAnySelectMenu()) {
			interaction.client.commands
				.find(
					command => interaction.message.interaction.commandName
						.split(' ')[0] == command.data.name
				)
				.onSelectMenuInteraction(interaction)
				.catch((error: Error) => {
					reportError(error, interaction);
				});
			return;
		}

		if (interaction.isModalSubmit()) {
			interaction.client.commands
				.find(
					command => command.data.name == interaction.customId.split('|')[0]
				)
				.onModalSubmitInteraction(interaction)
				.catch((error: Error) => {
					reportError(error, interaction);
				});
			return;
		}
	},
} satisfies DiscordEvent;

function reportError(error: Error, interaction: RepliableInteraction) {
	interaction.reply({
		embeds: [
			new Embed({
				color: EmbedColor.danger,
				title: 'Error',
				description: `An unknown error has occurred. Please report this to the [devs](https://discord.gg/KCY2RERtxk).\`\`\`${error.message}\`\`\``,
			}),
		],
		ephemeral: true,
	});
	console.log(error);
}