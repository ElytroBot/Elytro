import { ActionRowBuilder, ApplicationCommandOptionChoiceData, AutocompleteInteraction, ButtonBuilder, ButtonInteraction, ChannelType, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, ModalBuilder, ModalSubmitInteraction, PrivateThreadChannel, RepliableInteraction, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, TextChannel, TextDisplayBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';
import { Button } from '../../structure/Button';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ticket')
		.setDescription('Commands related to tickets.')
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('info')
				.setDescription('Get information about a ticket.')
				.addStringOption(
					new SlashCommandStringOption()
						.setName('ticket')
						.setDescription('The ticket you want to get info about (defaults to the current ticket).')
						.setAutocomplete(true)
				)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const channel = await interaction.guild.channels
			.fetch(interaction.options.getString('ticket', false) ?? interaction.channelId)
			.catch(() => {});

		if (!channel || !channel.isThread() || channel.ownerId != interaction.client.user.id) {
			await reply(interaction, 'error', 'It doesn\'t look like this ticket exists.');
			return;
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Ticket Info',
					fields: [
						{
							name: 'Created At',
							value: `<t:${Math.floor(channel.createdAt.getTime() / 1000)}:f>`,
							inline: true
						},
						{
							name: 'Members',
							value: channel.memberCount.toString(),
							inline: true
						},
						{
							name: 'Locked',
							value: channel.locked ? '`Yes`' : '`No`',
							inline: true
						}
					]
				})
			],
			flags: MessageFlags.Ephemeral
		});
	},

	async onAutocompleteInteraction(interaction: AutocompleteInteraction) {
		const input = interaction.options.getFocused();
		const panels = await GuildModel
			.findById(interaction.guild.id)
			.then(doc => doc?.ticketing_panels ?? []);
		const tickets: ApplicationCommandOptionChoiceData[] = [];

		for (const panel of panels) {
			if (tickets.length >= 25) break;

			const fetched = await interaction.guild.channels
				.fetch(panel.channel)
				.then((channel: TextChannel) => channel.threads.fetch())
				.catch(() => {});

			if (!fetched) continue;

			tickets.push(...fetched.threads
				.filter(t =>
					t.ownerId == interaction.client.user.id
					&& t.name.toLowerCase().includes(input.toLowerCase())
				)
				.map(t => ({
					name: t.name,
					value: t.id
				}))
			);
		}

		await interaction.respond(tickets.slice(0, 25));
	},

	async onButtonInteraction(interaction: ButtonInteraction) {
		const [, action, threadId] = interaction.customId.split('|');

		if (action != 'open') {
			await interaction.showModal(new ModalBuilder({
				custom_id: `ticket|${action}|${threadId}`,
				title: 'Confirmation',
				components: [
					new TextDisplayBuilder({
						content: `Are you sure you want to ${action} this ticket?`
					}).toJSON()
				]
			}));
			return;
		}

		const channel = interaction.channel as TextChannel;
		const panel = await GuildModel
			.findById(interaction.guild.id)
			.then(doc => doc?.ticketing_panels?.find(p => p.channel == channel.id));

		if (!panel) {
			await reply(interaction, 'error', 'It doesn\'t look like this ticketing panel exists. Try contacting a moderator for assistance.');
			return;
		}

		await channel.threads
			.create({
				type: ChannelType.PrivateThread,
				name: interaction.user.displayName + '-' + Date.now()
					.toString(36)
					.toUpperCase(),
				invitable: false,
				reason: `Ticket created by ${interaction.user.displayName}`
			})
			.then(async thread => {
				await thread.members.add(interaction.user.id);
				return thread;
			})
			.then(
				thread => Promise.all([
					reply(interaction, 'success', `Your ticket has been created: ${thread.toString()}`),
					interaction.guild.channels
						.fetch(panel.transcripts_channel)
						.then((channel: TextChannel) => channel.send({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.primary,
									title: 'Ticket Created',
									description: thread.toString(),
									footer: {
										text: interaction.user.displayName,
										iconURL: interaction.user.avatarURL()
									}
								})
							],
							components: [getActionRow(thread.id, 'open')]
						}))
				]),
				() => reply(interaction, 'error', 'I do not have the required permissions. Try contacting a moderator for assistance.')
			);
	},

	async onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
		const [, action, threadId] = interaction.customId.split('|');
		const thread = (await interaction.guild.channels
			.fetch(threadId)
			.catch(() => {})) as PrivateThreadChannel | void;

		if (!thread) {
			await reply(interaction, 'error', 'It doesn\'t look like this ticket exists.');
			return;
		}

		switch (action) {
			case 'claim':
				await thread.members
					.add(interaction.user.id)
					.then(
						() => Promise.all([
							reply(interaction, 'success', 'You have successfully claimed this ticket.'),
							interaction.message?.edit({ components: [getActionRow(threadId, 'claim')] })
						]),
						() => reply(interaction, 'error', 'I do not have the required permissions.')
					);
				return;

			case 'close':
				await thread
					.setLocked(true, `Ticket closed by ${interaction.user.displayName}`)
					.then(
						() => Promise.all([
							reply(interaction, 'success', 'The ticket has been successfully closed.'),
							interaction.message?.edit({ components: [getActionRow(threadId, 'close')] })
						]),
						() => reply(interaction, 'error', 'I do not have the required permissions.')
					);
				return;

			case 'delete':
				await thread
					.delete(`Ticket deleted by ${interaction.user.displayName}`)
					.then(
						() => Promise.all([
							reply(interaction, 'success', 'The ticket has been successfully deleted.'),
							interaction.message?.edit({ components: [getActionRow(threadId, 'delete')] })
						]),
						() => reply(interaction, 'error', 'I do not have the required permissions.')
					);
		}
	}
} satisfies Command;

function getActionRow(thread: string, action: 'open' | 'claim' | 'close' | 'delete') {
	return new ActionRowBuilder<ButtonBuilder>({
		components: [
			Button.success({
				custom_id: `ticket|claim|${thread}`,
				label: 'Claim',
				emoji: '🎫',
				disabled: action != 'open'
			}),
			Button.secondary({
				custom_id: `ticket|close|${thread}`,
				label: 'Close',
				emoji: '🔒',
				disabled: action == 'close' || action == 'delete'
			}),
			Button.danger({
				custom_id: `ticket|delete|${thread}`,
				label: 'Delete',
				emoji: '🗑️',
				disabled: action == 'delete'
			})
		]
	});
}

async function reply(interaction: RepliableInteraction, type: 'success' | 'error', message: string) {
	return interaction.reply({
		embeds: [
			new EmbedBuilder({
				color: type == 'success' ? EmbedColor.success : EmbedColor.danger,
				description: message
			})
		],
		flags: MessageFlags.Ephemeral
	});
}