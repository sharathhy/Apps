import type { Language } from '@/i18n';

/**
 * Week-by-week content, weeks 4 to 42 (weeks counted from the first day of
 * the last period). Plain, general information only, each with its source.
 * Every pregnancy is different; nothing here replaces a doctor or midwife.
 *
 * Sources:
 * - ACOG: FAQ "How Your Fetus Grows During Pregnancy"; Committee Opinion 579
 *   (term definitions); FAQ "Routine Tests During Pregnancy"; Committee
 *   Opinion 718 (Tdap in pregnancy).
 * - NHS: "Week-by-week guide to pregnancy"; "Your antenatal care"; "Vitamins,
 *   supplements and nutrition in pregnancy"; "Your baby's movements";
 *   "Inducing labour".
 * - WHO: "Recommendations on antenatal care for a positive pregnancy
 *   experience" (2016): at least 8 antenatal contacts.
 */
export type WeekSource = 'ACOG' | 'NHS' | 'WHO';

export interface WeekContent {
  baby: string;
  you: string;
  sources: WeekSource[];
}

type WeekText = Record<number, { baby: string; you: string }>;

const sources: Record<number, WeekSource[]> = {
  4: ['NHS'],
  5: ['ACOG', 'NHS'],
  6: ['ACOG', 'NHS'],
  7: ['ACOG', 'NHS'],
  8: ['ACOG', 'WHO'],
  9: ['ACOG', 'NHS'],
  10: ['ACOG', 'NHS'],
  11: ['ACOG', 'NHS'],
  12: ['ACOG', 'NHS'],
  13: ['NHS'],
  14: ['ACOG'],
  15: ['ACOG'],
  16: ['ACOG', 'NHS'],
  17: ['ACOG'],
  18: ['ACOG', 'NHS'],
  19: ['ACOG', 'NHS'],
  20: ['ACOG', 'NHS'],
  21: ['NHS'],
  22: ['ACOG'],
  23: ['ACOG'],
  24: ['ACOG'],
  25: ['NHS'],
  26: ['ACOG'],
  27: ['ACOG'],
  28: ['ACOG', 'NHS'],
  29: ['NHS'],
  30: ['ACOG'],
  31: ['NHS'],
  32: ['ACOG', 'NHS'],
  33: ['NHS'],
  34: ['NHS'],
  35: ['NHS'],
  36: ['NHS'],
  37: ['ACOG'],
  38: ['NHS'],
  39: ['ACOG'],
  40: ['NHS'],
  41: ['ACOG', 'NHS'],
  42: ['ACOG', 'NHS'],
};

