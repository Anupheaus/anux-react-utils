import { useState, useContext } from 'react';
import { IStore, StoreTypeId } from './models';
import { IMap } from 'anux-common';
import { useOnUnmount } from '../useOnUnmount';
import { StoreContext } from './context';
import { stores } from './stores';
import { Store } from './store';

export function useStore<TData extends IMap, TActions extends IMap>(store: IStore<TData, TActions>): [TData, TActions];
export function useStore<TData extends IMap, TActions extends IMap, TSelection extends IMap>(storeType: IStore<TData, TActions>,
  selector: (data: TData) => TSelection): [TSelection, TActions];
export function useStore<TData extends IMap, TActions extends IMap, TSelection extends IMap>(storeType: IStore<TData, TActions>,
  selector: (data: TData) => TSelection, onChange: (data: TSelection) => void): [TSelection, TActions];
export function useStore<TData extends IMap, TActions extends IMap, TSelection extends IMap = TData>(storeType: IStore<TData, TActions>,
  selector?: (data: TData) => TSelection, onChange?: (data: TSelection) => void): [TSelection, TActions] {
  if (!storeType) { throw new Error('The store provided was invalid.'); }

  const storeTypeId = storeType[StoreTypeId];
  if (!storeTypeId) { throw new Error('The store type id could not be found on the store type provided.'); }

  const { [storeTypeId]: storeId } = useContext(StoreContext);
  if (!storeId) { throw new Error('The store id could not be found within the current context for this store type.'); }

  const store = stores[storeId] as Store<TData, TActions>;
  if (!store) { throw new Error('The store could not be found within the collection of active stores; perhaps it has been disposed?'); }

  selector = selector || (data => data as any);
  const [selection, updateSelection] = useState<TSelection>(selector(store.data));

  const unregisterCallback = store.register((data: TData) => {
    const newSelection = selector(data);
    if (Reflect.areDeepEqual(newSelection, selection)) { return; }
    updateSelection(newSelection);
    if (onChange) { onChange(newSelection); }
  });

  useOnUnmount(() => {
    unregisterCallback();
  });

  return [selection, store.actions];
}