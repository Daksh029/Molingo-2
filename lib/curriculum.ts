import { LessonItem, Unit } from "@/lib/types";

export const units: Unit[] = [
  {
    id: 1,
    title: "Hello Gujarati",
    theme: "Greetings",
    mascot: "Otter Ollie",
    color: "#43b04a",
    description: "Say hello, goodbye, and polite basics."
  },
  {
    id: 2,
    title: "Home Circle",
    theme: "Family",
    mascot: "Panda Pari",
    color: "#1cb0f6",
    description: "Talk about family members and relationships."
  },
  {
    id: 3,
    title: "Snack Safari",
    theme: "Food",
    mascot: "Fox Feni",
    color: "#ff9600",
    description: "Order food and share preferences."
  },
  {
    id: 4,
    title: "Street Steps",
    theme: "Directions",
    mascot: "Bunny Bela",
    color: "#ce82ff",
    description: "Ask for and follow simple directions."
  },
  {
    id: 5,
    title: "Daily Rhythm",
    theme: "Daily Actions",
    mascot: "Koala Kiki",
    color: "#ff4b4b",
    description: "Describe routines and daily habits."
  },
  {
    id: 6,
    title: "Talk Time",
    theme: "Short Conversations",
    mascot: "Penguin Piku",
    color: "#2b70c9",
    description: "Use short conversational exchanges naturally."
  }
];

type Seed = {
  intent: string;
  english: string;
  romanized: string;
  variants?: string[];
  tip: string;
  difficulty?: LessonItem["difficulty"];
};

