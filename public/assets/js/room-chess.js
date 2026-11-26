/* Room 208 chess: the full rules (castling, en passant, promotion, check, mate, stalemate, the draw rules)
   and a small engine for Ebun. Pure module: no DOM, no three.js, so it runs in a worker and under node for tests. */

// 0x88 board: square = rank*16 + file, rank 0 is White's back rank. Pieces: type 1..6 plus colour 8 (white) or 16 (black)
export const WHITE = 8, BLACK = 16, PAWN = 1, KNIGHT = 2, BISHOP = 3, ROOK = 4, QUEEN = 5, KING = 6;
export const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const F_CAP = 1, F_DOUBLE = 2, F_EP = 4, F_CASTLE = 8, F_PROMO = 16;
export const mFrom = m => m & 127, mTo = m => (m >> 7) & 127, mPromo = m => (m >> 14) & 7, mFlags = m => m >> 17;
const enc = (from, to, flags = 0, promo = 0) => from | (to << 7) | (promo << 14) | (flags << 17);
export const isCapture = m => (mFlags(m) & F_CAP) !== 0, isCastle = m => (mFlags(m) & F_CASTLE) !== 0, isEp = m => (mFlags(m) & F_EP) !== 0;
export const sqName = s => 'abcdefgh'[s & 7] + ((s >> 4) + 1), sqOf = n => (n.charCodeAt(0) - 97) + (n.charCodeAt(1) - 49)*16;
export const fileOf = s => s & 7, rankOf = s => s >> 4;
const LETTER = ' pnbrqk';

const KN = [33, 31, 18, 14, -33, -31, -18, -14], KG = [1, -1, 16, -16, 17, 15, -17, -15];
const DIAG = [17, 15, -17, -15], ORTH = [1, -1, 16, -16];

// Zobrist keys as pairs of 32-bit halves (lo is the table index, hi checks it)
let seed = 0x9e3779b9; const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return seed >>> 0; };
const ZP = [new Uint32Array(23*128), new Uint32Array(23*128)];
for (let i=0;i<23*128;i++){ ZP[0][i] = rnd(); ZP[1][i] = rnd(); }
const ZSIDE = [rnd(), rnd()], ZC = [new Uint32Array(16), new Uint32Array(16)], ZEP = [new Uint32Array(8), new Uint32Array(8)];
for (let i=0;i<16;i++){ ZC[0][i] = rnd(); ZC[1][i] = rnd(); } for (let i=0;i<8;i++){ ZEP[0][i] = rnd(); ZEP[1][i] = rnd(); }
// castling rights lost when a piece leaves or lands on these squares
const CR = new Uint8Array(128).fill(15); CR[0x04] = 12; CR[0x00] = 13; CR[0x07] = 14; CR[0x74] = 3; CR[0x70] = 7; CR[0x77] = 11;

