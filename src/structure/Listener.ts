/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Listener {
	once?: boolean;
	execute(...params: any): Promise<void>;
}