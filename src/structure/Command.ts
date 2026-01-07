/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnySelectMenuInteraction, AutocompleteInteraction, ButtonInteraction, CommandInteraction, ModalSubmitInteraction } from 'discord.js';

export interface Command {
	data: any;
	onCommandInteraction(interaction: CommandInteraction): Promise<void>;
	onButtonInteraction?(interaction: ButtonInteraction): Promise<void>;
	onSelectMenuInteraction?(interaction: AnySelectMenuInteraction): Promise<void>;
	onModalSubmitInteraction?(interaction: ModalSubmitInteraction): Promise<void>;
	onAutocompleteInteraction?(interaction: AutocompleteInteraction): Promise<void>;
}