const en: WeekText = {
  4: {
    baby: 'The fertilised egg has implanted in the lining of the womb and is starting to grow.',
    you: 'A home pregnancy test may now show positive. The NHS advises taking 400 micrograms of folic acid a day until week 12.',
  },
  5: {
    baby: 'The neural tube, which becomes the brain and spinal cord, is forming.',
    you: 'A missed period is often the first sign. Tiredness and sore breasts are common.',
  },
  6: {
    baby: 'The heart is starting to form and early cardiac activity may be seen on an ultrasound.',
    you: 'Nausea and vomiting are common. Small, frequent meals can help. Contact your doctor if you cannot keep fluids down.',
  },
  7: {
    baby: 'Small buds that will become arms and legs are appearing.',
    you: 'It is a good time to book your first antenatal appointment if you have not yet.',
  },
  8: {
    baby: 'Fingers and toes are beginning to form, and the main organs are developing.',
    you: 'WHO recommends at least eight antenatal contacts during pregnancy, with the first in the first 12 weeks.',
  },
  9: {
    baby: 'The face is taking shape, with the beginnings of eyes, nose and mouth.',
    you: 'There is no known safe amount of alcohol in pregnancy, so the NHS advises not drinking at all.',
  },
  10: {
    baby: 'From around now the embryo is called a fetus. The major organs have begun to form.',
    you: 'Your first appointment usually includes blood tests and questions about your health and history.',
  },
  11: {
    baby: 'Tooth buds are forming and the body is growing quickly.',
    you: 'A dating scan is usually offered between about 10 and 14 weeks. It also checks your due date.',
  },
  12: {
    baby: 'Most organs are formed and now keep growing and maturing.',
    you: 'Screening tests for some conditions may be offered with the dating scan. You can choose whether to have them.',
  },
  13: {
    baby: 'Vocal cords are forming and the bones are beginning to harden.',
    you: 'For many people, nausea starts to ease around now, though it can last longer.',
  },
  14: {
    baby: 'The second trimester begins. The baby may start to make small movements you cannot feel yet.',
    you: 'Many people find their energy returns in the second trimester.',
  },
  15: {
    baby: 'The skeleton keeps changing from soft cartilage to bone.',
    you: 'Your bump may begin to show. Comfortable, loose clothes can help.',
  },
  16: {
    baby: 'The muscles and nervous system are developing, and movements are getting stronger.',
    you: 'Some people feel the first movements between 16 and 24 weeks, often later in a first pregnancy.',
  },
  17: {
    baby: 'Fat stores are starting to form under the skin.',
    you: 'Back ache is common as your body changes. Good posture and gentle movement can help.',
  },
  18: {
    baby: 'The ears are developing and hearing is beginning.',
    you: 'The anatomy (anomaly) scan is usually done between about 18 and 22 weeks.',
  },
  19: {
    baby: 'A protective coating called vernix is forming on the skin.',
    you: 'The anomaly scan looks at how the baby is developing. You can ask questions at any point.',
  },
  20: {
    baby: 'You are about halfway. The baby is growing steadily and moving more.',
    you: 'Ask your doctor or midwife about anything you would like to know about your scan results.',
  },
  21: {
    baby: 'The baby swallows amniotic fluid, which helps the digestive system develop.',
    you: 'You may start to notice a pattern in your baby’s movements over the coming weeks.',
  },
  22: {
    baby: 'The senses keep developing, and the baby may respond to sound.',
    you: 'Talk to your doctor about the glucose test for gestational diabetes, usually done between 24 and 28 weeks.',
  },
  23: {
    baby: 'The lungs are developing, though they are not ready to work on their own yet.',
    you: 'Swollen ankles are common later in the day. Sudden swelling of the face or hands needs a call to your doctor.',
  },
  24: {
    baby: 'The baby is growing in length and gaining weight.',
    you: 'The glucose test for gestational diabetes is usually offered between 24 and 28 weeks.',
  },
  25: {
    baby: 'The baby’s hands are fully formed and may grasp.',
    you: 'In a first pregnancy, the NHS offers an appointment around 25 weeks to check your blood pressure and the baby’s growth.',
  },
  26: {
    baby: 'The eyes, closed until now, begin to open around this time.',
    you: 'If you feel unwell, very tired or low, talk to your doctor or midwife. Help is available.',
  },
  27: {
    baby: 'This is the last week of the second trimester. The brain is growing quickly.',
    you: 'ACOG recommends the Tdap (whooping cough) vaccine between 27 and 36 weeks of each pregnancy.',
  },
  28: {
    baby: 'The third trimester begins. The baby has regular sleep and wake times.',
    you: 'Get to know your baby’s usual pattern of movements. If they slow down or change, contact your maternity unit straight away.',
  },
  29: {
    baby: 'Muscles and lungs keep maturing, and the baby kicks and stretches.',
    you: 'Heartburn and trouble sleeping are common. Sleeping on your side is advised from 28 weeks.',
  },
  30: {
    baby: 'The baby is gaining weight quickly, with more fat under the skin.',
    you: 'Some people notice practice contractions (Braxton Hicks), which are usually irregular and painless.',
  },
  31: {
    baby: 'The brain and nervous system keep developing quickly.',
    you: 'You may feel more breathless as the womb grows. Rest when you need to.',
  },
  32: {
    baby: 'Toenails and fingernails have grown, and the baby practises breathing movements.',
    you: 'Many babies move into a head-down position over the next few weeks.',
  },
  33: {
    baby: 'The bones are hardening, though the skull stays soft for birth.',
    you: 'It can help to start thinking about your birth preferences and who will support you.',
  },
  34: {
    baby: 'The baby’s immune system is developing.',
    you: 'Make sure you know how to reach your maternity unit at any time of day.',
  },
  35: {
    baby: 'Most of the baby’s growth now is weight gain.',
    you: 'Consider packing your hospital bag so it is ready.',
  },
  36: {
    baby: 'The baby may settle lower in the pelvis.',
    you: 'Your doctor or midwife will check the baby’s position. Ask about the signs of labour.',
  },
  37: {
    baby: 'The baby is now considered “early term”.',
    you: 'Contact your maternity unit if your waters break, you have bleeding, or the baby moves less.',
  },
  38: {
    baby: 'The organs are ready to work outside the womb.',
    you: 'Rest when you can. It is normal to feel a mix of excitement and nerves.',
  },
  39: {
    baby: 'The baby is now “full term”.',
    you: 'Keep paying attention to the baby’s movements right up to and during labour.',
  },
  40: {
    baby: 'This is your estimated due date. Only a small share of babies are born on it.',
    you: 'Your doctor or midwife will talk with you about what happens if labour has not started.',
  },
  41: {
    baby: 'The baby is “late term”.',
    you: 'You may be offered a membrane sweep or induction. Ask about the benefits and risks of each choice.',
  },
  42: {
    baby: 'The baby is “post-term”.',
    you: 'Stay in close contact with your maternity team, who will advise you on what to do next.',
  },
};

