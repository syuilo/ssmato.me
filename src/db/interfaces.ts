//////////////////////////////////////////////////
// INTERFACES OF MODEL
//////////////////////////////////////////////////

import {Document, Types} from 'mongoose';

export interface IReadLater extends Document {
	createdAt: Date;
	user: string | Types.ObjectId | IUser;
	ss: string | Types.ObjectId | ISS;
}

export interface IFavorite extends Document {
	createdAt: Date;
	user: string | Types.ObjectId | IUser;
	ss: string | Types.ObjectId | ISS;
}

export interface IHistory extends Document {
	createdAt: Date;
	user: string | Types.ObjectId | IUser;
	ss: string | Types.ObjectId | ISS;
}

export interface ISeries extends Document {
	createdAt: Date;
	title: string;
	kana: string;
	aliases: string[];
	description: string;
	ssCount: number;
}

export interface ICharacter extends Document {
	createdAt: Date;
	bio: string;
	gender: string;
	image: Buffer;
	name: string;
	kana: string;
	screenName: string;
	aliases: string[];
	color: string;
	series: string[] | Types.ObjectId[] | ISeries[];
	ssCount: number;
}

export interface ISSTag extends Document {
	name: string;
}

export interface IUser extends Document {
	createdAt: Date;
	description: string;
	email: string;
	encryptedPassword: string;
	isDeleted: Boolean;
	isAdmin: Boolean;
	isSuspended: Boolean;
	name: string;
	screenName: string;
	screenNameLower: string;
}

export interface ISS extends Document {
	createdAt: Date;
	type: string;
	isDeleted: Boolean;
	title: string;
	series: string[] | Types.ObjectId[] | ISeries[];
	characters: {
		profile: string | Types.ObjectId | ICharacter;
		onStageRatio: number;
	}[];
	tags: string[] | Types.ObjectId[] | ISSTag[];
	favoritesCount: number;
	commentsCount: number;
	views: string[];
}

export interface ISSThread extends ISS {
	url: string;
	type: 'thread';
	posts: ISSThreadPost[];
}

export interface ISSThreadPost extends Document {
	createdAt: Date;
	text: string;
	html: string;
	number: number;
	userId: string;
	userIdBackgroundColor: string;
	userIdForegroundColor: string;
	userName: string;
	isMaster: boolean;
	isAA: boolean;
	ratings: ISSThreadPostRating[];
}

export interface ISSThreadPostRating extends Document {
	createdAt: Date;
	user: string | Types.ObjectId | IUser;
	rating: string;
}
