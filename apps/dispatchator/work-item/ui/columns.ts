import type { ReactNode } from "react";
import { useMemo } from "react";

export type CellContext<T = unknown> = T;

export type ColumnDef<T> =
	| {
			key: string;
			width: number;
			flex?: never;
			label?: string;
			render: (ctx: T) => ReactNode;
	  }
	| {
			key: string;
			flex: number;
			width?: never;
			label?: string;
			render: (ctx: T) => ReactNode;
	  };

export type ResolvedColumn<T> = {
	key: string;
	width: number;
	label?: string;
	render: (ctx: T) => ReactNode;
};

export type ColumnLayout<T> = {
	inline: ResolvedColumn<T>[];
	overflow: ResolvedColumn<T>[];
	overflowIndent: number;
	linesPerItem: number;
};

const OVERFLOW_PREFIX = 6;
const FLEX_MIN = 20;

export function resolveColumns<T>(
	columns: ColumnDef<T>[],
	termWidth: number,
): ColumnLayout<T> {
	const inline: ResolvedColumn<T>[] = [];
	const overflow: ResolvedColumn<T>[] = [];
	let used = 0;

	for (const col of columns) {
		if (col.width != null) {
			if (used + col.width <= termWidth) {
				inline.push({
					key: col.key,
					width: col.width,
					label: col.label,
					render: col.render,
				});
				used += col.width;
			} else {
				overflow.push({
					key: col.key,
					width: Math.max(1, termWidth - OVERFLOW_PREFIX),
					label: col.label,
					render: col.render,
				});
			}
		} else {
			const remaining = termWidth - used;
			if (remaining >= FLEX_MIN) {
				inline.push({
					key: col.key,
					width: remaining,
					label: col.label,
					render: col.render,
				});
				used = termWidth;
			} else {
				overflow.push({
					key: col.key,
					width: Math.max(1, termWidth - OVERFLOW_PREFIX),
					label: col.label,
					render: col.render,
				});
			}
		}
	}

	return {
		inline,
		overflow,
		overflowIndent: OVERFLOW_PREFIX,
		linesPerItem: 1 + overflow.length,
	};
}

export function useColumns<T>(
	columns: ColumnDef<T>[],
	termWidth: number,
): ColumnLayout<T> {
	return useMemo(
		() => resolveColumns(columns, termWidth),
		[columns, termWidth],
	);
}
