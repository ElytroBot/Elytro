import { ChatInputCommandInteraction, ButtonInteraction, SlashCommandBuilder, SlashCommandSubcommandBuilder, InteractionContextType, ApplicationIntegrationType, ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, ModalSubmitInteraction, MessageFlags, ContainerBuilder, TextDisplayBuilder, SectionBuilder, SeparatorBuilder, ActionRowBuilder, ButtonBuilder, SlashCommandStringOption, AutocompleteInteraction } from 'discord.js';
import { ReminderDocument, ReminderModel } from '../../schemas/Reminder';
import { Button } from '../../structure/Button';
import emojis from '../../json/emojis.json';
import { CronosExpression, CronosTask, validate } from 'cronosjs';
import { Messages } from '../../structure/Messages';
import { Color } from '../../structure/Color';
import { openai, client } from '../../clients';

export default {
	data: new SlashCommandBuilder()
		.setName('reminders')
		.setDescription('Commands related to the reminder system.')
		.setContexts(
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		)
		.setIntegrationTypes(
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('view')
				.setDescription('View your reminders.')
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('invite')
				.setDescription('Make a reminder invite.')
				.addStringOption(
					new SlashCommandStringOption()
						.setName('reminder')
						.setDescription('The reminder for which you want to make an invitation.')
						.setRequired(true)
						.setAutocomplete(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('create')
				.setDescription('Create a new reminder.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		switch (interaction.options.getSubcommand()) {
			case 'view':
				await interaction.reply(await paginate(1, interaction.user.id));
				return;

			case 'invite':
				const reminder = await ReminderModel.findById(interaction.options.getString('reminder'));

				if (!reminder) {
					await interaction.reply(Messages.ephemeral(Color.Danger, 'This reminder does not exist.'));
					return;
				}
				else if (reminder.visibility == 'PRIVATE') {
					await interaction.reply(Messages.ephemeral(Color.Danger, 'This reminder is private.'));
					return;
				}

				await interaction.reply({
					components: [buildReminderCard(reminder)],
					flags: MessageFlags.IsComponentsV2
				});
				return;

			case 'create':
				await interaction.showModal(
					new ModalBuilder()
						.setCustomId('reminders')
						.setTitle('New Reminder')
						.addLabelComponents(
							new LabelBuilder()
								.setLabel('Time')
								.setDescription('When you want to be reminded.')
								.setTextInputComponent(
									new TextInputBuilder()
										.setCustomId('time')
										.setStyle(TextInputStyle.Short)
										.setMaxLength(100)
								),
							new LabelBuilder()
								.setLabel('Title')
								.setDescription('A short title for the reminder.')
								.setTextInputComponent(
									new TextInputBuilder()
										.setCustomId('title')
										.setStyle(TextInputStyle.Short)
										.setMaxLength(50)
								),
							new LabelBuilder()
								.setLabel('Topic')
								.setDescription('What the reminder is about.')
								.setTextInputComponent(
									new TextInputBuilder()
										.setCustomId('topic')
										.setStyle(TextInputStyle.Paragraph)
										.setMaxLength(200)
								),
							new LabelBuilder()
								.setLabel('Visibility')
								.setDescription('Who can join the reminder.')
								.setStringSelectMenuComponent(
									new StringSelectMenuBuilder()
										.setCustomId('visibility')
										.addOptions(
											{
												label: 'Public',
												description: 'Anyone can subscribe to this reminder.',
												value: 'PUBLIC',
												default: true
											},
											{
												label: 'Private',
												description: 'Only you can subscribe to this reminder.',
												value: 'PRIVATE'
											}
										)
								)
						)
				);
		}
	},

	async onAutocompleteInteraction(interaction: AutocompleteInteraction) {
		const reminders = await ReminderModel.find({
			subscribers: interaction.user.id,
			visibility: 'PUBLIC'
		});

		await interaction.respond(
			reminders.map(r => ({ name: `${r.title} - ${r.topic}`.slice(0, 100), value: r.id }))
		);
	},

	async onButtonInteraction(interaction: ButtonInteraction) {
		const [, action, ...data] = interaction.customId.split('|');

		switch (action) {
			case 'view':
				await interaction.update(await paginate(Number(data[0]), interaction.user.id));
				return;

			case 'subscribe':
				const reminder = await ReminderModel.findOneAndUpdate(
					{ _id: data[0] },
					[{
						$set: {
							subscribers: {
								$cond: [
									{ $in: [interaction.user.id, '$subscribers'] },
									{ $setDifference: ['$subscribers', [interaction.user.id]] },
									{ $concatArrays: ['$subscribers', [interaction.user.id]] }
								]
							}
						}
					}],
					{ updatePipeline: true, returnDocument: 'after' }
				);

				if (!reminder) {
					await interaction.reply(Messages.ephemeral(Color.Danger, 'This reminder no longer exists.'));
					return;
				}

				await Promise.all([
					interaction.reply(
						Messages.ephemeral(
							Color.Success,
							reminder.subscribers.includes(interaction.user.id)
								? 'You have subscribed to this reminder.'
								: 'You have unsubscribed from this reminder.'
						)
					),
					interaction.webhook.editMessage(interaction.message, {
						components: [buildReminderCard(reminder)]
					})
				]);
				return;

			case 'unsubscribe':
				const result = await ReminderModel.updateOne(
					{ _id: data[0] },
					{ $pull: { subscribers: interaction.user.id } }
				);

				await Promise.all([
					interaction.reply(
						result.matchedCount == 0
							? Messages.ephemeral(Color.Danger, 'This reminder no longer exists.')
							: result.modifiedCount == 0
								? Messages.ephemeral(Color.Danger, 'You are already unsubscribed from this reminder.')
								: Messages.ephemeral(Color.Success, 'You have unsubscribed from this reminder.')
					),
					interaction.webhook.editMessage(
						interaction.message,
						await paginate(Number(data[1]), interaction.user.id)
					)
				]);
		}
	},

	async onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
		let cron;

		try {
			cron = await generateCron(interaction.fields.getTextInputValue('time'));
		}
		catch (e) {
			await interaction.reply(Messages.ephemeral(Color.Danger, (e as Error).message));
			return;
		}

		const visibility = interaction.fields.getStringSelectValues('visibility')[0];
		const reminder = await ReminderModel.create({
			schedule: cron,
			title: interaction.fields.getTextInputValue('title'),
			topic: interaction.fields.getTextInputValue('topic'),
			visibility: visibility,
			subscribers: [interaction.user.id]
		});

		schedule(reminder);

		await interaction.reply({
			components: [buildReminderCard(reminder)],
			flags: MessageFlags.IsComponentsV2 | (visibility == 'PRIVATE' ? MessageFlags.Ephemeral : 0)
		});
	}
};

async function paginate(page: number, user: string) {
	const reminders = await ReminderModel.find({ subscribers: user });
	const pages = Math.max(Math.ceil(reminders.length / 5), 1);
	page = Math.min(page, pages);

	return {
		components: [
			new ContainerBuilder()
				.setAccentColor(Color.Primary)
				.addTextDisplayComponents(new TextDisplayBuilder().setContent('### Reminders'))
				.addSectionComponents(
					reminders
						.slice((page - 1) * 5, page * 5)
						.map(
							r => new SectionBuilder()
								.addTextDisplayComponents(
									new TextDisplayBuilder()
										.setContent(`**${r.title}**\n-# ${r.topic}\n-# 🗓️ ${getNextTimestamp(r.schedule)}`)
								)
								.setButtonAccessory(
									Button.danger({
										custom_id: `reminders|unsubscribe|${r._id}|${page}`,
										label: 'Unsubscribe',
										emoji: '🔕'
									})
								)
						)
				)
				.addTextDisplayComponents(
					...reminders.length == 0
						? [new TextDisplayBuilder().setContent('You have no reminders.')]
						: []
				)
				.addSeparatorComponents(new SeparatorBuilder())
				.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Page ${page}/${pages}`))
				.addActionRowComponents(
					new ActionRowBuilder<ButtonBuilder>()
						.addComponents(
							Button.primary({
								custom_id: `reminders|view|${page - 1}`,
								emoji: emojis.back,
								disabled: page == 1
							}),
							Button.primary({
								custom_id: `reminders|view|${page}`,
								emoji: emojis.refresh
							}),
							Button.primary({
								custom_id: `reminders|view|${page + 1}`,
								emoji: emojis.forward,
								disabled: page == pages
							})
						)
				)
		],
		flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
	};
}

function buildReminderCard(reminder: ReminderDocument) {
	return new ContainerBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder()
				.setContent(`## ${reminder.title}\n${reminder.topic}`)
		)
		.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(
					new TextDisplayBuilder()
						.setContent(`🗓️ ${getNextTimestamp(reminder.schedule)}`)
				)
				.setButtonAccessory(
					Button.success({
						custom_id: `reminders|subscribe|${reminder._id}`,
						label: `${reminder.subscribers.length.toLocaleString()} Subscribed`,
						emoji: '🔔'
					})
				)
		);
}

function getNextTimestamp(schedule: string) {
	const date = CronosExpression.parse(schedule, { timezone: 'UTC' }).nextDate();

	return date ? `<t:${Math.floor(date.getTime() / 1000)}:R>` : '`never`';
}

export function schedule(reminder: ReminderDocument) {
	new CronosTask(CronosExpression.parse(reminder.schedule, { timezone: 'UTC' }))
		.on('run', async () =>
			ReminderModel.findById(reminder._id).then(reminder =>
				Promise.all(
					reminder?.subscribers.map(id =>
						client.users
							.fetch(id)
							.then(user => user.send({
								components: [buildReminderCard(reminder!)],
								flags: MessageFlags.IsComponentsV2
							}))
							.catch(() => {})
					) ?? []
				)
			)
		)
		.on('ended', async () => ReminderModel.findByIdAndDelete(reminder._id))
		.start();
}

async function generateCron(input: string) {
	const schedule = (await openai.responses.create({
		model: 'openai/gpt-oss-20b',
		instructions:
			`Your job is to convert natural language into a valid cron string with these exactly 7 fields:

			Field              Allowed values    Special symbols
			-----------------  ---------------   ---------------
			Second             0-59              * / , -
			Minute             0-59              * / , -
			Hour               0-23              * / , -
			Day of Month       1-31              * / , - ? L W
			Month              1-12 or JAN-DEC   * / , -
			Day of Week        0-7 or SUN-SAT    * / , - ? L #
			Year               0-275759          * / , -

			Obey the following rules:

			1. Always output a valid cron string with the exact fields defined above.
			2. Output the cron string in UTC. Convert from another timezone if specified.
			3. Generate a one time cron if and only if the user explicitly uses relative language.
			4. If the user input is ambiguous, make the best possible guess based on common usage while following the above rules.`,
		input:
			`CURRENT_TIME: ${new Date().toISOString()}
			USER_TEXT: ${input}`,
		temperature: 0
	})).output_text.trim();
	const nextDate = CronosExpression.parse(schedule, { timezone: 'UTC' }).nextDate();

	if (
		!validate(schedule)
		|| !/^\S+( +\S+){6}$/.test(schedule)
	)
		throw new Error('It seems we failed to process your input. Please try again with a different input.');
	else if (nextDate == null)
		throw new Error('It seems that your input is a past date. Please try again with a future date.');
	else if (nextDate.getTime() - Date.now() > 3.154e+10)
		throw new Error('It seems that your input is too far in the future. Please try again with a date within the next year.');
	else if (!/^\d+ /.test(schedule)) // If the seconds field is not a number the schedule runs more than once a minute
		throw new Error('Your input seems to be repeating too often. Please try again with a less frequent schedule.');

	return schedule;
}