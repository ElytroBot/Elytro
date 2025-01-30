import { model, Schema } from 'mongoose';

const ReminderSchema = new Schema({
	_id: String,
	expiration: Number
});

const UserSchema = new Schema({
	_id: {
		type: String,
		required: true
	},
	reminders: [ReminderSchema],
	cooldowns: {
		type: Map,
		of: Number,
		default: new Map()
	},
	balance: {
		type: Number,
		default: 0
	},
	inventory: {
		type: Map,
		of: Number,
		default: new Map()
	},
	afk_status: String,
	background: String,
	accent: String
}, { versionKey: false });

export const UserModel = model<UserDocument>('User', UserSchema);

export interface UserDocument {
	_id: string;
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