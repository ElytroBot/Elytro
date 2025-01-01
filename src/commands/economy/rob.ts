import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandUserOption, User } from 'discord.js';
import { Command } from '../../structure/Command';
import { transfer, UserDocument, UserModel } from '../../schemas/User';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rob')
		.setDescription('Try to rob someone.')
		.addUserOption(
			new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user you want to rob.')
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getUser('user');

		if (target.id == interaction.user.id) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You cannot rob yourself.'
					})
				],
				ephemeral: true
			});
			return;
		}

		if (target.bot) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You cannot rob a bot.'
					})
				],
				ephemeral: true
			});
			return;
		}

		const dbUser = await UserModel.findById(interaction.user.id);

		if (!dbUser || dbUser.balance < 10000) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: `You need to have at least 10,000 ${emojis.coin} to rob someone.`
					})
				],
				ephemeral: true
			});
			return;
		}

		const dbTarget = await UserModel.findById(target.id);

		if (!dbTarget || dbTarget.balance < 10000) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: `You cannot rob a user with less than 10,000 ${emojis.coin}`
					})
				],
				ephemeral: true
			});
			return;
		}

		const now = Math.floor(Date.now() / 1000);
		
		if (dbUser.cooldowns.get('rob') > now) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: `You are on cooldown! Come back <t:${dbUser.cooldowns.get('rob')}:R>`
					})
				],
				ephemeral: true
			});
			return;
		}

		if (dbTarget.inventory.get('Security Camera') > 0) {
			const count = dbTarget.inventory.get('Security Camera');
			if (Math.random() < Math.pow(.15, count))
				success(interaction, dbUser, dbTarget, interaction.user, target);
			else bust(interaction, dbUser, dbTarget, target);

			dbUser.cooldowns.set('rob', now + 35);
			dbUser.save();
			dbTarget.save();
			return;
		}

		if (!(dbTarget.inventory.get('Lock') > 0)) {
			const random = Math.round(Math.random() * 100);

			if (random < 75)
				success(interaction, dbUser, dbTarget, interaction.user, target);
			else bust(interaction, dbUser, dbTarget, target);

			dbUser.cooldowns.set('rob', now + 35);
			dbUser.save();
			dbTarget.save();
			return;
		}

		if (dbUser.inventory.get('Lockpick') > 0) {
			const random = Math.round(Math.random() * 100);

			if (random < 25) {
				success(interaction, dbUser, dbTarget, interaction.user, target);
				dbTarget.inventory.set('Lock', dbTarget.inventory.get('Lock') - 1);
			}
			else {
				bust(interaction, dbUser, dbTarget, target);
				dbUser.inventory.set('Lockpick', dbUser.inventory.get('Lockpick') - 1);
			}
		}
		else bust(interaction, dbUser, dbTarget, target);

		dbUser.cooldowns.set('rob', now + 35);
		dbUser.save();
		dbTarget.save();
	}
} satisfies Command;

function success(interaction: ChatInputCommandInteraction, dbUser: UserDocument,
	dbTarget: UserDocument, user: User, target: User) {
	const money = transfer(
		dbTarget,
		dbUser,
		Math.floor(Math.random() * (dbTarget.balance * .25 - 5000)) + 5000
	).toLocaleString();

	interaction.reply({
		embeds: [
			new EmbedBuilder({
				color: EmbedColor.success,
				title: 'Success',
				description: `You managed to steal ${money} ${emojis.coin} from ${target}.`
			})
		]
	});

	target.send({
		embeds: [
			new EmbedBuilder({
				color: EmbedColor.danger,
				title: 'Theft Alert',
				description: `${user} stole ${money} ${emojis.coin} from you.`
			})
		]
	});
}

function bust(interaction: ChatInputCommandInteraction, dbUser: UserDocument,
	dbTarget: UserDocument, target: User) {
	const money = transfer(
		dbUser,
		dbTarget,
		Math.round(Math.random() * 5000 + 5000)
	).toLocaleString();

	interaction.reply({
		embeds: [
			new EmbedBuilder({
				color: EmbedColor.danger,
				title: 'Bust',
				description: `You got caught and had to pay ${target} ${money} ${emojis.coin}.`
			})
		]
	});
}