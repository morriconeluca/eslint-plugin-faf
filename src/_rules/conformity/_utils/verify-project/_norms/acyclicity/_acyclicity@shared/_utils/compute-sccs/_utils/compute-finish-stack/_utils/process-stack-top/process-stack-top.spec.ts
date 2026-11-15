import { describe, expect, it } from 'vitest';

import { processStackTop } from './process-stack-top.util.js';

describe('processStackTop', () => {
  it('advances to an unvisited neighbor', () => {
    const callStack = [0];
    const edgeIndices = new Int32Array(2);
    const visited = new Uint8Array(2);
    visited[0] = 1;
    const finishStack: number[] = [];

    processStackTop(callStack, edgeIndices, [[1], []], visited, finishStack);
    expect(callStack).toEqual([0, 1]);
    expect(visited[1]).toBe(1);
    expect(finishStack).toEqual([]);
  });

  it('skips already visited neighbors', () => {
    const callStack = [0];
    const edgeIndices = new Int32Array(2);
    const visited = new Uint8Array([1, 1]);
    const finishStack: number[] = [];

    processStackTop(callStack, edgeIndices, [[1], []], visited, finishStack);
    expect(callStack).toEqual([0]);
    expect(finishStack).toEqual([]);
  });

  it('pops node when all edges explored', () => {
    const callStack = [0];
    const edgeIndices = new Int32Array([1]);
    const visited = new Uint8Array([1]);
    const finishStack: number[] = [];

    processStackTop(callStack, edgeIndices, [[1]], visited, finishStack);
    expect(callStack).toEqual([]);
    expect(finishStack).toEqual([0]);
  });

  it('returns early when call stack is empty', () => {
    const callStack: number[] = [];
    const edgeIndices = new Int32Array(1);
    const visited = new Uint8Array(1);
    const finishStack: number[] = [];

    processStackTop(callStack, edgeIndices, [], visited, finishStack);
    expect(callStack).toEqual([]);
    expect(finishStack).toEqual([]);
  });

  it('handles node with undefined adjacency row and undefined edge index', () => {
    const callStack = [5];
    const edgeIndices = new Int32Array(1);
    const visited = new Uint8Array(1);
    const finishStack: number[] = [];

    processStackTop(callStack, edgeIndices, [], visited, finishStack);
    expect(callStack).toEqual([]);
    expect(finishStack).toEqual([5]);
  });
});