const byUnit: Record<number, Seed[]> = {
  1: [
    { intent: "greeting", english: "Hello", romanized: "kem cho", variants: ["kem cho", "kem cho?"], tip: "Keep kem short and cho clear.", difficulty: "easy" },
    { intent: "intro", english: "I am fine", romanized: "hu maja ma chhu", tip: "Say hu lightly, not hoo.", difficulty: "easy" },
    { intent: "gratitude", english: "Thank you", romanized: "aabhar", variants: ["aabhar", "thank you aabhar"], tip: "Stretch aa in aabhar.", difficulty: "easy" },
    { intent: "courtesy", english: "Please", romanized: "krupaya", tip: "Break into kru-pa-ya.", difficulty: "easy" },
    { intent: "farewell", english: "See you later", romanized: "pachhi maliye", tip: "Soft chh in pachhi.", difficulty: "medium" },
    { intent: "morning", english: "Good morning", romanized: "suprabhat", tip: "Stress supra part evenly.", difficulty: "medium" },
    { intent: "night", english: "Good night", romanized: "shubh ratri", tip: "Round shubh with gentle bh.", difficulty: "medium" },
    { intent: "question", english: "How are you?", romanized: "tame kem cho", tip: "Rise in tone at the end.", difficulty: "easy" },
    { intent: "response", english: "I am very good", romanized: "hu khub sara chhu", tip: "Keep khub crisp and short.", difficulty: "easy" },
    { intent: "name", english: "What is your name?", romanized: "tamaaru naam shu chhe", tip: "Name sounds like naam.", difficulty: "medium" },
    { intent: "self_name", english: "My name is Anna", romanized: "maru naam anna chhe", tip: "Link maru and naam smoothly.", difficulty: "medium" },
    { intent: "origin", english: "Where are you from?", romanized: "tame kya thi cho", tip: "Kya should be quick.", difficulty: "medium" },
    { intent: "yes", english: "Yes", romanized: "haa", tip: "Open and long aa sound.", difficulty: "easy" },
    { intent: "no", english: "No", romanized: "naa", tip: "Keep it calm, not sharp.", difficulty: "easy" },
    { intent: "apology", english: "Sorry", romanized: "maaf karjo", tip: "Roll into karjo gently.", difficulty: "medium" },
    { intent: "welcome", english: "You are welcome", romanized: "swagat chhe", tip: "Swa-gat in two beats.", difficulty: "medium" },
    { intent: "repeat", english: "Please say again", romanized: "farithi bolo", tip: "Fa-ree-thi three beats.", difficulty: "medium" },
    { intent: "slow", english: "Please speak slowly", romanized: "dhime bolo", tip: "Dhi should be soft.", difficulty: "hard" },
    { intent: "understand", english: "I understand", romanized: "mane samaj pade chhe", tip: "Samaj has a soft j.", difficulty: "hard" },
    { intent: "not_understand", english: "I do not understand", romanized: "mane samaj nathi padti", tip: "Nathi is na-thi, not naa-thee.", difficulty: "hard" }
  ],
  2: [
    { intent: "family_intro", english: "This is my family", romanized: "aa maro parivar chhe", tip: "Parivar stress on va.", difficulty: "easy" },
    { intent: "mother", english: "This is my mother", romanized: "aa mari maa chhe", tip: "Long maa sound.", difficulty: "easy" },
    { intent: "father", english: "This is my father", romanized: "aa mara pappa chhe", tip: "Double p in pappa.", difficulty: "easy" },
    { intent: "sister", english: "I have one sister", romanized: "mane ek bahan chhe", tip: "Bahan with light h.", difficulty: "easy" },
    { intent: "brother", english: "I have one brother", romanized: "mane ek bhai chhe", tip: "Bhai is one long sound.", difficulty: "easy" },
    { intent: "grandmother", english: "My grandmother is kind", romanized: "mari dadi dayalu chhe", tip: "Da-da in dadi is clear.", difficulty: "medium" },
    { intent: "grandfather", english: "My grandfather tells stories", romanized: "mara dada vartao kahe chhe", tip: "Vartao has soft t.", difficulty: "medium" },
    { intent: "aunt", english: "My aunt lives nearby", romanized: "mari kaki najik rahe chhe", tip: "Na-jik in two beats.", difficulty: "medium" },
    { intent: "uncle", english: "My uncle is funny", romanized: "mara kaka majedar chhe", tip: "Majedar has open ma.", difficulty: "medium" },
    { intent: "cousin", english: "My cousin is in college", romanized: "mari cousin college ma chhe", tip: "Keep English loan words natural.", difficulty: "medium" },
    { intent: "married", english: "Are you married?", romanized: "tame lagna karya chhe", tip: "Lagna with soft g.", difficulty: "hard" },
    { intent: "single", english: "I am single", romanized: "hu single chhu", tip: "Blend single and chhu.", difficulty: "easy" },
    { intent: "children", english: "Do you have children?", romanized: "tamne balako chhe", tip: "Balako is ba-la-ko.", difficulty: "medium" },
    { intent: "daughter", english: "My daughter is six", romanized: "mari dikri chha varas ni chhe", tip: "Dikri has crisp kr.", difficulty: "hard" },
    { intent: "son", english: "My son is ten", romanized: "maro dikro das varas no chhe", tip: "Dikro with open o.", difficulty: "hard" },
    { intent: "family_size", english: "We are a small family", romanized: "ame nano parivar chhie", tip: "Chhie has breathy chh.", difficulty: "medium" },
    { intent: "visit", english: "I will visit my parents", romanized: "hu mara mata pita ne malva javish", tip: "Javish has soft sh.", difficulty: "hard" },
    { intent: "miss", english: "I miss my sister", romanized: "mane mari bahan ni yaad ave chhe", tip: "Yaad with long aa.", difficulty: "hard" },
    { intent: "love_family", english: "I love my family", romanized: "hu mara parivar ne prem karu chhu", tip: "Prem as one beat.", difficulty: "medium" },
    { intent: "relationship", english: "He is my cousin", romanized: "te maro cousin chhe", tip: "Te is short and clean.", difficulty: "easy" }
  ],
  3: [
    { intent: "hungry", english: "I am hungry", romanized: "mane bhukh lagi chhe", tip: "Bhukh has a breathy bh.", difficulty: "easy" },
    { intent: "thirsty", english: "I am thirsty", romanized: "mane tars lagi chhe", tip: "Tars has short a.", difficulty: "easy" },
    { intent: "water", english: "I want water", romanized: "mane paani joie chhe", tip: "Paani has long aa.", difficulty: "easy" },
    { intent: "tea", english: "I want tea", romanized: "mane cha joie chhe", tip: "Cha is one sharp syllable.", difficulty: "easy" },
    { intent: "coffee", english: "I want coffee", romanized: "mane coffee joie chhe", tip: "Keep coffee natural.", difficulty: "easy" },
    { intent: "breakfast", english: "What is for breakfast?", romanized: "nashta ma shu chhe", tip: "Nashta in two parts.", difficulty: "medium" },
    { intent: "lunch", english: "Let us eat lunch", romanized: "chalo jamva jaiye", tip: "Jamva with soft m.", difficulty: "medium" },
    { intent: "dinner", english: "Dinner is ready", romanized: "jamvanu taiyar chhe", tip: "Taiyar has open aa.", difficulty: "medium" },
    { intent: "spicy", english: "This is too spicy", romanized: "aa khub tikhu chhe", tip: "Tikhu with clear khu.", difficulty: "medium" },
    { intent: "sweet", english: "I like sweet food", romanized: "mane mithu game chhe", tip: "Mithu is mi-thu.", difficulty: "medium" },
    { intent: "salt", english: "Please add less salt", romanized: "ochhu mithu nakho", tip: "Ochhu starts with o.", difficulty: "hard" },
    { intent: "bill", english: "Can we have the bill?", romanized: "bill apo", tip: "Apo is aa-po.", difficulty: "easy" },
    { intent: "menu", english: "Please show me the menu", romanized: "menu batavo", tip: "Batavo is ba-ta-vo.", difficulty: "easy" },
    { intent: "order", english: "I want to order", romanized: "mane order aapvo chhe", tip: "Aapvo has long aa.", difficulty: "medium" },
    { intent: "vegetarian", english: "I am vegetarian", romanized: "hu shakahari chhu", tip: "Sha-ka-ha-ri evenly.", difficulty: "medium" },
    { intent: "favorite", english: "My favorite dish is khichdi", romanized: "mari favorite dish khichdi chhe", tip: "Khichdi has chh sound.", difficulty: "hard" },
    { intent: "delicious", english: "This is delicious", romanized: "aa swadisht chhe", tip: "Swa-di-sht short finish.", difficulty: "hard" },
    { intent: "more", english: "Please give me more", romanized: "thodu vadhu apo", tip: "Vadhu has soft dh.", difficulty: "medium" },
    { intent: "enough", english: "That is enough", romanized: "etlu bas chhe", tip: "Etlu with clear t.", difficulty: "easy" },
    { intent: "compliment", english: "Your cooking is great", romanized: "tamaru randhvu saras chhe", tip: "Randhvu has nasal n.", difficulty: "hard" }
  ],
  4: [
    { intent: "where", english: "Where is the station?", romanized: "station kya chhe", tip: "Kya is short and direct.", difficulty: "easy" },
    { intent: "left", english: "Turn left", romanized: "dabi taraf valo", tip: "Dabi is da-bi.", difficulty: "easy" },
    { intent: "right", english: "Turn right", romanized: "jamni taraf valo", tip: "Jamni starts with ja.", difficulty: "easy" },
    { intent: "straight", english: "Go straight", romanized: "sidha jao", tip: "Sidha has soft dh.", difficulty: "easy" },
    { intent: "near", english: "It is near", romanized: "te najik chhe", tip: "Najik with short i.", difficulty: "easy" },
    { intent: "far", english: "It is far", romanized: "te dur chhe", tip: "Dur is one long syllable.", difficulty: "easy" },
    { intent: "bus_stop", english: "Where is the bus stop?", romanized: "bus stop kya chhe", tip: "Pause before kya.", difficulty: "medium" },
    { intent: "taxi", english: "I need a taxi", romanized: "mane taxi joie chhe", tip: "Taxi with light x sound.", difficulty: "easy" },
    { intent: "walk", english: "Can we walk there?", romanized: "aapde tya chaline jaiye", tip: "Chaline in three beats.", difficulty: "medium" },
    { intent: "map", english: "Please show on map", romanized: "map par batavo", tip: "Par is crisp.", difficulty: "medium" },
    { intent: "address", english: "What is the address?", romanized: "address shu chhe", tip: "Shu sounds like shoo.", difficulty: "easy" },
    { intent: "landmark", english: "Is there a temple nearby?", romanized: "najik mandir chhe", tip: "Mandir with clear n.", difficulty: "medium" },
    { intent: "distance", english: "How far is it?", romanized: "ketlu dur chhe", tip: "Ketlu is ke-tlu.", difficulty: "medium" },
    { intent: "time", english: "How long will it take?", romanized: "ketlo samay lagse", tip: "Lagse with soft g.", difficulty: "medium" },
    { intent: "traffic", english: "There is heavy traffic", romanized: "khub traffic chhe", tip: "Khub plus traffic with quick pause.", difficulty: "medium" },
    { intent: "help", english: "Please help me", romanized: "mane madad karo", tip: "Madad in two equal beats.", difficulty: "easy" },
    { intent: "lost", english: "I am lost", romanized: "hu rasto bhuli gai", variants: ["hu rasto bhuli gai", "hu rasto bhuli gayo"], tip: "Bhuli has breathy bh.", difficulty: "hard" },
    { intent: "again_direction", english: "Can you repeat directions?", romanized: "rasto farithi kahsho", tip: "Kahsho with soft sh.", difficulty: "hard" },
    { intent: "crossroad", english: "At the next signal turn right", romanized: "aagla signal par jamni taraf valo", tip: "Aagla starts with aa.", difficulty: "hard" },
    { intent: "arrival", english: "We have arrived", romanized: "aapde pahochi gaya", tip: "Pahochi is pa-ho-chi.", difficulty: "medium" }
  ],
  5: [
    { intent: "wake", english: "I wake up at seven", romanized: "hu saat vage uthu chhu", tip: "Saat has long aa.", difficulty: "medium" },
    { intent: "sleep", english: "I sleep at ten", romanized: "hu das vage su chhu", tip: "Su is soft and short.", difficulty: "medium" },
    { intent: "work", english: "I work from home", romanized: "hu ghar thi kaam karu chhu", tip: "Kaam with long aa.", difficulty: "easy" },
    { intent: "study", english: "I study Gujarati daily", romanized: "hu roj gujarati shikhu chhu", tip: "Roj is one beat.", difficulty: "easy" },
    { intent: "exercise", english: "I exercise every morning", romanized: "hu dar savare exercise karu chhu", tip: "Savare is sa-va-re.", difficulty: "medium" },
    { intent: "break", english: "I take a short break", romanized: "hu nani break lau chhu", tip: "Lau with open au.", difficulty: "medium" },
    { intent: "cook", english: "I cook dinner", romanized: "hu rat nu jamvanu banavu chhu", tip: "Banavu in three beats.", difficulty: "medium" },
    { intent: "clean", english: "I clean the room", romanized: "hu room saaf karu chhu", tip: "Saaf has long aa.", difficulty: "easy" },
    { intent: "shopping", english: "I go shopping on Sunday", romanized: "hu ravivare shopping karva jau chhu", tip: "Ravivare four smooth beats.", difficulty: "hard" },
    { intent: "music", english: "I listen to music", romanized: "hu sangeet sambhlu chhu", tip: "Sambhlu has nasal mbh.", difficulty: "hard" },
    { intent: "read", english: "I read books", romanized: "hu books vanchu chhu", tip: "Vanchu with soft nch.", difficulty: "medium" },
    { intent: "call", english: "I call my mom", romanized: "hu mari maa ne call karu chhu", tip: "Ne is short connector.", difficulty: "easy" },
    { intent: "meeting", english: "I have a meeting now", romanized: "have mane meeting chhe", tip: "Have means now.", difficulty: "easy" },
    { intent: "busy", english: "I am busy today", romanized: "aaje hu busy chhu", tip: "Aaje is aa-je.", difficulty: "easy" },
    { intent: "free", english: "I am free in the evening", romanized: "saanje hu free chhu", tip: "Saanje has nasal n.", difficulty: "easy" },
    { intent: "weekend", english: "On weekends I relax", romanized: "weekend ma hu aaram karu chhu", tip: "Aaram has long aa.", difficulty: "medium" },
    { intent: "practice", english: "I practice speaking Gujarati", romanized: "hu gujarati bolvani practice karu chhu", tip: "Bolvani starts with bol.", difficulty: "hard" },
    { intent: "plan", english: "I plan tomorrow", romanized: "hu aavti kal nu plan karu chhu", tip: "Aavti kal for tomorrow.", difficulty: "medium" },
    { intent: "habit", english: "This is my daily habit", romanized: "aa mari roj ni aadat chhe", tip: "Aadat has two aa sounds.", difficulty: "medium" },
    { intent: "energy", english: "I feel energetic", romanized: "mane urja lage chhe", tip: "Urja is ur-ja.", difficulty: "hard" }
  ],
  6: [
    { intent: "smalltalk_1", english: "How was your day?", romanized: "tamaro divas kevo gayo", tip: "Kevo with open e.", difficulty: "easy" },
    { intent: "smalltalk_2", english: "My day was good", romanized: "maro divas saro gayo", tip: "Saro has rolling r.", difficulty: "easy" },
    { intent: "smalltalk_3", english: "What are you doing?", romanized: "tame shu kari rahya cho", tip: "Rahya in two beats.", difficulty: "medium" },
    { intent: "smalltalk_4", english: "I am learning Gujarati", romanized: "hu gujarati shikhi rahyo chhu", variants: ["hu gujarati shikhi rahyo chhu", "hu gujarati shikhi rahyi chhu"], tip: "Shikhi has soft kh.", difficulty: "medium" },
    { intent: "smalltalk_5", english: "That is awesome", romanized: "e khub saras chhe", tip: "Khub saras with cheerful tone.", difficulty: "easy" },
    { intent: "smalltalk_6", english: "Can we practice now?", romanized: "aapde have practice kariye", tip: "Kariye has soft ye.", difficulty: "medium" },
    { intent: "smalltalk_7", english: "I need help with pronunciation", romanized: "mane uchcharan ma madad joie", tip: "Uchcharan has chh-chh flow.", difficulty: "hard" },
    { intent: "smalltalk_8", english: "Say it one more time", romanized: "ek vaar vadhu bolo", tip: "Vaar has long aa.", difficulty: "medium" },
    { intent: "smalltalk_9", english: "Did I say it right?", romanized: "shu hu sachu boli", variants: ["shu hu sachu boli", "shu hu sachu bolyo", "shu hu sachu boli"], tip: "Sachu has soft ch.", difficulty: "medium" },
    { intent: "smalltalk_10", english: "Yes, that was correct", romanized: "haa e sachu hatu", tip: "Hatu with soft t.", difficulty: "easy" },
    { intent: "smalltalk_11", english: "Almost, try again", romanized: "lagbhag sachu, fari prayatna karo", tip: "Lagbhag with gh ending.", difficulty: "hard" },
    { intent: "smalltalk_12", english: "Let us speak slowly", romanized: "aapde dhime dhime boli e", tip: "Dhime repeated evenly.", difficulty: "medium" },
    { intent: "smalltalk_13", english: "I am getting better", romanized: "hu sudhri rahi chhu", variants: ["hu sudhri rahi chhu", "hu sudhri rahyo chhu"], tip: "Sudhri has soft dh.", difficulty: "hard" },
    { intent: "smalltalk_14", english: "You are doing great", romanized: "tame khub saru kari rahya cho", tip: "Saru with long aa.", difficulty: "medium" },
    { intent: "smalltalk_15", english: "Let us talk tomorrow", romanized: "aapde aavti kale vaat kariye", tip: "Vaat has long aa.", difficulty: "medium" },
    { intent: "smalltalk_16", english: "I am excited to learn", romanized: "mane shikhva utsah chhe", tip: "Utsah with soft ts.", difficulty: "hard" },
    { intent: "smalltalk_17", english: "This is fun", romanized: "aa maja nu chhe", tip: "Maja with gentle j.", difficulty: "easy" },
    { intent: "smalltalk_18", english: "Thank you for helping me", romanized: "mane madad karva badal aabhar", tip: "Badal means for/for doing.", difficulty: "hard" },
    { intent: "smalltalk_19", english: "I will keep practicing", romanized: "hu practice chalu rakhish", tip: "Rakhish with soft kh.", difficulty: "hard" },
    { intent: "smalltalk_20", english: "See you next time", romanized: "aavti vakhat maliye", tip: "Vakhat with clear kh.", difficulty: "medium" }
  ]
};

function reviewTag(index: number): LessonItem["review_tag"] {
  if (index < 8) {
    return "new";
  }
  if (index < 14) {
    return "review_soon";
  }
  return "mastering";
}

export const lessonItems: LessonItem[] = Object.entries(byUnit).flatMap(([unitId, seeds]) =>
  seeds.map((seed, index) => {
    const id = `u${unitId}-l${String(index + 1).padStart(2, "0")}`;

    return {
      id,
      unit: Number(unitId),
      intent: seed.intent,
      english_text: seed.english,
      romanized_gujarati: seed.romanized,
      target_audio_text: seed.romanized,
      acceptable_variants: seed.variants ?? [seed.romanized],
      coach_tip: seed.tip,
      difficulty: seed.difficulty ?? "medium",
      review_tag: reviewTag(index)
    } satisfies LessonItem;
  })
);

const lessonById = new Map(lessonItems.map((item) => [item.id, item]));

export function getLessonById(id: string): LessonItem | undefined {
  return lessonById.get(id);
}

export function getLessonsByUnit(unitId: number): LessonItem[] {
  return lessonItems.filter((item) => item.unit === unitId);
}
