import type { FoodGroup, Nutrients, Region, Unit } from './model';

/**
 * The built-in food list: everyday foods with their food group and the
 * measures people use for them. Names and groups only; nutrient values are
 * added from a sourced database (see docs/parity/phase-5-nutrition.md) and
 * are never typed in by hand. Until then these foods count toward the
 * balanced plate, and custom or scanned foods show nutrients.
 */
export interface Food {
  ref: string;
  name: string;
  hi?: string;
  /** Other names people search for, in any script. */
  aliases?: string[];
  group: FoodGroup;
  units: Unit[];
  region: Region;
  /** Per one of `units[0]`, with the source, once loaded from a database. */
  nutrients?: { per: Unit; values: Nutrients; source: string };
}

type Row = [
  key: string,
  name: string,
  hi: string | null,
  group: FoodGroup,
  units: Unit[],
  aliases?: string[],
];

const indian: Row[] = [
  ['roti', 'Roti', 'रोटी', 'grains', ['piece'], ['chapati', 'phulka', 'चपाती', 'फुलका']],
  ['paratha', 'Paratha', 'पराठा', 'grains', ['piece']],
  ['alooParatha', 'Aloo paratha', 'आलू पराठा', 'mixed', ['piece']],
  ['puri', 'Puri', 'पूरी', 'grains', ['piece'], ['poori']],
  ['rice', 'Rice, cooked', 'चावल', 'grains', ['katori', 'plate'], ['chawal', 'bhaat', 'भात']],
  ['jeeraRice', 'Jeera rice', 'जीरा चावल', 'grains', ['katori', 'plate']],
  ['brownRice', 'Brown rice, cooked', 'ब्राउन राइस', 'grains', ['katori']],
  [
    'milletRoti',
    'Millet roti (bajra, jowar, ragi)',
    'बाजरा/ज्वार/रागी रोटी',
    'grains',
    ['piece'],
    ['bhakri', 'bajra', 'jowar', 'ragi', 'भाकरी'],
  ],
  ['poha', 'Poha', 'पोहा', 'grains', ['katori', 'plate']],
  ['upma', 'Upma', 'उपमा', 'grains', ['katori', 'plate']],
  ['idli', 'Idli', 'इडली', 'grains', ['piece']],
  ['dosa', 'Plain dosa', 'सादा डोसा', 'grains', ['piece'], ['dosai']],
  ['masalaDosa', 'Masala dosa', 'मसाला डोसा', 'mixed', ['piece']],
  ['uttapam', 'Uttapam', 'उत्तपम', 'grains', ['piece']],
  ['medhuVada', 'Medu vada', 'मेदु वड़ा', 'pulses', ['piece'], ['vada', 'वड़ा']],
  ['dal', 'Dal', 'दाल', 'pulses', ['katori'], ['daal', 'toor', 'moong', 'masoor', 'अरहर', 'मूंग']],
  ['rajma', 'Rajma', 'राजमा', 'pulses', ['katori']],
  ['chole', 'Chole', 'छोले', 'pulses', ['katori'], ['chana masala', 'chickpea curry', 'चना']],
  ['sambar', 'Sambar', 'सांभर', 'pulses', ['katori']],
  ['rasam', 'Rasam', 'रसम', 'mixed', ['katori']],
  ['sprouts', 'Sprouts salad', 'अंकुरित सलाद', 'pulses', ['katori'], ['moong sprouts', 'चाट']],
  ['besanChilla', 'Besan chilla', 'बेसन चीला', 'pulses', ['piece'], ['cheela']],
  ['dhokla', 'Dhokla', 'ढोकला', 'pulses', ['piece']],
  ['khichdi', 'Khichdi', 'खिचड़ी', 'mixed', ['katori', 'plate']],
  ['biryani', 'Biryani', 'बिरयानी', 'mixed', ['plate', 'katori']],
  ['pulao', 'Veg pulao', 'वेज पुलाव', 'mixed', ['plate', 'katori']],
  [
    'mixedVeg',
    'Mixed vegetable sabzi',
    'मिक्स सब्ज़ी',
    'vegetables',
    ['katori'],
    ['sabji', 'subzi', 'सब्जी'],
  ],
  ['alooSabzi', 'Aloo sabzi', 'आलू की सब्ज़ी', 'vegetables', ['katori'], ['potato']],
  ['bhindi', 'Bhindi sabzi', 'भिंडी', 'vegetables', ['katori'], ['okra', 'lady finger']],
  [
    'palak',
    'Palak or saag',
    'पालक / साग',
    'vegetables',
    ['katori'],
    ['spinach', 'sarson', 'greens'],
  ],
  ['baingan', 'Baingan bharta', 'बैंगन भरता', 'vegetables', ['katori'], ['brinjal', 'eggplant']],
  [
    'cabbage',
    'Cabbage or beans poriyal',
    'पत्तागोभी / बीन्स',
    'vegetables',
    ['katori'],
    ['thoran', 'poriyal'],
  ],
  [
    'salad',
    'Salad (cucumber, tomato, onion)',
    'सलाद',
    'vegetables',
    ['katori', 'bowl'],
    ['kachumber'],
  ],
  ['palakPaneer', 'Palak paneer', 'पालक पनीर', 'mixed', ['katori']],
  ['paneer', 'Paneer', 'पनीर', 'dairy', ['katori', 'g'], ['cottage cheese']],
  ['curd', 'Curd (dahi)', 'दही', 'dairy', ['katori'], ['dahi', 'yogurt', 'yoghurt']],
  ['raita', 'Raita', 'रायता', 'dairy', ['katori']],
  ['buttermilk', 'Buttermilk (chaas)', 'छाछ', 'dairy', ['glass'], ['chaas', 'mattha', 'majjiga']],
  ['milk', 'Milk', 'दूध', 'dairy', ['glass', 'cup'], ['doodh']],
  ['lassi', 'Lassi', 'लस्सी', 'dairy', ['glass']],
  ['egg', 'Egg, boiled', 'उबला अंडा', 'protein', ['piece'], ['anda', 'अंडा']],
  ['omelette', 'Omelette', 'ऑमलेट', 'protein', ['piece']],
  ['chickenCurry', 'Chicken curry', 'चिकन करी', 'protein', ['katori']],
  ['fishCurry', 'Fish curry', 'मछली करी', 'protein', ['katori'], ['machli', 'meen']],
  ['muttonCurry', 'Mutton curry', 'मटन करी', 'protein', ['katori']],
  ['banana', 'Banana', 'केला', 'fruits', ['piece'], ['kela']],
  ['apple', 'Apple', 'सेब', 'fruits', ['piece'], ['seb']],
  ['mango', 'Mango', 'आम', 'fruits', ['piece', 'katori'], ['aam']],
  ['papaya', 'Papaya', 'पपीता', 'fruits', ['katori']],
  ['guava', 'Guava', 'अमरूद', 'fruits', ['piece'], ['amrood', 'peru']],
  ['orange', 'Orange', 'संतरा', 'fruits', ['piece'], ['santra']],
  ['grapes', 'Grapes', 'अंगूर', 'fruits', ['katori']],
  ['peanuts', 'Peanuts', 'मूंगफली', 'nutsSeeds', ['tbsp', 'katori'], ['moongphali', 'groundnut']],
  ['almonds', 'Almonds', 'बादाम', 'nutsSeeds', ['piece'], ['badam']],
  ['chai', 'Chai', 'चाय', 'drinks', ['cup'], ['tea']],
  ['coffee', 'Filter coffee', 'फ़िल्टर कॉफ़ी', 'drinks', ['cup']],
  ['coconutWater', 'Coconut water', 'नारियल पानी', 'drinks', ['glass']],
  ['ghee', 'Ghee', 'घी', 'fats', ['tbsp']],
  ['samosa', 'Samosa', 'समोसा', 'mixed', ['piece']],
  ['pakora', 'Pakora', 'पकौड़ा', 'mixed', ['piece', 'plate'], ['bhajji', 'bhaji']],
  ['pavBhaji', 'Pav bhaji', 'पाव भाजी', 'mixed', ['plate']],
  ['vadaPav', 'Vada pav', 'वड़ा पाव', 'mixed', ['piece']],
  ['gulabJamun', 'Gulab jamun', 'गुलाब जामुन', 'sweets', ['piece']],
  ['jalebi', 'Jalebi', 'जलेबी', 'sweets', ['piece']],
  ['kheer', 'Kheer', 'खीर', 'sweets', ['katori'], ['payasam']],
  ['ladoo', 'Ladoo', 'लड्डू', 'sweets', ['piece'], ['laddu']],
];

