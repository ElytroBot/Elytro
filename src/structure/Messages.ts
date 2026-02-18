import { EmbedBuilder, MessageFlags } from 'discord.js';
import { Color } from './Color';

export class Messages {
	static ephemeral(color: Color, description: string) {
		return {
			embeds: [
				new EmbedBuilder({
					color: color,
					description: description
				})
			],
			flags: MessageFlags.Ephemeral | 0
		};
	}

	static cooldown(end: number) {
		return this.ephemeral(Color.Danger, `You are on cooldown! Come back <t:${end}:R>`);
	}

	static MissingPermissions = this.ephemeral(Color.Danger, 'I do not have the required permissions.');
	static ComponentUseNotAllowed = this.ephemeral(Color.Danger, 'You are not allowed to use this component!');
	static HigherRole = this.ephemeral(Color.Danger, 'You do not have a higher role than the target member.');
	static MemberNotFound = this.ephemeral(Color.Danger, 'Could not find this user in this server.');
}