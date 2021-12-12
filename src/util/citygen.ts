const wordParts = {
  consonants: {
    b: 3,
    c: 4,
    d: 6,
    f: 1,
    g: 3,
    h: 6,
    j: 1,
    k: 1,
    l: 6,
    m: 4,
    n: 12,
    p: 3,
    qu: 1,
    r: 9,
    s: 12,
    t: 14,
    v: 1,
    w: 2,
    x: 1,
    z: 1,
  },
  jointConsonants: {
    ht: 1,
    ln: 3,
    lm: 2,
    lk: 4,
    ld: 6,
    lt: 6,
    nt: 5,
    nd: 6,
    nk: 3,
    nm: 1,
    rt: 5,
    rn: 5,
    rm: 3,
    rk: 5,
    rd: 6,
    st: 6,
    sn: 1,
    sm: 2,
    sd: 5,
    sf: 1,
    ck: 6,
    tt: 3,
    ll: 3,
    nn: 3,
    pp: 2,
    mm: 2,
    sh: 6,
    ch: 6,
  },
  vowels: {
    a: 8,
    e: 12,
    i: 4,
    o: 8,
    u: 3,
    y: 1,
  },
  suffixes: Object.fromEntries(
    [
      " City",
      "ville",
      "town",
      " Park",
      " North",
      " Hills",
      " Junction",
      " West",
      "field",
      " Square",
      "ford",
      "burg",
      "wood",
      "grove",
      "land",
      " Place",
      "hurst",
      "by",
      "dale",
      " Creek",
      " Farm",
      " Beach",
      "bury",
      "shire",
      "by",
      "don",
      " Heights",
      " Ridge",
      " East",
      " South",
      " Meadows",
      " Point",
      " Bay",
      " Court",
      "brook",
      " Cove",
      " Grove",
      " Glen",
    ].map((e) => [e, 1])
  ),
};

export function fillRepeats<T>(
  frequencies: { [key: string]: number },
  builder: (key: string) => T
) {
  return Object.entries(frequencies).flatMap(([value, frequency]) =>
    new Array(frequency).fill(0).map((_) => builder(value))
  );
}

export function choose(frequencies: { [value: string]: number }) {
  const choices = fillRepeats(frequencies, (v) => v);
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

export function generateRegion() {
  const parts = [choose(wordParts.consonants)];
  while ((parts.length < 4 && Math.random() > 0.3) || parts.length < 3) {
    parts.push(choose(wordParts.vowels));
    parts.push(
      choose({ ...wordParts.jointConsonants, ...wordParts.consonants })
    );
  }
  const value = parts.join("");
  return value[0].toUpperCase() + value.slice(1);
}

export function generateCity() {
  const parts = [generateRegion()];
  if (Math.random() > 0.4) {
    parts.push(choose(wordParts.suffixes));
  }
  return parts.join("");
}