const american: Row[] = [
  ['oatmeal', 'Oatmeal', 'ओटमील', 'grains', ['cup'], ['oats', 'porridge']],
  ['wholeWheatBread', 'Whole wheat bread', 'होल व्हीट ब्रेड', 'grains', ['slice'], ['toast']],
  ['whiteBread', 'White bread', 'ब्रेड', 'grains', ['slice'], ['toast']],
  ['bagel', 'Bagel', null, 'grains', ['piece']],
  ['pasta', 'Pasta, cooked', 'पास्ता', 'grains', ['cup'], ['spaghetti', 'noodles']],
  ['usBrownRice', 'Brown rice, cooked', 'ब्राउन राइस', 'grains', ['cup']],
  ['tortilla', 'Tortilla', null, 'grains', ['piece'], ['wrap']],
  ['cereal', 'Breakfast cereal', 'सीरियल', 'grains', ['cup'], ['cornflakes']],
  ['pancakes', 'Pancakes', 'पैनकेक', 'grains', ['piece']],
  ['usEgg', 'Egg', 'अंडा', 'protein', ['piece'], ['eggs']],
  ['scrambledEggs', 'Scrambled eggs', 'भुर्जी', 'protein', ['serving']],
  ['chickenBreast', 'Chicken breast', 'चिकन', 'protein', ['oz', 'piece']],
  ['salmon', 'Salmon', null, 'protein', ['oz']],
  ['tuna', 'Tuna', null, 'protein', ['oz', 'can']],
  ['tofu', 'Tofu', 'टोफू', 'protein', ['oz', 'cup']],
  ['blackBeans', 'Black beans', null, 'pulses', ['cup'], ['beans']],
  ['lentilSoup', 'Lentil soup', 'दाल का सूप', 'pulses', ['cup'], ['lentils']],
  ['hummus', 'Hummus', null, 'pulses', ['tbsp']],
  ['peanutButter', 'Peanut butter', 'पीनट बटर', 'nutsSeeds', ['tbsp']],
  ['usAlmonds', 'Almonds', 'बादाम', 'nutsSeeds', ['oz', 'piece']],
  ['greekYogurt', 'Greek yogurt', 'दही', 'dairy', ['cup'], ['yoghurt']],
  ['usMilk', 'Milk', 'दूध', 'dairy', ['cup']],
  ['cheese', 'Cheese', 'चीज़', 'dairy', ['slice', 'oz']],
  ['greens', 'Salad greens', 'हरी सलाद', 'vegetables', ['cup'], ['lettuce', 'salad']],
  ['broccoli', 'Broccoli', 'ब्रोकली', 'vegetables', ['cup']],
  ['carrots', 'Carrots', 'गाजर', 'vegetables', ['cup', 'piece']],
  ['sweetPotato', 'Sweet potato', 'शकरकंद', 'vegetables', ['piece']],
  ['corn', 'Corn', 'मक्का', 'vegetables', ['cup'], ['sweetcorn']],
  ['greenBeans', 'Green beans', 'फलियाँ', 'vegetables', ['cup']],
  ['usApple', 'Apple', 'सेब', 'fruits', ['piece']],
  ['usBanana', 'Banana', 'केला', 'fruits', ['piece']],
  ['usOrange', 'Orange', 'संतरा', 'fruits', ['piece']],
  ['berries', 'Berries', null, 'fruits', ['cup'], ['strawberries', 'blueberries']],
  ['usGrapes', 'Grapes', 'अंगूर', 'fruits', ['cup']],
  ['sandwich', 'Turkey sandwich', null, 'mixed', ['piece']],
  ['burger', 'Hamburger', 'बर्गर', 'mixed', ['piece']],
  ['pizza', 'Pizza', 'पिज़्ज़ा', 'mixed', ['slice']],
  ['burrito', 'Burrito', null, 'mixed', ['piece']],
  ['macCheese', 'Mac and cheese', null, 'mixed', ['cup']],
  ['smoothie', 'Fruit smoothie', 'स्मूदी', 'mixed', ['cup']],
  ['usCoffee', 'Coffee', 'कॉफ़ी', 'drinks', ['cup']],
  ['usTea', 'Tea', 'चाय', 'drinks', ['cup']],
  ['soda', 'Soda', 'सोडा', 'drinks', ['can']],
  ['cookie', 'Cookie', 'कुकी', 'sweets', ['piece']],
  ['iceCream', 'Ice cream', 'आइसक्रीम', 'sweets', ['cup']],
];

