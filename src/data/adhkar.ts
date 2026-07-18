import { Dhikr, Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'morning',
    nameAr: 'أذكار الصباح',
    nameEn: 'Morning Adhkar',
    descriptionAr: 'نور لصباحك وبركة ليومك',
    descriptionEn: 'Light for your morning and blessing for your day',
    icon: 'Sun',
    badge: '١٨ ذكراً',
    color: '#D4A017', // Gold highlight
  },
  {
    id: 'evening',
    nameAr: 'أذكار المساء',
    nameEn: 'Evening Adhkar',
    descriptionAr: 'طمأنينة لقلبك في نهاية اليوم',
    descriptionEn: 'Tranquility for your heart at the end of the day',
    icon: 'Moon',
    badge: '١٨ ذكراً',
    color: '#1F6C3A',
  },
  {
    id: 'sleep',
    nameAr: 'أذكار النوم',
    nameEn: 'Sleep Adhkar',
    descriptionAr: 'حفظ وهدوء لنوم هانئ',
    descriptionEn: 'Protection and peace for a restful sleep',
    icon: 'Bed',
    badge: '١٢ ذكراً',
    color: '#0F766E',
  },
  {
    id: 'prayer_after',
    nameAr: 'أذكار بعد الصلاة',
    nameEn: 'After Prayer Adhkar',
    descriptionAr: 'تثبيت للأجر بعد الفريضة',
    descriptionEn: 'Securing reward after the obligatory prayer',
    icon: 'Compass',
    badge: '١٠ أذكار',
    color: '#7F4025',
  }
];

