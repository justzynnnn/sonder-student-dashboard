// A small, curated set of encouraging Bible verses — chosen for students under
// pressure (rest, courage, provision, perseverance). Emoji-free, like the rest
// of the app. Shown at random; an optional daily-stable pick keeps it from
// changing on every render within the same day.

export const VERSES = [
  { text: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { text: 'Trust in the Lord with all your heart, and lean not on your own understanding.', ref: 'Proverbs 3:5' },
  { text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', ref: 'Joshua 1:9' },
  { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', ref: 'Matthew 11:28' },
  { text: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7' },
  { text: 'And we know that in all things God works for the good of those who love him.', ref: 'Romans 8:28' },
  { text: 'Whatever you do, work at it with all your heart, as working for the Lord.', ref: 'Colossians 3:23' },
  { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { text: 'Commit to the Lord whatever you do, and he will establish your plans.', ref: 'Proverbs 16:3' },
  { text: 'Do not be anxious about anything, but in every situation, by prayer, present your requests to God.', ref: 'Philippians 4:6' },
  { text: 'For I know the plans I have for you, plans to prosper you and not to harm you, plans to give you hope and a future.', ref: 'Jeremiah 29:11' },
  { text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.', ref: 'Isaiah 40:31' },
  { text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', ref: 'Galatians 6:9' },
  { text: 'This is the day that the Lord has made; let us rejoice and be glad in it.', ref: 'Psalm 118:24' },
  { text: 'Your word is a lamp to my feet and a light to my path.', ref: 'Psalm 119:105' },
  { text: 'God is our refuge and strength, an ever-present help in trouble.', ref: 'Psalm 46:1' },
  { text: 'Be still, and know that I am God.', ref: 'Psalm 46:10' },
  { text: 'The Lord will fight for you; you need only to be still.', ref: 'Exodus 14:14' },
  { text: 'Consider it pure joy whenever you face trials, because the testing of your faith produces perseverance.', ref: 'James 1:2-3' },
  { text: 'She is clothed with strength and dignity, and she laughs without fear of the future.', ref: 'Proverbs 31:25' },
];

export function randomVerse() {
  return VERSES[Math.floor(Math.random() * VERSES.length)];
}

// A verse that stays the same for a given day (so it doesn't flicker on every
// render) but rotates day to day.
export function verseOfTheDay(date = new Date()) {
  const seed = Number(`${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`);
  return VERSES[seed % VERSES.length];
}