export class Position {
  constructor(fen = START){ this.b = new Uint8Array(128); this.undo = []; this.load(fen); }
  load(fen){
    const [placement, side, castle, ep, half, full] = fen.trim().split(/\s+/), b = this.b; b.fill(0);
    let r = 7, f = 0;
    for (const ch of placement){
      if (ch === '/'){ r--; f = 0; } else if (/\d/.test(ch)) f += +ch;
      else { const t = LETTER.indexOf(ch.toLowerCase()); b[r*16 + f] = t | (ch === ch.toUpperCase() ? WHITE : BLACK); f++; }
    }
    this.side = side === 'b' ? BLACK : WHITE;
    this.castle = (castle.includes('K') ? 1 : 0) | (castle.includes('Q') ? 2 : 0) | (castle.includes('k') ? 4 : 0) | (castle.includes('q') ? 8 : 0);
    this.ep = ep && ep !== '-' ? sqOf(ep) : -1; this.half = +(half || 0); this.full = +(full || 1);
    this.kings = [0, 0]; for (let s=0;s<128;s++) if (!(s & 0x88) && (b[s] & 7) === KING) this.kings[b[s] >> 4] = s;
    this.undo.length = 0; this.rehash(); this.hist = [];
    return this;
  }
  fen(){
    let out = '';
    for (let r=7;r>=0;r--){ let e = 0;
      for (let f=0;f<8;f++){ const p = this.b[r*16 + f]; if (!p){ e++; continue; } if (e){ out += e; e = 0; } const l = LETTER[p & 7]; out += p & WHITE ? l.toUpperCase() : l; }
      if (e) out += e; if (r) out += '/'; }
    const c = (this.castle & 1 ? 'K' : '') + (this.castle & 2 ? 'Q' : '') + (this.castle & 4 ? 'k' : '') + (this.castle & 8 ? 'q' : '');
    return `${out} ${this.side === WHITE ? 'w' : 'b'} ${c || '-'} ${this.ep >= 0 ? sqName(this.ep) : '-'} ${this.half} ${this.full}`;
  }
  // the en passant square counts towards the key only when a pawn could actually take there (as in Polyglot)
  epLive(){ if (this.ep < 0) return false; const us = this.side, d = us === WHITE ? -16 : 16;
    for (const s of [this.ep + d - 1, this.ep + d + 1]) if (!(s & 0x88) && this.b[s] === (PAWN | us)) return true; return false; }
  rehash(){
    let lo = 0, hi = 0;
    for (let s=0;s<128;s++){ if (s & 0x88) continue; const p = this.b[s]; if (p){ lo ^= ZP[0][p*128 + s]; hi ^= ZP[1][p*128 + s]; } }
    if (this.side === BLACK){ lo ^= ZSIDE[0]; hi ^= ZSIDE[1]; }
    lo ^= ZC[0][this.castle]; hi ^= ZC[1][this.castle];
    if (this.epLive()){ lo ^= ZEP[0][this.ep & 7]; hi ^= ZEP[1][this.ep & 7]; }
    this.lo = lo >>> 0; this.hi = hi >>> 0;
  }
  attacked(s, by){
    const b = this.b;
    const pd = by === WHITE ? -16 : 16;                         // a pawn attacking s stands one rank behind it, from the attacker's side
    for (const d of [pd - 1, pd + 1]){ const t = s + d; if (!(t & 0x88) && b[t] === (PAWN | by)) return true; }
    for (const d of KN){ const t = s + d; if (!(t & 0x88) && b[t] === (KNIGHT | by)) return true; }
    for (const d of KG){ const t = s + d; if (!(t & 0x88) && b[t] === (KING | by)) return true; }
    for (const d of DIAG){ let t = s + d; while (!(t & 0x88)){ const p = b[t]; if (p){ if ((p & by) && ((p & 7) === BISHOP || (p & 7) === QUEEN)) return true; break; } t += d; } }
    for (const d of ORTH){ let t = s + d; while (!(t & 0x88)){ const p = b[t]; if (p){ if ((p & by) && ((p & 7) === ROOK || (p & 7) === QUEEN)) return true; break; } t += d; } }
    return false;
  }
  inCheck(side = this.side){ return this.attacked(this.kings[side >> 4], side ^ 24); }
  // pseudo-legal moves (the mover's king may be left in check; make() callers test that)
  gen(out = [], capsOnly = false){
    const b = this.b, us = this.side, them = us ^ 24, fwd = us === WHITE ? 16 : -16, startR = us === WHITE ? 1 : 6, lastR = us === WHITE ? 7 : 0;
    for (let s=0;s<128;s++){
      if (s & 0x88){ s += 7; continue; }
      const p = b[s]; if (!(p & us)) continue;
      const t = p & 7;
      if (t === PAWN){
        const one = s + fwd;
        if (!(one & 0x88) && !b[one]){
          if ((one >> 4) === lastR){ for (const pr of [QUEEN, KNIGHT, ROOK, BISHOP]) out.push(enc(s, one, F_PROMO, pr)); }
          else if (!capsOnly){ out.push(enc(s, one)); const two = one + fwd; if ((s >> 4) === startR && !b[two]) out.push(enc(s, two, F_DOUBLE)); }
        }
        for (const d of [fwd - 1, fwd + 1]){ const c = s + d; if (c & 0x88) continue;
          if (b[c] & them){ if ((c >> 4) === lastR){ for (const pr of [QUEEN, KNIGHT, ROOK, BISHOP]) out.push(enc(s, c, F_CAP | F_PROMO, pr)); } else out.push(enc(s, c, F_CAP)); }
          else if (c === this.ep) out.push(enc(s, c, F_CAP | F_EP)); }
      } else if (t === KNIGHT || t === KING){
        for (const d of t === KNIGHT ? KN : KG){ const c = s + d; if (c & 0x88) continue; const q = b[c];
          if (!q){ if (!capsOnly) out.push(enc(s, c)); } else if (q & them) out.push(enc(s, c, F_CAP)); }
        if (t === KING && !capsOnly && s === (us === WHITE ? 0x04 : 0x74) && !this.attacked(s, them)){
          const k = us === WHITE ? 1 : 4, q = us === WHITE ? 2 : 8;
          if ((this.castle & k) && !b[s+1] && !b[s+2] && b[s+3] === (ROOK | us) && !this.attacked(s+1, them) && !this.attacked(s+2, them)) out.push(enc(s, s+2, F_CASTLE));
          if ((this.castle & q) && !b[s-1] && !b[s-2] && !b[s-3] && b[s-4] === (ROOK | us) && !this.attacked(s-1, them) && !this.attacked(s-2, them)) out.push(enc(s, s-2, F_CASTLE));
        }
      } else {
        for (const d of t === BISHOP ? DIAG : t === ROOK ? ORTH : KG){ let c = s + d;
          while (!(c & 0x88)){ const q = b[c]; if (!q){ if (!capsOnly) out.push(enc(s, c)); } else { if (q & them) out.push(enc(s, c, F_CAP)); break; } c += d; } }
      }
    }
    return out;
  }
  // play a pseudo-legal move; returns false (and takes it back) if it leaves the mover in check
  make(m){
    const b = this.b, from = mFrom(m), to = mTo(m), fl = mFlags(m), us = this.side, them = us ^ 24, pc = b[from];
    let capSq = to; if (fl & F_EP) capSq = to + (us === WHITE ? -16 : 16);
    const cap = b[capSq];
    this.undo.push({ m, cap, capSq, castle:this.castle, ep:this.ep, half:this.half, lo:this.lo, hi:this.hi });
    this.hist.push(this.lo, this.hi);
    let lo = this.lo, hi = this.hi;
    if (this.epLive()){ lo ^= ZEP[0][this.ep & 7]; hi ^= ZEP[1][this.ep & 7]; }
    lo ^= ZC[0][this.castle]; hi ^= ZC[1][this.castle];
    lo ^= ZP[0][pc*128 + from]; hi ^= ZP[1][pc*128 + from];
    if (cap){ lo ^= ZP[0][cap*128 + capSq]; hi ^= ZP[1][cap*128 + capSq]; b[capSq] = 0; }
    const np = fl & F_PROMO ? (mPromo(m) | us) : pc;
    b[to] = np; b[from] = 0; lo ^= ZP[0][np*128 + to]; hi ^= ZP[1][np*128 + to];
    if (fl & F_CASTLE){ const rf = to > from ? from + 3 : from - 4, rt = to > from ? from + 1 : from - 1, rk = ROOK | us;
      b[rt] = rk; b[rf] = 0; lo ^= ZP[0][rk*128 + rf] ^ ZP[0][rk*128 + rt]; hi ^= ZP[1][rk*128 + rf] ^ ZP[1][rk*128 + rt]; }
    if ((pc & 7) === KING) this.kings[us >> 4] = to;
    this.castle &= CR[from] & CR[to];
    this.ep = fl & F_DOUBLE ? (from + to) >> 1 : -1;
    this.half = (pc & 7) === PAWN || cap ? 0 : this.half + 1;
    if (us === BLACK) this.full++;
    this.side = them; lo ^= ZSIDE[0]; hi ^= ZSIDE[1];
    lo ^= ZC[0][this.castle]; hi ^= ZC[1][this.castle];
    if (this.epLive()){ lo ^= ZEP[0][this.ep & 7]; hi ^= ZEP[1][this.ep & 7]; }
    this.lo = lo >>> 0; this.hi = hi >>> 0;
    if (this.attacked(this.kings[us >> 4], them)){ this.unmake(); return false; }
    return true;
  }
  unmake(){
    const u = this.undo.pop(), b = this.b, m = u.m, from = mFrom(m), to = mTo(m), fl = mFlags(m);
    this.hist.length -= 2;
    this.side ^= 24; const us = this.side;
    const moved = b[to], pc = fl & F_PROMO ? (PAWN | us) : moved;
    b[from] = pc; b[to] = 0; if (u.cap) b[u.capSq] = u.cap;
    if (fl & F_CASTLE){ const rf = to > from ? from + 3 : from - 4, rt = to > from ? from + 1 : from - 1; b[rf] = b[rt]; b[rt] = 0; }
    if ((pc & 7) === KING) this.kings[us >> 4] = from;
    this.castle = u.castle; this.ep = u.ep; this.half = u.half; this.lo = u.lo; this.hi = u.hi;
    if (us === BLACK) this.full--;
  }
  makeNull(){ this.undo.push({ m:0, nul:true, ep:this.ep, half:this.half, lo:this.lo, hi:this.hi }); this.hist.push(this.lo, this.hi);
    let lo = this.lo, hi = this.hi; if (this.epLive()){ lo ^= ZEP[0][this.ep & 7]; hi ^= ZEP[1][this.ep & 7]; }
    this.ep = -1; this.half++; this.side ^= 24; this.lo = (lo ^ ZSIDE[0]) >>> 0; this.hi = (hi ^ ZSIDE[1]) >>> 0; }
  unmakeNull(){ const u = this.undo.pop(); this.hist.length -= 2; this.side ^= 24; this.ep = u.ep; this.half = u.half; this.lo = u.lo; this.hi = u.hi; }
  legal(){ const out = []; for (const m of this.gen()){ if (this.make(m)){ out.push(m); this.unmake(); } } return out; }
  // how many times the current position has stood with the same player to move (positions repeat only within the reversible run)
  reps(){ let n = 1; const h = this.hist, end = h.length - 2*this.half; for (let i = h.length - 4; i >= Math.max(0, end); i -= 4) if (h[i] === this.lo && h[i+1] === this.hi) n++; return n; }
}

