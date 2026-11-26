/* Ebun's thinking, off the main thread: replays the game so repetitions count, then searches */
import { Game, search } from './room-chess.js';
onmessage = e => {
  const { id, start, moves, opts } = e.data, g = new Game(start);
  for (const m of moves) g.play(m);
  const r = search(g.pos, opts);
  postMessage({ id, move:r.move, score:r.score, depth:r.depth });
};
