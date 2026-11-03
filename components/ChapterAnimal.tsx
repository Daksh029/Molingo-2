const companions: Record<number, { name: string; fur: string; pale: string; sky: string }> = {
  1: { name: "Otter Ollie", fur: "#ac7856", pale: "#f6dcc0", sky: "#dff4de" },
  2: { name: "Panda Pari", fur: "#fffaf0", pale: "#fffaf0", sky: "#ddf2fb" },
  3: { name: "Fox Feni", fur: "#ed9455", pale: "#fff1d9", sky: "#fff0d3" },
  4: { name: "Bunny Bela", fur: "#e6c4e9", pale: "#fff0f5", sky: "#f3e7fa" },
  5: { name: "Koala Kiki", fur: "#aabac3", pale: "#e9f0ef", sky: "#ffe7df" },
  6: { name: "Penguin Piku", fur: "#42566c", pale: "#fff9e9", sky: "#e3edff" }
};

export function ChapterAnimal({ unitId, decorative = false }: { unitId: number; decorative?: boolean }) {
  const animal = companions[unitId] ?? companions[1];
  const panda = unitId === 2;
  const fox = unitId === 3;
  const bunny = unitId === 4;
  const koala = unitId === 5;
  const penguin = unitId === 6;
  const dark = "#293d46";
  return (
    <svg viewBox="0 0 240 200" className="chapter-animal" role={decorative ? undefined : "img"} aria-label={decorative ? undefined : animal.name} aria-hidden={decorative || undefined}>
      <circle cx="120" cy="98" r="86" fill={animal.sky} />
      <path d="M31 131q8-17 16 0M193 135q8-17 16 0" fill="none" stroke="#8ebca2" strokeWidth="4" strokeLinecap="round" />
      <path d="m40 51 3-8 3 8 8 3-8 3-3 8-3-8-8-3ZM193 52l3-6 3 6 6 3-6 3-3 6-3-6-6-3Z" fill="#e5b94e" />
      <ellipse cx="120" cy="177" rx="57" ry="9" fill="#203c44" opacity=".09" />
      <ellipse cx="120" cy="139" rx="45" ry="39" fill={animal.fur} />
      <ellipse cx="120" cy="145" rx="28" ry="29" fill={animal.pale} />
      <ellipse cx="82" cy="139" rx="13" ry="24" fill={panda ? dark : animal.fur} transform="rotate(25 82 139)" />
      <ellipse cx="158" cy="137" rx="13" ry="24" fill={panda ? dark : animal.fur} transform="rotate(-32 158 137)" />
      <ellipse cx="96" cy="173" rx="18" ry="10" fill={penguin ? "#e6ac52" : panda ? dark : animal.fur} />
      <ellipse cx="144" cy="173" rx="18" ry="10" fill={penguin ? "#e6ac52" : panda ? dark : animal.fur} />
      {!penguin && (fox ? <>
        <path d="M73 80 68 27 105 58M135 58l37-31-5 53" fill={animal.fur} stroke={animal.fur} strokeWidth="9" strokeLinejoin="round" />
        <path d="m78 63-3-23 18 20m54 0 18-20-3 23" fill="#f8c3a4" />
      </> : bunny ? <>
        <ellipse cx="91" cy="43" rx="16" ry="36" fill={animal.fur} transform="rotate(-14 91 43)" />
        <ellipse cx="149" cy="43" rx="16" ry="36" fill={animal.fur} transform="rotate(14 149 43)" />
        <ellipse cx="91" cy="42" rx="7" ry="25" fill="#f2aeba" transform="rotate(-14 91 42)" />
        <ellipse cx="149" cy="42" rx="7" ry="25" fill="#f2aeba" transform="rotate(14 149 42)" />
      </> : <>
        <circle cx="76" cy="61" r={koala ? 27 : 20} fill={panda ? dark : animal.fur} />
        <circle cx="164" cy="61" r={koala ? 27 : 20} fill={panda ? dark : animal.fur} />
        <circle cx="76" cy="61" r={koala ? 18 : 11} fill={animal.pale} />
        <circle cx="164" cy="61" r={koala ? 18 : 11} fill={animal.pale} />
      </>)}
      <ellipse cx="120" cy="88" rx="57" ry="47" fill={animal.fur} />
      {(fox || penguin) ? <path d="M66 83q25-15 54 12 29-27 54-12-4 48-54 49-50-1-54-49" fill={animal.pale} /> : <ellipse cx="120" cy="108" rx="35" ry="23" fill={animal.pale} />}
      {panda && <><ellipse cx="96" cy="86" rx="15" ry="18" fill={dark} transform="rotate(25 96 86)" /><ellipse cx="144" cy="86" rx="15" ry="18" fill={dark} transform="rotate(-25 144 86)" /></>}
      <ellipse cx="97" cy="88" rx="5" ry="7" fill={dark} stroke={panda ? "white" : "none"} strokeWidth="2" />
      <ellipse cx="143" cy="88" rx="5" ry="7" fill={dark} stroke={panda ? "white" : "none"} strokeWidth="2" />
      <circle cx="98" cy="86" r="1.8" fill="white" /><circle cx="144" cy="86" r="1.8" fill="white" />
      <ellipse cx="82" cy="104" rx="10" ry="6" fill="#ee9a9e" opacity=".6" /><ellipse cx="158" cy="104" rx="10" ry="6" fill="#ee9a9e" opacity=".6" />
      {penguin ? <path d="m111 101 9 13 9-13Z" fill="#e6ac52" /> : <><ellipse cx="120" cy={koala ? 97 : 103} rx={koala ? 10 : 7} ry={koala ? 14 : 5} fill={dark} /><path d="M110 115q10 10 20 0" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" /></>}
      <path d="m111 144 9-9 9 9-9 13Z" fill="#e7b74f" />
    </svg>
  );
}
