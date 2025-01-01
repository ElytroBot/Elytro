import { EmbedBuilder, Interaction, RepliableInteraction } from 'discord.js';
import { Listener } from '../structure/Listener';
import { EmbedColor } from '../structure/EmbedColor';

module.exports = {
	async execute(interaction: Interaction) {
		if (interaction.isCommand()) {
			interaction.client.commands
				.find(command => interaction.commandName == command.data.name)
				.onCommandInteraction(interaction)
				.catch((error: Error) => reportError(error, interaction));

			const random = Math.round(Math.random() * 50);

			if (random == 0) {
				await interaction.fetchReply();
				interaction.followUp({
					embeds: [
						new EmbedBuilder({
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
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Vote',
							description: 'Support Elytro by [voting](https://top.gg/bot/904730769929429072/vote).'
						})
					],
					ephemeral: true
				});
			}
		}
		else if (interaction.isButton()) {
			interaction.client.commands
				.find(command => {
					if (interaction.message.interaction)
						return interaction.message.interaction.commandName
							.split(' ')[0] == command.data.name;
					else
						return interaction.customId.split('|')[0] == command.data.name;
				})
				.onButtonInteraction(interaction)
				.catch((error: Error) => reportError(error, interaction));
		}
		else if (interaction.isAnySelectMenu()) {
			interaction.client.commands
				.find(command =>
					interaction.message.interaction.commandName.split(' ')[0] == command.data.name)
				.onSelectMenuInteraction(interaction)
				.catch((error: Error) => reportError(error, interaction));
			return;
		}
		else if (interaction.isModalSubmit()) {
			interaction.client.commands
				.find(command => command.data.name == interaction.customId.split('|')[0])
				.onModalSubmitInteraction(interaction)
				.catch((error: Error) => reportError(error, interaction));
			return;
		}
		else if (interaction.isAutocomplete()) {
			interaction.client.commands
				.find(command => interaction.commandName == command.data.name)
				.onAutocompleteInteraction(interaction)
				.catch((e: Error) =>
					console.error(`[${new Date().toISOString()}] ${e.stack}`));
		}
	}
} satisfies Listener;

function reportError(e: Error, interaction: RepliableInteraction) {
	interaction.reply({
		embeds: [
			new EmbedBuilder({
				color: EmbedColor.danger,
				title: 'Error',
				description: `An unknown error has occurred. You can report this error by using </report:1306353943042986016> or by joining our [Discord server](https://discord.gg/KCY2RERtxk).\`\`\`${e.message}\`\`\``
			})
		],
		ephemeral: true
	});
	console.error(`[${new Date().toISOString()}] ${e.stack}`);
}