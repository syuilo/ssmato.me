import { ICharacter } from './interfaces';

export type Token = ITextToken | IAnchorToken | ICharacterToken;

export interface IToken {
	type: string;
	text: string;
}

export interface ITextToken extends IToken {
	type: 'text';
}

export interface IAnchorToken extends IToken {
	type: 'anchor';
	target: string;
}

export interface ICharacterToken extends IToken {
	type: 'character-name';
	character: ICharacter;
}