const toFood =
  (region: Region) =>
  ([key, name, hi, group, units, aliases]: Row): Food => ({
    ref: `${region === 'IN' ? 'in' : 'us'}:${key}`,
    name,
    ...(hi ? { hi } : {}),
    ...(aliases ? { aliases } : {}),
    group,
    units,
    region,
  });

export const builtInFoods: Food[] = [...indian.map(toFood('IN')), ...american.map(toFood('US'))];

export const foodByRef = new Map(builtInFoods.map((f) => [f.ref, f]));

export function foodName(food: Pick<Food, 'name' | 'hi'>, language: string): string {
  return language === 'hi' && food.hi ? food.hi : food.name;
}

const fold = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').trim();

/** Matches any name or alias; names that start with the query come first, then the person's region. */
export function searchFoods(foods: readonly Food[], query: string, region: Region): Food[] {
  const q = fold(query);
  const scored = foods
    .map((food) => {
      const names = [food.name, food.hi ?? '', ...(food.aliases ?? [])].map(fold);
      if (!q) return { food, score: 2 };
      if (names.some((n) => n.startsWith(q) || n.split(/\s+/).some((w) => w.startsWith(q))))
        return { food, score: 0 };
      if (names.some((n) => n.includes(q))) return { food, score: 1 };
      return null;
    })
    .filter((x): x is { food: Food; score: number } => x !== null);
  return scored
    .sort(
      (a, b) =>
        a.score - b.score ||
        Number(b.food.region === region) - Number(a.food.region === region) ||
        a.food.name.localeCompare(b.food.name),
    )
    .map((x) => x.food);
}
