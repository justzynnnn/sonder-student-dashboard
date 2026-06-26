// Keyword-based category suggestion for money + tasks. Recognition over recall:
// guessing the category from what the user typed removes a decision per entry,
// which is one of the biggest input-friction wins (BJ Fogg — make it easier and
// it happens more often, regardless of motivation). Returns a Sonder category
// name or null. Coffee is checked before Food so "kape" doesn't fall into Food.
const MONEY_KEYWORDS = {
  Coffee: ['kape', 'coffee', 'starbucks', 'cbtl', 'tea', 'milktea', 'milk tea', 'latte', 'americano', 'kopiko', 'nescafe'],
  Food: [
    'jollibee', 'mcdo', 'mcdonald', 'kfc', 'chowking', 'mang inasal', 'greenwich',
    'shakeys', 'pizza', 'angels burger', 'food', 'foodpanda', 'grabfood', 'lunch',
    'dinner', 'breakfast', 'snack', 'merienda', 'baon', 'restaurant', 'ramen',
    'burger', 'chicken', 'rice', 'ulam', 'siomai', 'sisig', 'grocery', 'canteen',
  ],
  Transport: [
    'grab', 'angkas', 'joyride', 'uber', 'taxi', 'tricycle', 'jeep', 'jeepney',
    'mrt', 'lrt', 'beep', 'gas', 'gasoline', 'fuel', 'toll', 'p2p', 'bus', 'fare',
    'parking', 'shell', 'petron', 'caltex', 'seaoil', 'commute', 'pasahe',
  ],
  School: [
    'tuition', 'book', 'books', 'exam', 'project', 'school', 'supplies', 'photocopy',
    'printing', 'print', 'xerox', 'uniform', 'notebook', 'pen', 'paper', 'thesis',
    'enrollment', 'module', 'lab fee', 'org fee', 'id', 'requirement',
  ],
  Shopping: [
    'shopee', 'lazada', 'tiktok shop', 'temu', 'mall', 'sm', 'robinson', 'ayala',
    'clothes', 'shirt', 'shoes', 'ukay', 'h&m', 'uniqlo', 'zara', 'penshoppe',
    'bench', 'nike', 'adidas', 'haul', 'skincare', 'makeup',
  ],
  Fun: [
    'netflix', 'spotify', 'youtube', 'movie', 'cinema', 'game', 'steam',
    'playstation', 'ps5', 'xbox', 'nintendo', 'switch', 'ticket', 'concert',
    'gig', 'disney', 'hbo', 'viu', 'mobile legends', 'valorant', 'genshin',
  ],
  Health: [
    'mercury drug', 'watsons', 'south star', 'rose pharmacy', 'doctor', 'hospital',
    'clinic', 'pharmacy', 'gym', 'fitness', 'medicine', 'vitamin', 'dental',
    'dentist', 'optical', 'laboratory', 'lab test', 'checkup', 'maintenance',
  ],
};

const MONEY_TABLE = Object.entries(MONEY_KEYWORDS).map(([category, words]) => [
  category,
  words.map((w) => w.toLowerCase()),
]);

export function suggestCategory(text) {
  if (!text) return null;
  const hay = String(text).toLowerCase();
  for (const [category, words] of MONEY_TABLE) {
    for (const w of words) {
      if (hay.includes(w)) return category;
    }
  }
  return null;
}