export const DHIKR_LIST: Dhikr[] = [
  // Morning Adhkar
  {
    id: 'm1',
    category: 'morning',
    text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.',
    translation: 'We have reached the morning and at this very time all sovereignty belongs to Allah, and all praise is due to Allah...',
    reference: 'رواه مسلم',
    benefit: 'من قالها حين يصبح حُفظ في يومه وحين يمسي حُفظ في ليلته.',
    count: 1
  },
  {
    id: 'm2',
    category: 'morning',
    text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.',
    translation: 'In the Name of Allah, Who with His Name nothing can cause harm in the earth nor in the heaven...',
    reference: 'رواه أبو داود والترمذي',
    benefit: 'لم يضره شيء في ذلك اليوم أو تلك الليلة.',
    count: 3
  },
  {
    id: 'm3',
    category: 'morning',
    text: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.',
    translation: 'Allah is sufficient for me. There is no deity but He. Over Him I rely and He is the Lord of the Great Throne.',
    reference: 'رواه أبو داود',
    benefit: 'من قالها حين يصبح وحين يمسي سبع مرات كفاه الله ما أهمه من أمر الدنيا والآخرة.',
    count: 7
  },
  {
    id: 'm4',
    category: 'morning',
    text: 'رَضِيتُ بِاللَّهِ رَبَّاً، وَبِالْإِسْلَامِ دِينَاً، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيَّاً.',
    translation: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad as my Prophet.',
    reference: 'رواه الترمذي',
    benefit: 'من قالها ثلاثاً حين يصبح وثلاثاً حين يمسي كان حقاً على الله أن يرضيه يوم القيامة.',
    count: 3
  },
  {
    id: 'm5',
    category: 'morning',
    text: 'اللَّهُمَّ بكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ.',
    translation: 'O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die...',
    reference: 'رواه الترمذي',
    benefit: 'من أذكار الصباح المأثورة.',
    count: 1
  },
  {
    id: 'm6',
    category: 'morning',
    text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمَدَادَ كَلِمَاتِهِ.',
    translation: 'Glory is to Allah and praise is to Him, by the multitude of His creation, by His pleasure, by the weight of His Throne...',
    reference: 'رواه مسلم',
    benefit: 'تعدل الكثير من التسبيح والذكر في الأجر.',
    count: 3
  },
  {
    id: 'm7',
    category: 'morning',
    text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ.',
    translation: 'Glory be to Allah and His is the praise.',
    reference: 'رواه مسلم',
    benefit: 'حطت خطاياه وإن كانت مثل زبد البحر، ولم يأت أحد يوم القيامة بأفضل مما جاء به.',
    count: 100
  },

  // Evening Adhkar
  {
    id: 'e1',
    category: 'evening',
    text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ. رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ.',
    translation: 'We have reached the evening and at this very time all sovereignty belongs to Allah, and all praise is due to Allah...',
    reference: 'رواه مسلم',
    benefit: 'يقال مرة واحدة في المساء للحفظ والسلامة.',
    count: 1
  },
  {
    id: 'e2',
    category: 'evening',
    text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ.',
    translation: 'In the Name of Allah, Who with His Name nothing can cause harm in the earth nor in the heaven...',
    reference: 'رواه أبو داود والترمذي',
    benefit: 'لم يضره شيء في ليلته.',
    count: 3
  },
  {
    id: 'e3',
    category: 'evening',
    text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.',
    translation: 'I seek refuge in the Perfect Words of Allah from the evil of what He has created.',
    reference: 'رواه مسلم',
    benefit: 'من قالها حين يمسي ثلاث مرات لم تضره حُمة (لدغة عقرب أو ثعبان) في تلك الليلة.',
    count: 3
  },
  {
    id: 'e4',
    category: 'evening',
    text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.',
    translation: 'O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die...',
    reference: 'رواه الترمذي',
    benefit: 'من أذكار المساء المأثورة.',
    count: 1
  },
  {
    id: 'e5',
    category: 'evening',
    text: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ.',
    translation: 'Allah is sufficient for me. There is no deity but He...',
    reference: 'رواه أبو داود',
    benefit: 'تكفي العبد ما أهمه من أمر دنياه وآخرته.',
    count: 7
  },
  {
    id: 'e6',
    category: 'evening',
    text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ.',
    translation: 'Glory be to Allah and His is the praise.',
    reference: 'رواه مسلم',
    benefit: 'تقال مائة مرة لم يأت أحد يوم القيامة بأفضل مما جاء به إلا من قال مثل ما قال أو زاد.',
    count: 100
  },

  // Sleep Adhkar
  {
    id: 's1',
    category: 'sleep',
    text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا، بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.',
    translation: 'In Your name, my Lord, I lie down, and by Your name I rise. If You take my soul, have mercy on it...',
    reference: 'رواه البخاري ومسلم',
    benefit: 'أمان وحفظ للروح أثناء النوم.',
    count: 1
  },
  {
    id: 's2',
    category: 'sleep',
    text: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ.',
    translation: 'O Allah, protect me from Your punishment on the Day You resurrect Your servants.',
    reference: 'رواه أبو داود والترمذي',
    benefit: 'كان الرسول صلى الله عليه وسلم يضع يده تحت خده الأيمن ويقولها ثلاثاً.',
    count: 3
  },
  {
    id: 's3',
    category: 'sleep',
    text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا.',
    translation: 'In Your name, O Allah, I die and I live.',
    reference: 'رواه البخاري ومسلم',
    benefit: 'التذكير بالموت الأصغر والبعث قبل النوم.',
    count: 1
  },
  {
    id: 's4',
    category: 'sleep',
    text: 'قُلْ هُوَ اللَّهُ أَحَدٌ (١) اللَّهُ الصَّمَدُ (٢) لَمْ يَلِدْ وَلَمْ يُولَدْ (٣) وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ (٤) - قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ... - قُلْ أَعُوذُ بِرَبِّ النَّاسِ...',
    translation: 'Recitation of Surah Al-Ikhlas, Al-Falaq, and An-Nas.',
    reference: 'رواه البخاري',
    benefit: 'ينفث في كفيه ويمسح بهما ما استطاع من جسده يبدأ برأسه ووجهه (ثلاث مرات).',
    count: 3
  },

  // After Prayer Adhkar
  {
    id: 'p1',
    category: 'prayer_after',
    text: 'أَسْتَغْفِرُ اللهَ (ثَلاثَاً) اللَّهُمَّ أَنْتَ السَّلامُ، وَمِنْكَ السَّلامُ، تَبَارَكْتَ يَا ذَا الْجَلالِ وَالإِكْرَامِ.',
    translation: 'I ask Allah for forgiveness (three times). O Allah, You are peace and from You is peace...',
    reference: 'رواه مسلم',
    benefit: 'يقال فور السلام من الصلاة المكتوبة.',
    count: 1
  },
  {
    id: 'p2',
    category: 'prayer_after',
    text: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، اللَّهُمَّ لَا مَانِعَ لِمَا أَعْطَيْتَ، وَلَا مُعْطِيَ لِمَا مَنَعْتَ، وَلَا يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ.',
    translation: 'There is no deity but Allah alone, Who has no partner, His is the dominion and to Him is praise...',
    reference: 'رواه البخاري ومسلم',
    benefit: 'يقال دبر كل صلاة مكتوبة.',
    count: 1
  },
  {
    id: 'p3',
    category: 'prayer_after',
    text: 'سُبْحَانَ اللهِ (٣٣ مرة) - الحَمْدُ للهِ (٣٣ مرة) - اللهُ أَكْبَرُ (٣٣ مرة).',
    translation: 'Glory be to Allah (33 times), Praise be to Allah (33 times), Allah is the Greatest (33 times).',
    reference: 'رواه مسلم',
    benefit: 'من سبح الله دبر كل صلاة ثلاثاً وثلاثين... وغفرت خطاياه وإن كانت مثل زبد البحر.',
    count: 33
  },
  {
    id: 'p4',
    category: 'prayer_after',
    text: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ...',
    translation: 'Recitation of Ayah al-Kursi (2:255).',
    reference: 'رواه النسائي',
    benefit: 'من قرأها دبر كل صلاة مكتوبة لم يمنعه من دخول الجنة إلا أن يموت.',
    count: 1
  }
];
