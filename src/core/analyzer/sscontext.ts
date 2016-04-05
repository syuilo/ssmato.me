import { ISeries, ICharacter, IPost } from './interfaces';

/**
 * 解析済みSSクラスです
 * @class SSContext
 */
export default class SSContext {

	/**
	 * SSの識別子
	 */
	public id: string;

	/**
	 * SSのシリーズ
	 */
	public series: ISeries[] = null;

	/**
	 * このSSに登場するキャラクター
	 */
	public characters: (ICharacter & {
		onStageRatio: number;
	})[] = null;

	/**
	 * SSの投稿
	 */
	public posts: (IPost & {
		isMaster: boolean;
		user: {
			backgroundColor: string;
			foregroundColor: string
		}
	})[] = null;

	constructor();
	constructor(id?: string);
	constructor(
		id?: string,
		series?: ISeries[],
		characters?: (ICharacter & {
			onStageRatio: number;
		})[],
		posts?: (IPost & {
			isMaster: boolean;
			user: {
				backgroundColor: string;
				foregroundColor: string
			}
		})[]
	) {
		if (id !== undefined) {
			this.id = id;
		}

		if (series !== undefined) {
			this.series = series;
		}

		if (characters !== undefined) {
			this.characters = characters;
		}

		if (posts !== undefined) {
			this.posts = posts;
		}
	}
}
