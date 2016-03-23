export interface IPost {
	number: number;
	text: string;
	user: IUser;
}

export interface IUser {
	name: string;
	id: string;
}

export interface ISS {
	title: string;
	posts: IPost[];
}
