// A curated set of ~50 encouraging Bible verses for students under pressure,
// grouped loosely by theme: strength/courage, anxiety/peace, comfort, hope,
// perseverance, and trust/guidance. Emoji-free, like the rest of the app.
// Wording follows common NIV-style phrasing. Shown at random; an optional
// daily-stable pick keeps it from changing on every render within the same day.

export const VERSES = [
  // --- Strength & courage ---
  { text: 'I can do all things through Christ who strengthens me.', ref: 'Philippians 4:13' },
  { text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.', ref: 'Isaiah 41:10' },
  { text: 'Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.', ref: 'Joshua 1:9' },
  { text: 'Be strong and courageous. Do not be afraid or terrified, for the Lord your God goes with you; he will never leave you nor forsake you.', ref: 'Deuteronomy 31:6' },
  { text: 'For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.', ref: '2 Timothy 1:7' },
  { text: 'The Lord is my light and my salvation — whom shall I fear?', ref: 'Psalm 27:1' },
  { text: 'Be on your guard; stand firm in the faith; be courageous; be strong.', ref: '1 Corinthians 16:13' },
  { text: 'Do not grieve, for the joy of the Lord is your strength.', ref: 'Nehemiah 8:10' },
  { text: 'The Lord is my strength and my shield; my heart trusts in him, and he helps me.', ref: 'Psalm 28:7' },
  { text: 'My grace is sufficient for you, for my power is made perfect in weakness.', ref: '2 Corinthians 12:9' },

  // --- Anxiety & peace ---
  { text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.', ref: 'Philippians 4:6' },
  { text: 'And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.', ref: 'Philippians 4:7' },
  { text: 'Cast all your anxiety on him because he cares for you.', ref: '1 Peter 5:7' },
  { text: 'Therefore do not worry about tomorrow, for tomorrow will worry about itself.', ref: 'Matthew 6:34' },
  { text: 'Peace I leave with you; my peace I give you. Do not let your hearts be troubled and do not be afraid.', ref: 'John 14:27' },
  { text: 'You will keep in perfect peace those whose minds are steadfast, because they trust in you.', ref: 'Isaiah 26:3' },
  { text: 'Cast your cares on the Lord and he will sustain you; he will never let the righteous be shaken.', ref: 'Psalm 55:22' },
  { text: 'When I am afraid, I put my trust in you.', ref: 'Psalm 56:3' },
  { text: 'When anxiety was great within me, your consolation brought me joy.', ref: 'Psalm 94:19' },
  { text: 'Come to me, all you who are weary and burdened, and I will give you rest.', ref: 'Matthew 11:28' },

  // --- Comfort & the brokenhearted ---
  { text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.', ref: 'Psalm 34:18' },
  { text: 'The Lord is my shepherd; I shall not want.', ref: 'Psalm 23:1' },
  { text: 'Because of the Lord’s great love we are not consumed, for his compassions never fail. They are new every morning.', ref: 'Lamentations 3:22-23' },
  { text: 'My flesh and my heart may fail, but God is the strength of my heart and my portion forever.', ref: 'Psalm 73:26' },
  { text: 'When you pass through the waters, I will be with you; and when you pass through the rivers, they will not sweep over you.', ref: 'Isaiah 43:2' },
  { text: 'In this world you will have trouble. But take heart! I have overcome the world.', ref: 'John 16:33' },
  { text: 'Blessed are those who mourn, for they will be comforted.', ref: 'Matthew 5:4' },
  { text: 'He heals the brokenhearted and binds up their wounds.', ref: 'Psalm 147:3' },
  { text: 'Praise be to the God of all comfort, who comforts us in all our troubles.', ref: '2 Corinthians 1:3-4' },
  { text: 'He will wipe every tear from their eyes. There will be no more death or mourning or crying or pain.', ref: 'Revelation 21:4' },

  // --- Hope & a future ---
  { text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.', ref: 'Jeremiah 29:11' },
  { text: 'And we know that in all things God works for the good of those who love him.', ref: 'Romans 8:28' },
  { text: 'May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope.', ref: 'Romans 15:13' },
  { text: 'But those who hope in the Lord will renew their strength. They will soar on wings like eagles.', ref: 'Isaiah 40:31' },
  { text: 'Be joyful in hope, patient in affliction, faithful in prayer.', ref: 'Romans 12:12' },
  { text: 'There is surely a future hope for you, and your hope will not be cut off.', ref: 'Proverbs 23:18' },
  { text: 'Be strong and take heart, all you who hope in the Lord.', ref: 'Psalm 31:24' },

  // --- Perseverance & work ---
  { text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.', ref: 'Galatians 6:9' },
  { text: 'Whatever you do, work at it with all your heart, as working for the Lord.', ref: 'Colossians 3:23' },
  { text: 'Let us run with perseverance the race marked out for us.', ref: 'Hebrews 12:1' },
  { text: 'Being confident of this, that he who began a good work in you will carry it on to completion.', ref: 'Philippians 1:6' },
  { text: 'Consider it pure joy whenever you face trials, because the testing of your faith produces perseverance.', ref: 'James 1:2-3' },
  { text: 'Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.', ref: '1 Corinthians 15:58' },
  { text: 'I press on toward the goal to win the prize for which God has called me heavenward.', ref: 'Philippians 3:14' },

  // --- Trust & guidance ---
  { text: 'Trust in the Lord with all your heart, and lean not on your own understanding.', ref: 'Proverbs 3:5' },
  { text: 'In all your ways submit to him, and he will make your paths straight.', ref: 'Proverbs 3:6' },
  { text: 'Commit to the Lord whatever you do, and he will establish your plans.', ref: 'Proverbs 16:3' },
  { text: 'Commit your way to the Lord; trust in him, and he will do this.', ref: 'Psalm 37:5' },
  { text: 'Your word is a lamp to my feet and a light to my path.', ref: 'Psalm 119:105' },
  { text: 'But seek first his kingdom and his righteousness, and all these things will be given to you as well.', ref: 'Matthew 6:33' },
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
