import { ICharacter } from './interfaces';

export type Token = ITextToken | IAnchorToken | ICharacterNameToken;

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

export interface ICharacterNameToken extends IToken {
	type: 'character-name';
	character: ICharacter;
}
