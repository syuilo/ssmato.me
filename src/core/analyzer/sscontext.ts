import { ISeries, ICharacter, IPost } from './interfaces';

/**
 * 解析済みSSクラスです
 * @class SSContext
 */
export default class SSContext {

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
	constructor(
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