const hi: WeekText = {
  4: {
    baby: 'निषेचित अंडा गर्भाशय की परत में जुड़ गया है और बढ़ना शुरू कर रहा है।',
    you: 'घर पर किया प्रेगनेंसी टेस्ट अब पॉज़िटिव दिख सकता है। NHS सलाह देता है कि 12वें हफ़्ते तक रोज़ 400 माइक्रोग्राम फ़ोलिक एसिड लें।',
  },
  5: {
    baby: 'न्यूरल ट्यूब बन रही है, जो आगे चलकर दिमाग़ और रीढ़ की हड्डी बनती है।',
    you: 'पीरियड का न आना अक्सर पहला संकेत होता है। थकान और स्तनों में दर्द आम है।',
  },
  6: {
    baby: 'दिल बनना शुरू हो रहा है और अल्ट्रासाउंड पर शुरुआती धड़कन दिख सकती है।',
    you: 'मतली और उल्टी आम हैं। थोड़ा-थोड़ा और बार-बार खाना मदद कर सकता है। अगर पानी भी न रुके तो डॉक्टर से संपर्क करें।',
  },
  7: {
    baby: 'छोटी कलियाँ दिख रही हैं, जो हाथ और पैर बनेंगी।',
    you: 'अगर अभी तक नहीं किया है, तो पहली प्रसवपूर्व जाँच (एंटीनेटल अपॉइंटमेंट) बुक करने का अच्छा समय है।',
  },
  8: {
    baby: 'उँगलियाँ बनना शुरू हो रही हैं और मुख्य अंग विकसित हो रहे हैं।',
    you: 'WHO गर्भावस्था में कम से कम आठ प्रसवपूर्व जाँचों की सलाह देता है, पहली जाँच पहले 12 हफ़्तों में।',
  },
  9: {
    baby: 'चेहरा आकार ले रहा है, आँख, नाक और मुँह की शुरुआत के साथ।',
    you: 'गर्भावस्था में शराब की कोई सुरक्षित मात्रा ज्ञात नहीं है, इसलिए NHS बिल्कुल न पीने की सलाह देता है।',
  },
  10: {
    baby: 'लगभग अब से भ्रूण को फ़ीटस कहा जाता है। मुख्य अंग बनने शुरू हो गए हैं।',
    you: 'पहली जाँच में आमतौर पर खून की जाँच और आपकी सेहत व इतिहास से जुड़े सवाल होते हैं।',
  },
  11: {
    baby: 'दाँतों की कलियाँ बन रही हैं और शरीर तेज़ी से बढ़ रहा है।',
    you: 'डेटिंग स्कैन आमतौर पर लगभग 10 से 14 हफ़्तों के बीच किया जाता है। इससे ड्यू डेट भी जाँची जाती है।',
  },
  12: {
    baby: 'ज़्यादातर अंग बन चुके हैं और अब बढ़ते और परिपक्व होते रहते हैं।',
    you: 'डेटिंग स्कैन के साथ कुछ स्थितियों की स्क्रीनिंग जाँच की पेशकश हो सकती है। इन्हें कराना आपकी मर्ज़ी है।',
  },
  13: {
    baby: 'स्वर-तंतु बन रहे हैं और हड्डियाँ सख़्त होना शुरू हो रही हैं।',
    you: 'कई लोगों में मतली लगभग अब कम होने लगती है, हालाँकि यह ज़्यादा समय तक भी रह सकती है।',
  },
  14: {
    baby: 'दूसरी तिमाही शुरू होती है। शिशु छोटी हरकतें कर सकता है जो अभी महसूस नहीं होतीं।',
    you: 'दूसरी तिमाही में कई लोगों की ऊर्जा लौट आती है।',
  },
  15: {
    baby: 'कंकाल नरम उपास्थि (कार्टिलेज) से हड्डी में बदलता जा रहा है।',
    you: 'आपका पेट दिखना शुरू हो सकता है। आरामदायक, ढीले कपड़े मदद कर सकते हैं।',
  },
  16: {
    baby: 'मांसपेशियाँ और तंत्रिका तंत्र विकसित हो रहे हैं, और हरकतें मज़बूत हो रही हैं।',
    you: 'कुछ लोगों को पहली हरकतें 16 से 24 हफ़्तों के बीच महसूस होती हैं, पहली गर्भावस्था में अक्सर बाद में।',
  },
  17: {
    baby: 'त्वचा के नीचे चर्बी जमा होना शुरू हो रही है।',
    you: 'शरीर बदलने से कमर दर्द आम है। सही मुद्रा और हल्की गतिविधि मदद कर सकती है।',
  },
  18: {
    baby: 'कान विकसित हो रहे हैं और सुनने की क्षमता शुरू हो रही है।',
    you: 'एनाटॉमी (एनॉमली) स्कैन आमतौर पर लगभग 18 से 22 हफ़्तों के बीच होता है।',
  },
  19: {
    baby: 'त्वचा पर वर्निक्स नाम की सुरक्षात्मक परत बन रही है।',
    you: 'एनॉमली स्कैन देखता है कि शिशु कैसे विकसित हो रहा है। आप कभी भी सवाल पूछ सकती हैं।',
  },
  20: {
    baby: 'आप लगभग आधे रास्ते पर हैं। शिशु लगातार बढ़ रहा है और ज़्यादा हिल रहा है।',
    you: 'स्कैन के नतीजों के बारे में जो भी जानना हो, अपने डॉक्टर या मिडवाइफ़ से पूछें।',
  },
  21: {
    baby: 'शिशु एम्नियोटिक द्रव निगलता है, जिससे पाचन तंत्र विकसित होता है।',
    you: 'आने वाले हफ़्तों में आप शिशु की हरकतों का एक पैटर्न देखना शुरू कर सकती हैं।',
  },
  22: {
    baby: 'इंद्रियाँ विकसित होती रहती हैं, और शिशु आवाज़ पर प्रतिक्रिया दे सकता है।',
    you: 'जेस्टेशनल डायबिटीज़ की ग्लूकोज़ जाँच के बारे में डॉक्टर से बात करें, जो आमतौर पर 24 से 28 हफ़्तों के बीच होती है।',
  },
  23: {
    baby: 'फेफड़े विकसित हो रहे हैं, हालाँकि अभी अपने आप काम करने के लिए तैयार नहीं हैं।',
    you: 'दिन के आख़िर में टखनों में सूजन आम है। चेहरे या हाथों में अचानक सूजन हो तो डॉक्टर को फ़ोन करें।',
  },
  24: {
    baby: 'शिशु की लंबाई और वज़न बढ़ रहा है।',
    you: 'जेस्टेशनल डायबिटीज़ की ग्लूकोज़ जाँच आमतौर पर 24 से 28 हफ़्तों के बीच कराई जाती है।',
  },
  25: {
    baby: 'शिशु के हाथ पूरी तरह बन गए हैं और पकड़ सकते हैं।',
    you: 'पहली गर्भावस्था में NHS लगभग 25 हफ़्ते पर ब्लड प्रेशर और शिशु की बढ़त जाँचने की अपॉइंटमेंट देता है।',
  },
  26: {
    baby: 'अब तक बंद आँखें लगभग इसी समय खुलना शुरू होती हैं।',
    you: 'अगर आप अस्वस्थ, बहुत थकी या उदास महसूस करें, तो डॉक्टर या मिडवाइफ़ से बात करें। मदद उपलब्ध है।',
  },
  27: {
    baby: 'यह दूसरी तिमाही का आख़िरी हफ़्ता है। दिमाग़ तेज़ी से बढ़ रहा है।',
    you: 'ACOG हर गर्भावस्था में 27 से 36 हफ़्तों के बीच Tdap (काली खाँसी) टीके की सलाह देता है।',
  },
  28: {
    baby: 'तीसरी तिमाही शुरू होती है। शिशु के सोने और जागने का नियमित समय होता है।',
    you: 'शिशु की हरकतों के सामान्य पैटर्न को पहचानें। अगर हरकतें धीमी हों या बदलें, तो तुरंत अपनी मैटरनिटी यूनिट से संपर्क करें।',
  },
  29: {
    baby: 'मांसपेशियाँ और फेफड़े परिपक्व हो रहे हैं, और शिशु लात मारता और खिंचता है।',
    you: 'सीने में जलन और नींद में परेशानी आम हैं। 28 हफ़्तों से करवट लेकर सोने की सलाह दी जाती है।',
  },
  30: {
    baby: 'शिशु का वज़न तेज़ी से बढ़ रहा है, त्वचा के नीचे ज़्यादा चर्बी के साथ।',
    you: 'कुछ लोगों को अभ्यास वाले संकुचन (ब्रैक्सटन हिक्स) महसूस होते हैं, जो आमतौर पर अनियमित और दर्दरहित होते हैं।',
  },
  31: {
    baby: 'दिमाग़ और तंत्रिका तंत्र तेज़ी से विकसित होते रहते हैं।',
    you: 'गर्भाशय बढ़ने से साँस फूल सकती है। ज़रूरत हो तो आराम करें।',
  },
  32: {
    baby: 'नाख़ून बढ़ गए हैं, और शिशु साँस लेने जैसी हरकतों का अभ्यास करता है।',
    you: 'कई शिशु अगले कुछ हफ़्तों में सिर नीचे की स्थिति में आ जाते हैं।',
  },
  33: {
    baby: 'हड्डियाँ सख़्त हो रही हैं, लेकिन जन्म के लिए खोपड़ी नरम रहती है।',
    you: 'अपनी जन्म संबंधी पसंद और आपका साथ कौन देगा, इसके बारे में सोचना शुरू करना मददगार हो सकता है।',
  },
  34: {
    baby: 'शिशु का प्रतिरक्षा तंत्र विकसित हो रहा है।',
    you: 'पक्का करें कि आप दिन के किसी भी समय अपनी मैटरनिटी यूनिट तक पहुँच सकें।',
  },
  35: {
    baby: 'अब शिशु की ज़्यादातर बढ़त वज़न में होती है।',
    you: 'अपना हॉस्पिटल बैग पैक करने के बारे में सोचें ताकि वह तैयार रहे।',
  },
  36: {
    baby: 'शिशु पेल्विस में नीचे की ओर आ सकता है।',
    you: 'आपके डॉक्टर या मिडवाइफ़ शिशु की स्थिति जाँचेंगे। प्रसव के संकेतों के बारे में पूछें।',
  },
  37: {
    baby: 'शिशु को अब “अर्ली टर्म” माना जाता है।',
    you: 'अगर पानी की थैली फटे, खून आए या शिशु कम हिले, तो अपनी मैटरनिटी यूनिट से संपर्क करें।',
  },
  38: {
    baby: 'अंग गर्भाशय के बाहर काम करने के लिए तैयार हैं।',
    you: 'जब हो सके आराम करें। उत्साह और घबराहट दोनों महसूस होना सामान्य है।',
  },
  39: {
    baby: 'शिशु अब “फ़ुल टर्म” है।',
    you: 'प्रसव तक और उसके दौरान भी शिशु की हरकतों पर ध्यान देती रहें।',
  },
  40: {
    baby: 'यह आपकी अनुमानित ड्यू डेट है। बहुत कम शिशु ठीक इसी दिन पैदा होते हैं।',
    you: 'अगर प्रसव शुरू न हुआ हो तो आगे क्या होगा, इस पर डॉक्टर या मिडवाइफ़ आपसे बात करेंगे।',
  },
  41: {
    baby: 'शिशु “लेट टर्म” है।',
    you: 'आपको मेम्ब्रेन स्वीप या इंडक्शन की पेशकश हो सकती है। हर विकल्प के फ़ायदे और जोखिम पूछें।',
  },
  42: {
    baby: 'शिशु “पोस्ट-टर्म” है।',
    you: 'अपनी मैटरनिटी टीम के लगातार संपर्क में रहें, जो आगे क्या करना है बताएगी।',
  },
};

const byLanguage: Record<Language, WeekText> = { en, hi };

export const weekNumbers = Object.keys(en).map(Number);

export function weekContent(week: number, language: Language): WeekContent | null {
  const text = byLanguage[language][week] ?? en[week];
  return text ? { ...text, sources: sources[week] ?? [] } : null;
}

/** Exported for the test that checks both languages cover every week. */
export const weekTextsForTest = byLanguage;