// a position from which no sequence of legal moves could ever end in mate: no pawns, rooks or queens, and at most one minor piece or only bishops on one colour
export function deadPosition(pos){
  let minors = 0, knights = 0, light = 0, dark = 0;
  for (let s=0;s<128;s++){ if (s & 0x88) continue; const t = pos.b[s] & 7;
    if (t === PAWN || t === ROOK || t === QUEEN) return false;
    if (t === KNIGHT){ minors++; knights++; } if (t === BISHOP){ minors++; ((s >> 4) + (s & 7)) & 1 ? light++ : dark++; } }
  return minors <= 1 || (knights === 0 && (light === 0 || dark === 0));
}

export function san(pos, m, legal = pos.legal()){
  const from = mFrom(m), to = mTo(m), fl = mFlags(m), p = pos.b[from], t = p & 7;
  let s;
  if (fl & F_CASTLE) s = to > from ? 'O-O' : 'O-O-O';
  else {
    s = '';
    if (t === PAWN){ if (fl & F_CAP) s = 'abcdefgh'[from & 7] + 'x'; s += sqName(to); if (fl & F_PROMO) s += '=' + 'PNBRQK'[mPromo(m) - 1]; }
    else {
      s = 'PNBRQK'[t - 1];
      if (t !== KING){
        const rivals = legal.filter(o => o !== m && mTo(o) === to && (pos.b[mFrom(o)] & 7) === t && mFrom(o) !== from);
        if (rivals.length){ const sameFile = rivals.some(o => (mFrom(o) & 7) === (from & 7)), sameRank = rivals.some(o => (mFrom(o) >> 4) === (from >> 4));
          if (!sameFile) s += 'abcdefgh'[from & 7]; else if (!sameRank) s += (from >> 4) + 1; else s += sqName(from); }
      }
      if (fl & F_CAP) s += 'x'; s += sqName(to);
    }
  }
  pos.make(m); if (pos.inCheck()) s += pos.legal().length ? '+' : '#'; pos.unmake();
  return s;
}

