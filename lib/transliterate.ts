const independentVowels: Record<string, string> = {
  "અ": "a",
  "આ": "aa",
  "ઇ": "i",
  "ઈ": "ii",
  "ઉ": "u",
  "ઊ": "uu",
  "ઋ": "ri",
  "એ": "e",
  "ઐ": "ai",
  "ઓ": "o",
  "ઔ": "au"
};

const consonants: Record<string, string> = {
  "ક": "k",
  "ખ": "kh",
  "ગ": "g",
  "ઘ": "gh",
  "ઙ": "ng",
  "ચ": "ch",
  "છ": "ch",
  "જ": "j",
  "ઝ": "jh",
  "ઞ": "ny",
  "ટ": "t",
  "ઠ": "th",
  "ડ": "d",
  "ઢ": "dh",
  "ણ": "n",
  "ત": "t",
  "થ": "th",
  "દ": "d",
  "ધ": "dh",
  "ન": "n",
  "પ": "p",
  "ફ": "ph",
  "બ": "b",
  "ભ": "bh",
  "મ": "m",
  "ય": "y",
  "ર": "r",
  "લ": "l",
  "વ": "v",
  "શ": "sh",
  "ષ": "sh",
  "સ": "s",
  "હ": "h",
  "ળ": "l"
};

const vowelSigns: Record<string, string> = {
  "ા": "aa",
  "િ": "i",
  "ી": "ii",
  "ુ": "u",
  "ૂ": "uu",
  "ૃ": "ri",
  "ે": "e",
  "ૈ": "ai",
  "ો": "o",
  "ૌ": "au"
};

const virama = "્";

export function containsGujarati(input: string): boolean {
  return /[\u0A80-\u0AFF]/.test(input);
}

export function transliterateGujaratiToLatin(input: string): string {
  let output = "";

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (independentVowels[char]) {
      output += independentVowels[char];
      continue;
    }

    if (consonants[char]) {
      const base = consonants[char];

      if (next === virama) {
        output += base;
        i += 1;
        continue;
      }

      if (next && vowelSigns[next]) {
        output += base + vowelSigns[next];
        i += 1;
        continue;
      }

      output += `${base}a`;
      continue;
    }

    if (char in vowelSigns || char === virama) {
      continue;
    }

    output += char;
  }

  return output.replace(/a(?=\s|$)/g, "");
}
