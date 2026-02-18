import { EmbedBuilder, Interaction, MessageFlags } from 'discord.js';
import { Listener } from '../structure/Listener';
import { Color } from '../structure/Color';
import tips from '../json/tips.json';

module.exports = {
	async execute(interaction: Interaction) {
		if (interaction.isCommand()) {
			await interaction.client.commands
				.find(command => interaction.commandName == command.data.name)
				.onCommandInteraction(interaction)
				.catch(e => reportError(e, interaction));

			if (Math.random() < 0.025) {
				await interaction
					.fetchReply()
					.then(() => interaction.followUp({
						embeds: [
							new EmbedBuilder({
								color: Color.Primary,
								...tips[Math.floor(Math.random() * tips.length)]
							})
						],
						flags: MessageFlags.Ephemeral
					}));
			}
		}
		else if (interaction.isButton()) {
			await interaction.client.commands
				.find(command => {
					if (interaction.message.interaction)
						return interaction.message.interaction.commandName
							.split(' ')[0] == command.data.name;
					else
						return interaction.customId.split('|')[0] == command.data.name;
				})
				.onButtonInteraction(interaction)
				.catch(e => reportError(e, interaction));
		}
		else if (interaction.isAnySelectMenu()) {
			await interaction.client.commands
				.find(command =>
					interaction.message.interaction.commandName.split(' ')[0] == command.data.name)
				.onSelectMenuInteraction(interaction)
				.catch(e => reportError(e, interaction));
		}
		else if (interaction.isModalSubmit()) {
			await interaction.client.commands
				.find(command => command.data.name == interaction.customId.split('|')[0])
				.onModalSubmitInteraction(interaction)
				.catch(e => reportError(e, interaction));
		}
		else if (interaction.isAutocomplete()) {
			await interaction.client.commands
				.find(command => interaction.commandName == command.data.name)
				.onAutocompleteInteraction(interaction)
				.catch(e => reportError(e, interaction));
		}
	}
} satisfies Listener;

async function reportError(e: Error, interaction: Interaction) {
	console.error(`[${new Date().toISOString()}] ${e.stack}`);

	if (interaction.isRepliable()) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: Color.Danger,
					title: 'Error',
					description: `An unknown error has occurred. You can report this error by using </report:1336358732086640708> or by joining our [Discord server](https://discord.gg/KCY2RERtxk).\`\`\`${e.message}\`\`\``
				})
			],
			flags: MessageFlags.Ephemeral
		});
	}
}