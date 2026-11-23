import React, { createContext, useState, useContext, useEffect } from 'react';

const DICTIONARY = {
  English: {},
  Hindi: {
    "Dashboard": "डैशबोर्ड",
    "Chat Assistant": "चैट सहायक",
    "Symptom Checker": "लक्षण चेकर",
    "Disease Awareness": "रोग जागरूकता",
    "Vaccination Tracker": "टीकाकरण ट्रैकर",
    "Health Alerts": "स्वास्थ्य अलर्ट",
    "Daily Health Tips": "दैनिक स्वास्थ्य टिप्स",
    "Emergency Help": "आपातकालीन सहायता",
    "Profile": "प्रोफ़ाइल",
    "Settings": "सेटिंग्स",
    "HealthBridge AI": "हेल्थब्रिज एआई",
    "Your AI Health Companion": "आपका एआई स्वास्थ्य साथी",
    "Namaste!": "नमस्ते!",
    "How can I help you with your health today?": "आज मैं आपके स्वास्थ्य में कैसे मदद कर सकता हूँ?",
    "Recent Alerts": "हाल के अलर्ट",
    "Quick Access": "त्वरित पहुँच",
    "Ask Questions": "प्रश्न पूछें",
    "Vaccination Schedule": "टीकाकरण अनुसूची",
    "Active Alerts": "सक्रिय अलर्ट",
    "In your district": "आपके जिले में",
    "Health Tips": "स्वास्थ्य टिप्स",
    "New tips today": "आज के नए टिप्स",
    "Vaccines Due": "टीके देय",
    "This month": "इस महीने",
    "Health Profile": "स्वास्थ्य प्रोफ़ाइल",
    "Profile Complete": "प्रोफ़ाइल पूर्ण",
    "Upcoming Vaccines": "आगामी टीके",
    "View all": "सभी देखें",
    "Daily Health Tip": "दैनिक स्वास्थ्य टिप",
    "New": "नया",
    "Live Disease Surveillance": "लाइव रोग निगरानी",
    "Search diseases, symptoms, vaccines…": "बीमारियां, लक्षण, टीके खोजें…"
  },
  Odia: {
    "Dashboard": "ଡ୍ୟାସବୋର୍ଡ",
    "Chat Assistant": "ଚାଟ୍ ସହାୟକ",
    "Symptom Checker": "ଲକ୍ଷଣ ଯାଞ୍ଚକାରୀ",
    "Disease Awareness": "ରୋଗ ସଚେତନତା",
    "Vaccination Tracker": "ଟୀକାକରଣ ଟ୍ରାକର୍",
    "Health Alerts": "ସ୍ୱାସ୍ଥ୍ୟ ସତର୍କତା",
    "Daily Health Tips": "ଦୈନନ୍ଦିନ ସ୍ୱାସ୍ଥ୍ୟ ଟିପ୍ସ",
    "Emergency Help": "ଜରୁରୀକାଳୀନ ସହାୟତା",
    "Profile": "ପ୍ରୋଫାଇଲ୍",
    "Settings": "ସେଟିଂସମୂହ",
    "HealthBridge AI": "ହେଲ୍ଥ୍ ବ୍ରିଜ୍ ଏଆଇ",
    "Your AI Health Companion": "ଆପଣଙ୍କର ଏଆଇ ସ୍ୱାସ୍ଥ୍ୟ ସାଥୀ",
    "Namaste!": "ନମସ୍କାର!",
    "How can I help you with your health today?": "ଆଜି ମୁଁ ଆପଣଙ୍କ ସ୍ୱାସ୍ଥ୍ୟରେ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
    "Recent Alerts": "ସାମ୍ପ୍ରତିକ ସତର୍କତା",
    "Quick Access": "ତ୍ୱରିତ ପ୍ରବେଶ",
    "Ask Questions": "ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ",
    "Vaccination Schedule": "ଟୀକାକରଣ ସୂଚୀ",
    "Active Alerts": "ସକ୍ରିୟ ସତର୍କତା",
    "In your district": "ଆପଣଙ୍କ ଜିଲ୍ଲାରେ",
    "Health Tips": "ସ୍ୱାସ୍ଥ୍ୟ ଟିପ୍ସ",
    "New tips today": "ଆଜି ନୂଆ ଟିପ୍ସ",
    "Vaccines Due": "ଟୀକା ଦେୟ",
    "This month": "ଏହି ମାସରେ",
    "Health Profile": "ସ୍ୱାସ୍ଥ୍ୟ ପ୍ରୋଫାଇଲ୍",
    "Profile Complete": "ପ୍ରୋଫାଇଲ୍ ସମ୍ପୂର୍ଣ୍ଣ",
    "Upcoming Vaccines": "ଆସନ୍ତା ଟୀକା",
    "View all": "ସବୁ ଦେଖନ୍ତୁ",
    "Daily Health Tip": "ଦୈନନ୍ଦିନ ସ୍ୱାସ୍ଥ୍ୟ ଟିପ୍",
    "New": "ନୂଆ",
    "Live Disease Surveillance": "ଜୀବନ୍ତ ରୋଗ ନିରୀକ୍ଷଣ",
    "Search diseases, symptoms, vaccines…": "ରୋଗ, ଲକ୍ଷଣ, ଟିକା ଖୋଜନ୍ତୁ…"
  },
  Bengali: {
    "Dashboard": "ড্যাশবোর্ড",
    "Chat Assistant": "চ্যাট সহকারী",
    "Symptom Checker": "লক্ষণ পরীক্ষক",
    "Disease Awareness": "রোগ সচেতনতা",
    "Vaccination Tracker": "টিকা ট্র্যাকার",
    "Health Alerts": "স্বাস্থ্য সতর্কতা",
    "Daily Health Tips": "দৈনিক স্বাস্থ্য টিপস",
    "Emergency Help": "জরুরী সহায়তা",
    "Profile": "প্রোফাইল",
    "Settings": "সেটিংস",
    "HealthBridge AI": "হেলথব্রিজ এআই",
    "Your AI Health Companion": "আপনার এআই স্বাস্থ্য সঙ্গী",
    "Namaste!": "নমস্কার!",
    "How can I help you with your health today?": "আজ আমি আপনার স্বাস্থ্যে কীভাবে সাহায্য করতে পারি?",
    "Recent Alerts": "সাম্প্রতিক সতর্কতা",
    "Quick Access": "দ্রুত অ্যাক্সেস",
    "Ask Questions": "প্রশ্ন করুন",
    "Vaccination Schedule": "টিকা সময়সূচী",
    "Active Alerts": "সক্রিয় সতর্কতা",
    "In your district": "আপনার জেলায়",
    "Health Tips": "স্বাস্থ্য টিপস",
    "New tips today": "আজকের নতুন টিপস",
    "Vaccines Due": "টিকা বাকি",
    "This month": "এই মাসে",
    "Health Profile": "স্বাস্থ্য প্রোফাইল",
    "Profile Complete": "প্রোফাইল সম্পূর্ণ",
    "Upcoming Vaccines": "আসন্ন টিকা",
    "View all": "সব দেখুন",
    "Daily Health Tip": "দৈনিক স্বাস্থ্য টিপ",
    "New": "নতুন",
    "Live Disease Surveillance": "লাইভ রোগ নজরদারি",
    "Search diseases, symptoms, vaccines…": "রোগ, লক্ষণ, ভ্যাকসিন খুঁজুন…"
  },
  Telugu: {
    "Dashboard": "డ్యాష్‌బోర్డ్",
    "Chat Assistant": "చాట్ అసిస్టెంట్",
    "Symptom Checker": "లక్షణాల చెకర్",
    "Disease Awareness": "వ్యాధి అవగాహన",
    "Vaccination Tracker": "టీకా ట్రాకర్",
    "Health Alerts": "ఆరోగ్య హెచ్చరికలు",
    "Daily Health Tips": "రోజువారీ ఆరోగ్య చిట్కాలు",
    "Emergency Help": "అత్యవసర సహాయం",
    "Profile": "ప్రొఫైల్",
    "Settings": "సెట్టింగ్‌లు",
    "HealthBridge AI": "హెల్త్‌బ్రిడ్జ్ ఏఐ",
    "Your AI Health Companion": "మీ ఏఐ ఆరోగ్య సహచరుడు",
    "Namaste!": "నమస్తే!",
    "How can I help you with your health today?": "ఈ రోజు మీ ఆరోగ్యానికి నేను ఎలా సహాయపడగలను?",
    "Recent Alerts": "ఇటీవలి హెచ్చరికలు",
    "Quick Access": "త్వరిత ప్రాప్యత",
    "Ask Questions": "ప్రశ్నలు అడగండి",
    "Vaccination Schedule": "టీకా క్యాలెండర్",
    "Active Alerts": "క్రియాశీల హెచ్చరికలు",
    "In your district": "మీ జిల్లాలో",
    "Health Tips": "ఆరోగ్య చిట్కాలు",
    "New tips today": "ఈరోజు కొత్త చిట్కాలు",
    "Vaccines Due": "బకాయి ఉన్న టీకాలు",
    "This month": "ఈ నెలలో",
    "Health Profile": "ఆరోగ్య ప్రొఫైల్",
    "Profile Complete": "ప్రొఫైల్ పూర్తయింది",
    "Upcoming Vaccines": "రాబోయే టీకాలు",
    "View all": "అన్ని చూడండి",
    "Daily Health Tip": "రోజువారీ ఆరోగ్య చిట్కా",
    "New": "నవీకరించబడింది",
    "Live Disease Surveillance": "ప్రత్యక్ష వ్యాధి నిఘా",
    "Search diseases, symptoms, vaccines…": "వ్యాధులు, లక్షణాలు, టీకాలు శోధించండి…"
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('hb_react_lang') || 'English';
  });

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('hb_react_lang', newLang);
  };

  const t = (text) => {
    if (lang === 'English') return text;
    const translation = DICTIONARY[lang]?.[text];
    return translation ? translation : text;
  };

  useEffect(() => {
    // Add these meta tags to disable the Chrome Google Translate popup globally 
    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.classList.add('notranslate');
    let meta = document.querySelector('meta[name="google"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'google';
        meta.content = 'notranslate';
        document.head.appendChild(meta);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t, DICTIONARY }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