/* ---------- a game: the record, the result, and the draw rules ---------- */
export class Game {
  constructor(fen = START){ this.start = fen; this.pos = new Position(fen); this.moves = []; this.sans = []; this.result = null; this.reason = ''; this.refresh(); }
  refresh(){ this.legalMoves = this.pos.legal(); this.check = this.pos.inCheck(); this.judge(); }
  play(m){
    if (this.result || !this.legalMoves.includes(m)) return null;
    const s = san(this.pos, m, this.legalMoves);
    this.pos.make(m); this.moves.push(m); this.sans.push(s); this.refresh();
    return s;
  }
  takeBack(){ if (!this.moves.length) return; this.pos.unmake(); this.moves.pop(); this.sans.pop(); this.result = null; this.reason = ''; this.refresh(); }
  // results that end the game by themselves: mate, stalemate, a dead position, fivefold repetition, the 75-move rule
  judge(){
    const p = this.pos;
    if (!this.legalMoves.length){ if (this.check){ this.result = p.side === WHITE ? '0-1' : '1-0'; this.reason = 'checkmate'; } else { this.result = '1/2-1/2'; this.reason = 'stalemate'; } return; }
    if (deadPosition(p)){ this.result = '1/2-1/2'; this.reason = 'insufficient material'; return; }
    if (p.reps() >= 5){ this.result = '1/2-1/2'; this.reason = 'fivefold repetition'; return; }
    if (p.half >= 150){ this.result = '1/2-1/2'; this.reason = '75-move rule'; return; }
  }
  // draws the player to move may claim: threefold repetition or fifty moves without a capture or pawn move
  claimable(){ if (this.result) return null; if (this.pos.reps() >= 3) return 'threefold repetition'; if (this.pos.half >= 100) return '50-move rule'; return null; }
  claim(){ const r = this.claimable(); if (r){ this.result = '1/2-1/2'; this.reason = r; } return r; }
  resign(side){ if (this.result) return; this.result = side === WHITE ? '0-1' : '1-0'; this.reason = 'resignation'; }
  agreeDraw(){ if (this.result) return; this.result = '1/2-1/2'; this.reason = 'agreement'; }
  find(from, to, promo = 0){ return this.legalMoves.find(m => mFrom(m) === from && mTo(m) === to && (!promo || mPromo(m) === promo)); }
}

