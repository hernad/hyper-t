/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'css!./media/tree';
import { Iterator, ISequence } from 'base/common/iterator';
import { AbstractTree, ITreeOptions } from 'base/browser/ui/tree/abstractTree';
import { ISpliceable } from 'base/common/sequence';
import { IndexTreeModel } from 'base/browser/ui/tree/indexTreeModel';
import { ITreeElement, ITreeModel, ITreeNode } from 'base/browser/ui/tree/tree';

export class IndexTree<T, TFilterData = void> extends AbstractTree<T, TFilterData, number[]> {

	protected model: IndexTreeModel<T, TFilterData>;

	splice(location: number[], deleteCount: number, toInsert: ISequence<ITreeElement<T>> = Iterator.empty()): Iterator<ITreeElement<T>> {
		return this.model.splice(location, deleteCount, toInsert);
	}

	protected createModel(view: ISpliceable<ITreeNode<T, TFilterData>>, options: ITreeOptions<T, TFilterData>): ITreeModel<T, TFilterData, number[]> {
		return new IndexTreeModel(view, options);
	}
}