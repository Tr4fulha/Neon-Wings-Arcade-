
/**
 * Mulberry32 é um algoritmo de PRNG (Pseudo-Random Number Generator) rápido e de alta qualidade.
 * Ele garante que, para a mesma semente (seed), a sequência de números gerados seja sempre idêntica.
 */
export class SeededRNG {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Retorna um número flutuante entre 0 e 1 (inclusivo 0, exclusivo 1).
   * Substituto direto para Math.random().
   */
  next(): number {
    var t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Retorna um inteiro entre min e max (inclusivo min, exclusivo max).
   */
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min) + min);
  }
}

/**
 * Gera um hash inteiro de uma string (ex: "2023-10-27").
 */
export const cyrb128 = (str: string) => {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1^h2^h3^h4) >>> 0;
};