/* ---------- evaluation ---------- */
const VAL = [0, 100, 320, 330, 500, 900, 0];
// piece-square tables from White's side, rank 8 first (Michniewski's simplified evaluation)
const PST = {
  1:[0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  2:[-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  3:[-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  4:[0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  5:[-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  6:[-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
  7:[-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50],
};
// index for a 0x88 square, seen from either side
const idxW = s => (7 - (s >> 4))*8 + (s & 7), idxB = s => (s >> 4)*8 + (s & 7);
const PASSED = [0, 5, 10, 20, 35, 60, 100, 0];
const pawnFiles = [new Int8Array(10), new Int8Array(10)];

export function evaluate(pos){
  const b = pos.b; let mat = [0, 0], pst = [0, 0], phase = 0, bishops = [0, 0], minorMaj = [0, 0];
  const pf = pawnFiles; pf[0].fill(0); pf[1].fill(0);
  const pawnsAt = [[], []];
  for (let s=0;s<128;s++){
    if (s & 0x88){ s += 7; continue; }
    const p = b[s]; if (!p) continue;
    const t = p & 7, c = p & WHITE ? 0 : 1, i = c ? idxB(s) : idxW(s);
    mat[c] += VAL[t];
    if (t === PAWN){ pf[c][(s & 7) + 1]++; pawnsAt[c].push(s); }
    else if (t !== KING){ minorMaj[c] += VAL[t]; phase += t === QUEEN ? 4 : t === ROOK ? 2 : 1; }
    if (t === BISHOP) bishops[c]++;
    if (t !== KING) pst[c] += PST[t][i];
  }
  // king: shelter in the middlegame, the centre in the endgame
  const ph = Math.min(24, phase) / 24;
  for (let c=0;c<2;c++){ const k = pos.kings[c], i = c ? idxB(k) : idxW(k); pst[c] += Math.round(PST[6][i]*ph + PST[7][i]*(1 - ph)); }
  let score = mat[0] - mat[1] + pst[0] - pst[1];
  if (bishops[0] >= 2) score += 30; if (bishops[1] >= 2) score -= 30;
  // pawns: doubled and isolated cost; passed pawns grow in value as they advance, more so in the endgame
  for (let c=0;c<2;c++){ const sg = c ? -1 : 1, mine = pf[c], theirs = pf[1-c];
    for (let f=1;f<=8;f++){ if (mine[f] > 1) score -= sg*12*(mine[f] - 1); if (mine[f] && !mine[f-1] && !mine[f+1]) score -= sg*10*mine[f]; }
    for (const s of pawnsAt[c]){ const f = s & 7, r = s >> 4; let passed = true;
      for (const o of pawnsAt[1-c]){ const of = o & 7, orr = o >> 4; if (Math.abs(of - f) <= 1 && (c ? orr < r : orr > r)){ passed = false; break; } }
      if (passed){ const adv = c ? 7 - r : r; score += sg*Math.round(PASSED[adv]*(1.4 - .8*ph)); } } }
  // mop-up: with a decisive material lead and few pieces left, herd the bare king to the edge and walk ours over
  const lead = mat[0] - mat[1];
  if (Math.abs(lead) > 350 && ph < .35){ const win = lead > 0 ? 0 : 1, wk = pos.kings[win], lk = pos.kings[1 - win];
    const cd = Math.max(3 - (lk & 7), (lk & 7) - 4) + Math.max(3 - (lk >> 4), (lk >> 4) - 4), kd = Math.abs((wk & 7) - (lk & 7)) + Math.abs((wk >> 4) - (lk >> 4));
    score += (win ? -1 : 1)*(cd*12 + (14 - kd)*5); }
  return pos.side === WHITE ? score : -score;
}

/* ---------- search ---------- */
export const MATE = 30000;
const TT_BITS = 18, TT_SIZE = 1 << TT_BITS, TT_MASK = TT_SIZE - 1;
let ttHi = new Uint32Array(TT_SIZE), ttMove = new Int32Array(TT_SIZE), ttScore = new Int16Array(TT_SIZE), ttDepth = new Int8Array(TT_SIZE), ttFlag = new Uint8Array(TT_SIZE);
const EXACT = 1, LOWER = 2, UPPER = 3;
export function clearTT(){ ttHi.fill(0); ttMove.fill(0); ttDepth.fill(0); ttFlag.fill(0); }

// options: depth (max), ms (time budget), noise (random centipawns per root move, for the casual level), rng
export function search(pos, { depth: maxDepth = 64, ms = 1000, noise = 0, rng = Math.random, now = () => Date.now() } = {}){
  const deadline = now() + ms, killers = new Int32Array(256), history = new Int32Array(128*128);
  let nodes = 0, stop = false;
  const rootMoves = pos.legal();
  if (!rootMoves.length) return { move:0, score: pos.inCheck() ? -MATE : 0, depth:0, nodes:0 };
  const jitter = new Map(rootMoves.map(m => [m, noise ? Math.round((rng()*2 - 1)*noise) : 0]));
  const order = (moves, ttm, ply) => {
    const sc = new Int32Array(moves.length);
    for (let i=0;i<moves.length;i++){ const m = moves[i];
      if (m === ttm) sc[i] = 2e6;
      else if (mFlags(m) & (F_CAP | F_PROMO)){ const v = isEp(m) ? 1 : pos.b[mTo(m)] & 7; sc[i] = 1e6 + v*16 - (pos.b[mFrom(m)] & 7) + (mFlags(m) & F_PROMO ? mPromo(m)*20 : 0); }
      else if (killers[ply*2] === m) sc[i] = 9e5; else if (killers[ply*2+1] === m) sc[i] = 8e5;
      else sc[i] = history[mFrom(m)*128 + mTo(m)]; }
    return sc;
  };
  const pick = (moves, sc, i) => { let best = i; for (let j=i+1;j<moves.length;j++) if (sc[j] > sc[best]) best = j;
    if (best !== i){ const tm = moves[i]; moves[i] = moves[best]; moves[best] = tm; const ts = sc[i]; sc[i] = sc[best]; sc[best] = ts; } return moves[i]; };
  const tick = () => { if ((++nodes & 2047) === 0 && now() > deadline) stop = true; return stop; };
  const nonPawn = side => { for (let s=0;s<128;s++){ if (s & 0x88){ s += 7; continue; } const p = pos.b[s]; if ((p & side) && (p & 7) !== PAWN && (p & 7) !== KING) return true; } return false; };

  function quiesce(alpha, beta, ply){
    if (tick()) return 0;
    const stand = evaluate(pos);
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    const moves = pos.gen([], true), sc = order(moves, 0, ply);
    for (let i=0;i<moves.length;i++){ const m = pick(moves, sc, i);
      if (!pos.make(m)) continue;
      const v = -quiesce(-beta, -alpha, ply + 1); pos.unmake();
      if (stop) return 0;
      if (v >= beta) return v; if (v > alpha) alpha = v; }
    return alpha;
  }
  function negamax(depth, alpha, beta, ply, nullOk){
    if (ply && (pos.half >= 100 || pos.reps() >= 2)) return 0;      // a repeat inside the search is as good as a draw
    const inCheck = pos.inCheck();
    if (inCheck) depth++;
    if (depth <= 0) return quiesce(alpha, beta, ply);
    if (tick()) return 0;
    const idx = pos.lo & TT_MASK, a0 = alpha; let ttm = 0;
    if (ttHi[idx] === pos.hi && ttFlag[idx]){
      ttm = ttMove[idx];
      if (ply && ttDepth[idx] >= depth){ let v = ttScore[idx]; if (v > MATE - 500) v -= ply; else if (v < -MATE + 500) v += ply;
        const f = ttFlag[idx]; if (f === EXACT || (f === LOWER && v >= beta) || (f === UPPER && v <= alpha)) return v; }
    }
    // null move: if passing still beats beta, a real move will too
    if (nullOk && !inCheck && depth >= 3 && ply && nonPawn(pos.side) && evaluate(pos) >= beta){
      pos.makeNull(); const v = -negamax(depth - 3, -beta, -beta + 1, ply + 1, false); pos.unmakeNull();
      if (stop) return 0; if (v >= beta) return beta;
    }
    const moves = ply ? pos.gen() : rootMoves.slice(), sc = order(moves, ttm, ply);
    let best = -MATE - 1, bestM = 0, legal = 0;
    for (let i=0;i<moves.length;i++){
      const m = pick(moves, sc, i);
      if (!pos.make(m)) continue;
      legal++;
      const quiet = !(mFlags(m) & (F_CAP | F_PROMO)), gives = pos.inCheck();
      // at the root each move carries its own random offset (casual play): search it in a window shifted by that offset so bounds stay honest
      const j = ply ? 0 : jitter.get(m) || 0, al = alpha - j, be = beta - j;
      let v;
      if (legal === 1) v = -negamax(depth - 1, -be, -al, ply + 1, true);
      else {
        const r = depth >= 3 && legal > 3 && quiet && !inCheck && !gives ? (legal > 8 ? 2 : 1) : 0;
        v = -negamax(depth - 1 - r, -al - 1, -al, ply + 1, true);
        if (v > al && (r || v < be)) v = -negamax(depth - 1, -be, -al, ply + 1, true);
      }
      pos.unmake();
      if (stop) return 0;
      v += j;
      if (v > best){ best = v; bestM = m; }
      if (v > alpha){ alpha = v; if (!ply) rootBest = m; }
      if (alpha >= beta){
        if (quiet){ if (killers[ply*2] !== m){ killers[ply*2+1] = killers[ply*2]; killers[ply*2] = m; } history[mFrom(m)*128 + mTo(m)] += depth*depth; }
        break;
      }
    }
    if (!legal) return inCheck ? -MATE + ply : 0;
    let st = best; if (st > MATE - 500) st += ply; else if (st < -MATE + 500) st -= ply;
    if (!ply && noise) return best;                                       // a root score with noise in it must not be remembered
    ttHi[idx] = pos.hi; ttMove[idx] = bestM; ttScore[idx] = Math.max(-32000, Math.min(32000, st)); ttDepth[idx] = depth;
    ttFlag[idx] = best <= a0 ? UPPER : best >= beta ? LOWER : EXACT;
    return best;
  }
  let rootBest = 0, done = { move:rootMoves[0], score:0, depth:0 };
  for (let d = 1; d <= maxDepth; d++){
    rootBest = 0;
    const v = negamax(d, -MATE - 1, MATE + 1, 0, false);
    if (stop){ if (rootBest && d > 1) done.move = rootBest; break; }       // a part-searched depth that already found a better first move still counts
    done = { move: rootBest || done.move, score: v, depth: d };
    if (Math.abs(v) > MATE - 200 || now() > deadline - ms*.45) break;      // a forced mate found, or not enough time left for another full depth
  }
  done.nodes = nodes;
  return done;
}

// Ebun's levels
export const LEVELS = {
  casual: { label:'Casual', depth:2, ms:400, noise:90 },
  club:   { label:'Club',   depth:4, ms:900, noise:12 },
  strong: { label:'Strong', depth:64, ms:1600, noise:0 },
};

export function perft(pos, d){ if (!d) return 1; let n = 0; for (const m of pos.gen()){ if (pos.make(m)){ n += perft(pos, d - 1); pos.unmake(); } } return n; }

// a few mainline openings so Ebun's first moves look like a person's
const BOOK = {
  '':['e4','d4','Nf3','c4'], 'e4':['e5','c5','e6','c6'], 'd4':['d5','Nf6'], 'Nf3':['d5','Nf6'], 'c4':['e5','Nf6'],
  'e4 e5':['Nf3'], 'e4 e5 Nf3':['Nc6'], 'e4 e5 Nf3 Nc6':['Bb5','Bc4','d4'], 'e4 e5 Nf3 Nc6 Bb5':['a6','Nf6'], 'e4 e5 Nf3 Nc6 Bc4':['Bc5','Nf6'], 'e4 e5 Nf3 Nc6 d4':['exd4'],
  'e4 c5':['Nf3'], 'e4 c5 Nf3':['d6','Nc6','e6'], 'e4 e6':['d4'], 'e4 e6 d4':['d5'], 'e4 c6':['d4'], 'e4 c6 d4':['d5'],
  'd4 d5':['c4'], 'd4 d5 c4':['e6','c6'], 'd4 Nf6':['c4'], 'd4 Nf6 c4':['e6','g6'], 'Nf3 d5':['d4','g3'], 'Nf3 Nf6':['c4','g3'], 'c4 e5':['Nc3'], 'c4 Nf6':['Nc3'],
};
export function bookMove(game, rng = Math.random){
  const list = BOOK[game.sans.join(' ')]; if (!list) return 0;
  const want = list[Math.floor(rng()*list.length)];
  return game.legalMoves.find(m => san(game.pos, m, game.legalMoves) === want) || 0;
}
