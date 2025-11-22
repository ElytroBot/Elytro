import { model, Schema } from 'mongoose';

const WarnSchema = new Schema({
	_id: {
		type: String,
		required: true,
		default: () => Date.now()
			.toString(36)
			.toUpperCase()
	},
	user_id: {
		type: String,
		required: true
	},
	reason: {
		type: String,
		default: null
	}
});

const LevelingRewardSchema = new Schema({
	level: {
		type: Number,
		required: true
	},
	role: {
		type: String,
		required: true
	}
}, { _id: false });

const TicketingPanel = new Schema({
	channel: {
		type: String,
		required: true
	},
	message: {
		type: String,
		required: true
	},
	transcripts_channel: {
		type: String,
		required: true
	}
}, { _id: false });

const MessageSchema = new Schema({
	channel: {
		type: String,
		required: true
	},
	content: {
		type: String,
		required: true
	}
}, { _id: false });

const GuildSchema = new Schema({
	_id: {
		type: String,
		required: true
	},
	plugins: {
		type: [String],
		default: () => [],
		required: true
	},
	warns: {
		type: [WarnSchema],
		default: () => [],
		required: true
	},
	xp: {
		type: Map,
		of: Number,
		default: () => new Map(),
		required: true
	},
	leveling_message: {
		type: MessageSchema,
		default: null
	},
	leveling_rewards: {
		type: [LevelingRewardSchema],
		default: () => [],
		required: true
	},
	join_message: {
		type: MessageSchema,
		default: null
	},
	leave_message: {
		type: MessageSchema,
		default: null
	},
	ticketing_panels: {
		type: [TicketingPanel],
		default: () => [],
		required: true
	}
}, { versionKey: false });

export const GuildModel = model('Guild', GuildSchema);

export function getLevel(xp: number) {
	return Math.floor(Math.sqrt(xp / 50 + .25) - .5);
}

export function getXP(level: number) {
	return level * (level + 1) * 50;
}