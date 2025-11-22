import { model, Schema } from 'mongoose';

const ReminderSchema = new Schema({
	_id: {
		type: String,
		required: true
	},
	expiration: {
		type: Number,
		required: true
	}
});

const UserSchema = new Schema({
	_id: {
		type: String,
		required: true
	},
	reminders: {
		type: [ReminderSchema],
		default: () => [],
		required: true
	},
	cooldowns: {
		type: Map,
		of: Number,
		default: () => new Map(),
		required: true
	},
	balance: {
		type: Number,
		default: 0,
		required: true
	},
	inventory: {
		type: Map,
		of: Number,
		default: () => new Map(),
		required: true
	},
	afk_status: {
		type: String,
		default: null
	},
	background: {
		type: String,
		default: null
	},
	accent: {
		type: String,
		default: null
	}
}, { versionKey: false });

export const UserModel = model<UserDocument>('User', UserSchema);

export interface UserDocument {
	_id: string | null;
	cooldowns: Map<string, number>;
	reminders: { _id: string, expiration: number }[];
	balance: number;
	inventory: Map<string, number>;
	afk_status: string;
	background: string,
	accent: string
}

export function transfer(giver: UserDocument, receiver: UserDocument, amount: number) {
	giver.balance -= amount;
	receiver.balance += amount;

	return amount;
}