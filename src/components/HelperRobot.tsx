import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../store';
import { logger } from '../services/logger';
import HelperRobotModel from '../scenes/HelperRobotModel';
import { supabase } from '../services/supabase';
import { checkAndUpdateUserProgress } from '../services/auth';
import AppPanel from './AppPanel';
import { PanelBackdrop } from './AppPanel';
import { PanelTitle, PanelButton, PanelSelect } from './PanelElements';
import { POPULAR_LANGUAGES } from '../constants/languages';
import { translations as allTranslations, getTranslation, SupportedLanguage, type TranslationStrings } from '../constants/translations';
import { translationCache } from '../services/translationCache';
import { loadTranslations } from '../services/translationLoader';

interface HelperRobotProps {
  instructions: Record<string, string>;
  onLanguageSelect: (mother: string, target: string) => void;
  onLogin: () => void;
  position?: { x: number; y: number };
  scale?: number;
  onClick?: () => void;
}

const ANIMATION_SPEED = 30;
const PANEL_WIDTH = 600;
const PANEL_HEIGHT = 576;
const SPACING = 32; // 2rem or 32px consistent spacing

// Use the centralized language list - now supports all 30 languages!
const languages = POPULAR_LANGUAGES.map(lang => ({
  code: lang.code,
  name: `${lang.nativeName} (${lang.name})`,
  nameRu: `${lang.nativeName} (${lang.name})`  // We'll use native name for all
}));

// Helper function to get translations from cache or fallback to English
const getHelperTranslation = (language: string, key: string): string => {
  const lang = language as SupportedLanguage;
  
  // For English, return directly from bundled translations
  if (lang === 'en') {
    const translation = allTranslations.en[key as keyof TranslationStrings];
    return (translation as string) || key;
  }
  
  // Try to get from cache (translations loaded from Supabase)
  const cachedTranslations = translationCache.get(lang);
  if (cachedTranslations) {
    const translation = cachedTranslations[key as keyof TranslationStrings];
    if (translation) {
      return translation as string;
    }
  }
  
  // Fallback to English
  const englishTranslation = allTranslations.en[key as keyof TranslationStrings];
  return (englishTranslation as string) || key;
};

// Deprecated - keeping for reference but will be replaced with cached translations
const _localTranslations = {
  en: {
    whatLanguage: "Hi! I'm Turi, I will guide you on your language learning journey! Firstly, what language do you already speak?",
    whatToLearn: 'Good, now choose language you want to learn',
    ready: 'Ready to begin your journey!',
    selectDifferent: 'Please select a different language',
    chooseLanguage: 'Choose language...',
    chooseLanguageYouSpeak: 'Choose your native language',
    startJourney: 'Start my journey',
    haveAccount: 'Already have an account?',
    back: 'Back'
  },
  ru: {
    whatLanguage: 'Привет! Я Тури, я буду вашим проводником в изучении языка! Для начала, какой язык вы уже знаете?',
    whatToLearn: 'Отлично, теперь выберите язык, который хотите изучать',
    ready: 'Готовы начать путешествие!',
    selectDifferent: 'Пожалуйста, выберите другой язык',
    chooseLanguage: 'Выберите язык...',
    chooseLanguageYouSpeak: 'Выберите родной язык',
    startJourney: 'Начать мое путешествие',
    haveAccount: 'Уже есть аккаунт?',
    back: 'Назад'
  },
  de: {
    whatLanguage: 'Hallo! Ich bin Turi und werde Sie auf Ihrer Sprachlernreise begleiten! Zunächst, welche Sprache sprechen Sie bereits?',
    whatToLearn: 'Gut, wählen Sie nun die Sprache aus, die Sie lernen möchten',
    ready: 'Bereit, Ihre Reise zu beginnen!',
    selectDifferent: 'Bitte wählen Sie eine andere Sprache',
    chooseLanguage: 'Sprache auswählen...',
    chooseLanguageYouSpeak: 'Wählen Sie Ihre Muttersprache',
    startJourney: 'Meine Reise beginnen',
    haveAccount: 'Bereits ein Konto?',
    back: 'Zurück'
  },
  es: {
    whatLanguage: '¡Hola! Soy Turi, ¡seré tu guía en tu viaje de aprendizaje de idiomas! Primero, ¿qué idioma ya hablas?',
    whatToLearn: 'Bien, ahora elige el idioma que quieres aprender',
    ready: '¡Listo para comenzar tu viaje!',
    selectDifferent: 'Por favor, selecciona un idioma diferente',
    chooseLanguage: 'Elegir idioma...',
    chooseLanguageYouSpeak: 'Elige tu lengua materna',
    startJourney: 'Comenzar mi viaje',
    haveAccount: '¿Ya tienes una cuenta?',
    back: 'Atrás'
  },
  fr: {
    whatLanguage: 'Bonjour ! Je suis Turi, je serai votre guide dans votre voyage d\'apprentissage des langues ! Tout d\'abord, quelle langue parlez-vous déjà ?',
    whatToLearn: 'Bien, maintenant choisissez la langue que vous voulez apprendre',
    ready: 'Prêt à commencer votre voyage !',
    selectDifferent: 'Veuillez sélectionner une langue différente',
    chooseLanguage: 'Choisir la langue...',
    chooseLanguageYouSpeak: 'Choisissez votre langue maternelle',
    startJourney: 'Commencer mon voyage',
    haveAccount: 'Déjà un compte ?',
    back: 'Retour'
  },
  it: {
    whatLanguage: 'Ciao! Sono Turi, ti guiderò nel tuo viaggio di apprendimento delle lingue! Prima di tutto, quale lingua parli già?',
    whatToLearn: 'Bene, ora scegli la lingua che vuoi imparare',
    ready: 'Pronto per iniziare il tuo viaggio!',
    selectDifferent: 'Per favore, seleziona una lingua diversa',
    chooseLanguage: 'Scegli la lingua...',
    chooseLanguageYouSpeak: 'Scegli la tua lingua madre',
    startJourney: 'Iniziare il mio viaggio',
    haveAccount: 'Hai già un account?',
    back: 'Indietro'
  },
  pt: {
    whatLanguage: 'Olá! Eu sou Turi, serei seu guia na sua jornada de aprendizado de idiomas! Primeiro, qual idioma você já fala?',
    whatToLearn: 'Ótimo, agora escolha o idioma que você quer aprender',
    ready: 'Pronto para começar sua jornada!',
    selectDifferent: 'Por favor, selecione um idioma diferente',
    chooseLanguage: 'Escolher idioma...',
    chooseLanguageYouSpeak: 'Escolha seu idioma nativo',
    startJourney: 'Começar minha jornada',
    haveAccount: 'Já tem uma conta?',
    back: 'Voltar'
  },
  ar: {
    whatLanguage: 'مرحباً! أنا توري، سأكون مرشدك في رحلة تعلم اللغة! أولاً، ما هي اللغة التي تتحدثها بالفعل؟',
    whatToLearn: 'جيد، الآن اختر اللغة التي تريد تعلمها',
    ready: 'مستعد لبدء رحلتك!',
    selectDifferent: 'الرجاء اختيار لغة مختلفة',
    chooseLanguage: 'اختر اللغة...',
    chooseLanguageYouSpeak: 'اختر لغتك الأم',
    startJourney: 'ابدأ رحلتي',
    haveAccount: 'هل لديك حساب بالفعل؟',
    back: 'رجوع'
  },
  CH: {
    whatLanguage: '你好！我是图里，我将指导您的语言学习之旅！首先，您已经会说什么语言？',
    whatToLearn: '很好，现在选择您想学习的语言',
    ready: '准备开始您的旅程！',
    selectDifferent: '请选择其他语言',
    chooseLanguage: '选择语言...',
    chooseLanguageYouSpeak: '选择您的母语',
    startJourney: '开始我的旅程',
    haveAccount: '已有账户？',
    back: '返回'
  },
  ja: {
    whatLanguage: 'こんにちは！私はトゥリです。言語学習の旅のガイドを務めさせていただきます！まず、すでに話せる言語は何ですか？',
    whatToLearn: 'では、学びたい言語を選んでください',
    ready: '旅を始める準備ができました！',
    selectDifferent: '別の言語を選択してください',
    chooseLanguage: '言語を選択...',
    chooseLanguageYouSpeak: '母国語を選択してください',
    startJourney: '私の旅を始める',
    haveAccount: 'すでにアカウントをお持ちですか？',
    back: '戻る'
  },
  hi: {
    whatLanguage: 'नमस्ते! मैं तूरी हूं, मैं आपकी भाषा सीखने की यात्रा में आपका मार्गदर्शन करूंगा! सबसे पहले, आप पहले से कौन सी भाषा बोलते हैं?',
    whatToLearn: 'अच्छा, अब वह भाषा चुनें जिसे आप सीखना चाहते हैं',
    ready: 'अपनी यात्रा शुरू करने के लिए तैयार!',
    selectDifferent: 'कृपया एक अलग भाषा चुनें',
    chooseLanguage: 'भाषा चुनें...',
    chooseLanguageYouSpeak: 'अपनी मातृभाषा चुनें',
    startJourney: 'मेरी यात्रा शुरू करें',
    haveAccount: 'क्या आपके पास पहले से खाता है?',
    back: 'वापस'
  },
  bn: {
    whatLanguage: 'হ্যালো! আমি তুরি, আমি আপনার ভাষা শেখার যাত্রায় আপনাকে গাইড করব! প্রথমে, আপনি ইতিমধ্যে কোন ভাষা বলেন?',
    whatToLearn: 'ভাল, এখন আপনি যে ভাষা শিখতে চান তা চয়ন করুন',
    ready: 'আপনার যাত্রা শুরু করতে প্রস্তুত!',
    selectDifferent: 'অনুগ্রহ করে একটি ভিন্ন ভাষা নির্বাচন করুন',
    chooseLanguage: 'ভাষা চয়ন করুন...',
    chooseLanguageYouSpeak: 'আপনার মাতৃভাষা চয়ন করুন',
    startJourney: 'আমার যাত্রা শুরু করুন',
    haveAccount: 'ইতিমধ্যে একটি অ্যাকাউন্ট আছে?',
    back: 'পিছনে'
  },
  id: {
    whatLanguage: 'Halo! Saya Turi, saya akan memandu Anda dalam perjalanan belajar bahasa! Pertama, bahasa apa yang sudah Anda kuasai?',
    whatToLearn: 'Bagus, sekarang pilih bahasa yang ingin Anda pelajari',
    ready: 'Siap memulai perjalanan Anda!',
    selectDifferent: 'Silakan pilih bahasa yang berbeda',
    chooseLanguage: 'Pilih bahasa...',
    chooseLanguageYouSpeak: 'Pilih bahasa ibu Anda',
    startJourney: 'Mulai perjalanan saya',
    haveAccount: 'Sudah punya akun?',
    back: 'Kembali'
  },
  ur: {
    whatLanguage: 'ہیلو! میں توری ہوں، میں آپ کی زبان سیکھنے کے سفر میں آپ کی رہنمائی کروں گا! سب سے پہلے، آپ پہلے سے کون سی زبان بولتے ہیں؟',
    whatToLearn: 'اچھا، اب وہ زبان منتخب کریں جو آپ سیکھنا چاہتے ہیں',
    ready: 'اپنا سفر شروع کرنے کے لیے تیار!',
    selectDifferent: 'براہ کرم ایک مختلف زبان منتخب کریں',
    chooseLanguage: 'زبان منتخب کریں...',
    chooseLanguageYouSpeak: 'اپنی مادری زبان منتخب کریں',
    startJourney: 'میرا سفر شروع کریں',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    back: 'واپس'
  },
  sw: {
    whatLanguage: 'Habari! Mimi ni Turi, nitakuongoza katika safari yako ya kujifunza lugha! Kwanza, unazungumza lugha gani tayari?',
    whatToLearn: 'Vizuri, sasa chagua lugha unayotaka kujifunza',
    ready: 'Uko tayari kuanza safari yako!',
    selectDifferent: 'Tafadhali chagua lugha tofauti',
    chooseLanguage: 'Chagua lugha...',
    chooseLanguageYouSpeak: 'Chagua lugha yako ya mama',
    startJourney: 'Anza safari yangu',
    haveAccount: 'Tayari una akaunti?',
    back: 'Rudi'
  },
  te: {
    whatLanguage: 'హలో! నేను తూరి, నేను మీ భాషా అభ్యాస యాత్రలో మీకు మార్గనిర్దేశం చేస్తాను! మొదట, మీరు ఇప్పటికే ఏ భాష మాట్లాడుతున్నారు?',
    whatToLearn: 'మంచిది, ఇప్పుడు మీరు నేర్చుకోవాలనుకుంటున్న భాషను ఎంచుకోండి',
    ready: 'మీ యాత్ర ప్రారంభించడానికి సిద్ధంగా ఉన్నారా!',
    selectDifferent: 'దయచేసి వేరే భాషను ఎంచుకోండి',
    chooseLanguage: 'భాషను ఎంచుకోండి...',
    chooseLanguageYouSpeak: 'మీ మాతృభాషను ఎంచుకోండి',
    startJourney: 'నా యాత్రను ప్రారంభించండి',
    haveAccount: 'ఇప్పటికే ఖాతా ఉందా?',
    back: 'వెనక్కి'
  },
  mr: {
    whatLanguage: 'नमस्कार! मी तुरी आहे, मी तुमच्या भाषा शिकण्याच्या प्रवासात तुम्हाला मार्गदर्शन करेन! प्रथम, तुम्ही आधीच कोणती भाषा बोलता?',
    whatToLearn: 'चांगले, आता तुम्हाला शिकायची असलेली भाषा निवडा',
    ready: 'तुमचा प्रवास सुरू करण्यासाठी तयार!',
    selectDifferent: 'कृपया वेगळी भाषा निवडा',
    chooseLanguage: 'भाषा निवडा...',
    chooseLanguageYouSpeak: 'तुमची मातृभाषा निवडा',
    startJourney: 'माझा प्रवास सुरू करा',
    haveAccount: 'आधीच खाते आहे?',
    back: 'मागे'
  },
  ta: {
    whatLanguage: 'வணக்கம்! நான் தூரி, உங்கள் மொழி கற்றல் பயணத்தில் நான் உங்களுக்கு வழிகாட்டுவேன்! முதலில், நீங்கள் ஏற்கனவே என்ன மொழி பேசுகிறீர்கள்?',
    whatToLearn: 'நல்லது, இப்போது நீங்கள் கற்க விரும்பும் மொழியைத் தேர்வு செய்யவும்',
    ready: 'உங்கள் பயணத்தைத் தொடங்க தயாரா!',
    selectDifferent: 'தயவுசெய்து வேறு மொழியைத் தேர்வு செய்யவும்',
    chooseLanguage: 'மொழியைத் தேர்வு செய்யவும்...',
    chooseLanguageYouSpeak: 'உங்கள் தாய்மொழியைத் தேர்வு செய்யவும்',
    startJourney: 'என் பயணத்தைத் தொடங்கவும்',
    haveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    back: 'பின்'
  },
  tr: {
    whatLanguage: 'Merhaba! Ben Turi, dil öğrenme yolculuğunuzda size rehberlik edeceğim! Öncelikle, zaten hangi dili konuşuyorsunuz?',
    whatToLearn: 'Güzel, şimdi öğrenmek istediğiniz dili seçin',
    ready: 'Yolculuğunuza başlamaya hazır!',
    selectDifferent: 'Lütfen farklı bir dil seçin',
    chooseLanguage: 'Dil seçin...',
    chooseLanguageYouSpeak: 'Ana dilinizi seçin',
    startJourney: 'Yolculuğuma başla',
    haveAccount: 'Zaten bir hesabınız var mı?',
    back: 'Geri'
  },
  ko: {
    whatLanguage: '안녕하세요! 저는 투리입니다. 여러분의 언어 학습 여정을 안내해 드리겠습니다! 먼저, 어떤 언어를 이미 구사하십니까?',
    whatToLearn: '좋습니다, 이제 배우고 싶은 언어를 선택하세요',
    ready: '여정을 시작할 준비가 되셨습니까!',
    selectDifferent: '다른 언어를 선택해 주세요',
    chooseLanguage: '언어 선택...',
    chooseLanguageYouSpeak: '모국어를 선택하세요',
    startJourney: '내 여정 시작',
    haveAccount: '이미 계정이 있으신가요?',
    back: '뒤로'
  },
  vi: {
    whatLanguage: 'Xin chào! Tôi là Turi, tôi sẽ hướng dẫn bạn trong hành trình học ngôn ngữ! Trước tiên, bạn đã biết ngôn ngữ nào?',
    whatToLearn: 'Tốt, bây giờ hãy chọn ngôn ngữ bạn muốn học',
    ready: 'Sẵn sàng bắt đầu hành trình của bạn!',
    selectDifferent: 'Vui lòng chọn một ngôn ngữ khác',
    chooseLanguage: 'Chọn ngôn ngữ...',
    chooseLanguageYouSpeak: 'Chọn ngôn ngữ mẹ đẻ của bạn',
    startJourney: 'Bắt đầu hành trình của tôi',
    haveAccount: 'Đã có tài khoản?',
    back: 'Quay lại'
  },
  th: {
    whatLanguage: 'สวัสดี! ฉันคือทูรี ฉันจะเป็นผู้นำทางในการเดินทางเรียนรู้ภาษาของคุณ! ก่อนอื่น คุณพูดภาษาอะไรอยู่แล้ว?',
    whatToLearn: 'ดี ตอนนี้เลือกภาษาที่คุณต้องการเรียนรู้',
    ready: 'พร้อมที่จะเริ่มการเดินทางของคุณแล้ว!',
    selectDifferent: 'โปรดเลือกภาษาอื่น',
    chooseLanguage: 'เลือกภาษา...',
    chooseLanguageYouSpeak: 'เลือกภาษาแม่ของคุณ',
    startJourney: 'เริ่มการเดินทางของฉัน',
    haveAccount: 'มีบัญชีอยู่แล้ว?',
    back: 'กลับ'
  },
  pl: {
    whatLanguage: 'Cześć! Jestem Turi, będę prowadzić Cię w podróży nauki języka! Po pierwsze, jakim językiem już mówisz?',
    whatToLearn: 'Dobrze, teraz wybierz język, którego chcesz się nauczyć',
    ready: 'Gotowy do rozpoczęcia swojej podróży!',
    selectDifferent: 'Proszę wybrać inny język',
    chooseLanguage: 'Wybierz język...',
    chooseLanguageYouSpeak: 'Wybierz swój język ojczysty',
    startJourney: 'Rozpocznij moją podróż',
    haveAccount: 'Masz już konto?',
    back: 'Wstecz'
  },
  uk: {
    whatLanguage: 'Привіт! Я Турі, я буду вашим гідом у подорожі вивчення мови! По-перше, якою мовою ви вже розмовляєте?',
    whatToLearn: 'Добре, тепер виберіть мову, яку ви хочете вивчити',
    ready: 'Готові розпочати свою подорож!',
    selectDifferent: 'Будь ласка, виберіть іншу мову',
    chooseLanguage: 'Виберіть мову...',
    chooseLanguageYouSpeak: 'Виберіть свою рідну мову',
    startJourney: 'Розпочати мою подорож',
    haveAccount: 'Вже є обліковий запис?',
    back: 'Назад'
  },
  nl: {
    whatLanguage: 'Hallo! Ik ben Turi, ik zal je begeleiden op je taalleerreis! Ten eerste, welke taal spreek je al?',
    whatToLearn: 'Goed, kies nu de taal die je wilt leren',
    ready: 'Klaar om aan je reis te beginnen!',
    selectDifferent: 'Selecteer een andere taal',
    chooseLanguage: 'Kies taal...',
    chooseLanguageYouSpeak: 'Kies je moedertaal',
    startJourney: 'Begin mijn reis',
    haveAccount: 'Heb je al een account?',
    back: 'Terug'
  },
  ro: {
    whatLanguage: 'Bună! Sunt Turi, te voi ghida în călătoria ta de învățare a limbilor! Mai întâi, ce limbă vorbești deja?',
    whatToLearn: 'Bine, acum alege limba pe care vrei să o înveți',
    ready: 'Gata să începi călătoria!',
    selectDifferent: 'Vă rugăm să selectați o altă limbă',
    chooseLanguage: 'Alege limba...',
    chooseLanguageYouSpeak: 'Alege limba ta maternă',
    startJourney: 'Începe călătoria mea',
    haveAccount: 'Ai deja un cont?',
    back: 'Înapoi'
  },
  el: {
    whatLanguage: 'Γεια σας! Είμαι ο Τούρι, θα σας καθοδηγήσω στο ταξίδι εκμάθησης γλώσσας! Πρώτα απ\' όλα, ποια γλώσσα μιλάτε ήδη;',
    whatToLearn: 'Καλά, τώρα επιλέξτε τη γλώσσα που θέλετε να μάθετε',
    ready: 'Έτοιμοι να ξεκινήσετε το ταξίδι σας!',
    selectDifferent: 'Παρακαλώ επιλέξτε διαφορετική γλώσσα',
    chooseLanguage: 'Επιλέξτε γλώσσα...',
    chooseLanguageYouSpeak: 'Επιλέξτε τη μητρική σας γλώσσα',
    startJourney: 'Ξεκινήστε το ταξίδι μου',
    haveAccount: 'Έχετε ήδη λογαριασμό;',
    back: 'Πίσω'
  },
  cs: {
    whatLanguage: 'Ahoj! Jsem Turi, budu tě provázet na tvé cestě učení jazyka! Nejprve, jakým jazykem už mluvíš?',
    whatToLearn: 'Dobře, nyní vyber jazyk, který se chceš naučit',
    ready: 'Připraven začít svou cestu!',
    selectDifferent: 'Prosím vyber jiný jazyk',
    chooseLanguage: 'Vyber jazyk...',
    chooseLanguageYouSpeak: 'Vyber svůj rodný jazyk',
    startJourney: 'Začít mou cestu',
    haveAccount: 'Už máš účet?',
    back: 'Zpět'
  },
  sv: {
    whatLanguage: 'Hej! Jag är Turi, jag kommer att guida dig på din språkinlärningsresa! Först och främst, vilket språk talar du redan?',
    whatToLearn: 'Bra, välj nu det språk du vill lära dig',
    ready: 'Redo att börja din resa!',
    selectDifferent: 'Vänligen välj ett annat språk',
    chooseLanguage: 'Välj språk...',
    chooseLanguageYouSpeak: 'Välj ditt modersmål',
    startJourney: 'Börja min resa',
    haveAccount: 'Har du redan ett konto?',
    back: 'Tillbaka'
  },
  hu: {
    whatLanguage: 'Helló! Turi vagyok, végigvezetlek a nyelvtanulási utadon! Először is, milyen nyelven beszélsz már?',
    whatToLearn: 'Jó, most válaszd ki a nyelvet, amit tanulni szeretnél',
    ready: 'Készen állsz az utazás megkezdésére!',
    selectDifferent: 'Kérlek válassz másik nyelvet',
    chooseLanguage: 'Válassz nyelvet...',
    chooseLanguageYouSpeak: 'Válaszd ki az anyanyelvédet',
    startJourney: 'Kezdd el az utazásom',
    haveAccount: 'Már van fiókod?',
    back: 'Vissza'
  }
};

const HelperRobot: React.FC<HelperRobotProps> = ({ 
  instructions, 
  onLanguageSelect, 
  onLogin,
  position = { x: 0, y: 0 },
  scale = 1,
  onClick
}) => {
  const { 
    isHelperRobotOpen, 
    isLanguageSelected,
    modelPaths,
    setIsLanguageSelected,
    user,
    isLoggedIn,
    targetLanguage,
    motherLanguage
  } = useStore();
  
  const [selectedMotherLang, setSelectedMotherLang] = useState<string>('');
  const [selectedTargetLang, setSelectedTargetLang] = useState<string>('');
  const [step, setStep] = useState<'mother' | 'target' | 'ready'>('mother');
  const [isAnimating, setIsAnimating] = useState(true);
  const [hasAnimationStarted, setHasAnimationStarted] = useState(false);
  const [texts, setTexts] = useState({
    question: '',
    account: ''
  });
  
  // State for rotating language placeholder
  const [placeholderLang, setPlaceholderLang] = useState<string>('en');
  
  // Use the helper function to get translations from cache
  const currentLang = selectedMotherLang || 'en';
  const t = {
    whatLanguage: getHelperTranslation(currentLang, 'whatLanguage'),
    whatToLearn: getHelperTranslation(currentLang, 'whatToLearn'),
    ready: getHelperTranslation(currentLang, 'ready'),
    selectDifferent: getHelperTranslation(currentLang, 'selectDifferent'),
    chooseLanguage: getHelperTranslation(currentLang, 'chooseLanguage'),
    chooseLanguageYouSpeak: getHelperTranslation(currentLang, 'chooseLanguageYouSpeak'),
    startJourney: getHelperTranslation(currentLang, 'startJourney'),
    haveAccount: getHelperTranslation(currentLang, 'alreadyHaveAccount'), // Use correct key
    back: getHelperTranslation(currentLang, 'goBack') // Use correct key
  };
  const placeholderText = getHelperTranslation(placeholderLang, 'chooseLanguageYouSpeak');

  // Preload translations when mother language is selected
  useEffect(() => {
    if (selectedMotherLang && selectedMotherLang !== 'en') {
      loadTranslations(selectedMotherLang as SupportedLanguage).catch(error => {
        console.error(`Failed to preload translations for ${selectedMotherLang}:`, error);
      });
    }
  }, [selectedMotherLang]);
  
  // Setup rotation of placeholder languages
  useEffect(() => {
    // Only rotate when on the mother language selection step
    if (step !== 'mother') return;
    
    const languageCodes = ['en', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'CH', 'ja'];
    let currentIndex = 0;
    
    // Preload a few common languages for the placeholder rotation
    languageCodes.forEach(lang => {
      if (lang !== 'en') {
        loadTranslations(lang as SupportedLanguage).catch(() => {});
      }
    });
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % languageCodes.length;
      setPlaceholderLang(languageCodes[currentIndex]);
    }, 2000); // Rotate every 2 seconds
    
    return () => clearInterval(interval);
  }, [step]);

  const animateAllTexts = (questionText: string, accountText: string) => {
    setIsAnimating(true);
    setHasAnimationStarted(true);
    let iteration = 0;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const maxLength = Math.max(questionText.length, accountText.length);
    
    const interval = setInterval(() => {
      setTexts(prev => ({
        question: questionText
          .split('')
          .map((letter, index) => {
            if (index < iteration) return letter;
            return letters[Math.floor(Math.random() * 26)];
          })
          .join(''),
        account: accountText
          .split('')
          .map((letter, index) => {
            if (index < iteration) return letter;
            return letters[Math.floor(Math.random() * 26)];
          })
          .join('')
      }));
      
      iteration += 1;
      
      if (iteration > maxLength) {
        clearInterval(interval);
        setIsAnimating(false);
      }
    }, ANIMATION_SPEED);
  };

  useEffect(() => {
    // Add 1 second delay for the first text animation to prevent glitches when deployed online
    const timer = setTimeout(() => {
      animateAllTexts(translations.en.whatLanguage, translations.en.haveAccount);
    }, 1000);
    
    // Debug mount/unmount
    console.log("🤖 HelperRobot component MOUNTED");
    return () => {
      clearTimeout(timer);
      console.log("🤖 HelperRobot component UNMOUNTED");
    };
  }, []);

  useEffect(() => {
    // Only animate when returning to 'mother' step, not on initial mount
    if (step === 'mother' && selectedMotherLang !== '') {
      animateAllTexts(t.whatLanguage, t.haveAccount);
    }
  }, [step === 'mother', t.whatLanguage, t.haveAccount, selectedMotherLang]);

  const handleMotherLanguageSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    if (!lang) return;
    
    setSelectedMotherLang(lang);
    
    // Load translations first if not English
    if (lang !== 'en') {
      try {
        await loadTranslations(lang as SupportedLanguage);
      } catch (error) {
        console.error(`Failed to load translations for ${lang}:`, error);
      }
    }
    
    // Now move to next step and get translations (which are now cached)
    setStep('target');
    const whatToLearn = getHelperTranslation(lang, 'whatToLearn');
    const haveAccount = getHelperTranslation(lang, 'alreadyHaveAccount');
    animateAllTexts(whatToLearn, haveAccount);
  };

  const handleTargetLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    if (!lang || lang === selectedMotherLang) {
      setTexts(prev => ({
        ...prev,
        question: t.selectDifferent
      }));
      return;
    }
    
    setSelectedTargetLang(lang);
    setStep('ready');
    animateAllTexts(t.ready, t.haveAccount);
  };

  const handleStartJourney = () => {
    onLanguageSelect(selectedMotherLang, selectedTargetLang);
    setIsLanguageSelected(true);
  };

  const handleBack = () => {
    if (step === 'target') {
      setStep('mother');
      setSelectedMotherLang('');
      animateAllTexts(t.whatLanguage, t.haveAccount);
    } else if (step === 'ready') {
      setStep('target');
      setSelectedTargetLang('');
      setTexts({
        question: t.whatToLearn,
        account: t.haveAccount
      });
    }
  };

  // Handle robot click - delegate to parent onClick handler
  const handleRobotClick = (e: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("🤖 Helper robot clicked! User:", user?.id, "isLoggedIn:", isLoggedIn);
    logger.info('Helper robot clicked', { userId: user?.id, isLoggedIn });
    
    // Call the onClick prop if it exists
    if (onClick) {
      console.log("🤖 Calling parent onClick handler");
      onClick();
    }
  };
  
  return (
    <div className="pointer-events-auto fixed" style={{ zIndex: 100 }}>
      <div className="relative">
        <div 
          className="w-96 h-96 mb-2 helper-robot-container cursor-pointer relative"
          onClick={handleRobotClick}
          style={{ pointerEvents: 'auto' }}
        >

          
          <Canvas 
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              e.stopPropagation();
              console.log("🤖 Canvas clicked");
              handleRobotClick(e as any);
            }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <HelperRobotModel 
              path={modelPaths.helperRobot} 
              onClick={() => handleRobotClick(undefined as any)}
            />
          </Canvas>
        </div>
        
        {/* LANGUAGE SELECTION PANEL - only show when this is being used for language selection */}
        {instructions.mode === "language_selection" && !isLanguageSelected && !isLoggedIn && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30" style={{ zIndex: 101 }}>
            <div 
              className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden"
              style={{ 
                width: PANEL_WIDTH,
                height: PANEL_HEIGHT,
                padding: SPACING 
              }}
            >
              {/* Question section - fixed height */}
              <div className="h-32 flex items-center justify-center">
                <h2 className={`text-2xl font-bold text-center text-slate-100 ${isAnimating ? 'animate-glitch' : ''}`}>
                  {hasAnimationStarted ? (texts.question || t.whatLanguage) : ''}
                </h2>
              </div>
              
              {/* Dropdowns section - fixed position */}
              <div className="space-y-4">
                {/* Label for mother language selection */}
                <div className="mb-1 text-slate-300 text-lg font-medium">
                  {step === 'mother' && 
                    <span className="flex items-center">
                      <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
                    </span>
                  }
                </div>
                <select
                  value={selectedMotherLang}
                  onChange={handleMotherLanguageSelect}
                  className={`w-full h-16 rounded-lg bg-slate-800/60 border text-white transition-all appearance-none px-4 ${
                    step === 'mother' 
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 animate-pulse-subtle' 
                      : 'border-slate-700'
                  }`}
                  disabled={step !== 'mother'}
                >
                  <option value="" className="bg-gray-900">
                    {step === 'mother' ? placeholderText : t.chooseLanguageYouSpeak}
                  </option>
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-gray-900">
                      {lang.name}
                    </option>
                  ))}
                </select>
                
                <div className={`transition-all duration-300 ${step === 'mother' ? 'opacity-0 pointer-events-none absolute' : 'opacity-100'}`}>
                  <div className="mb-1 text-slate-300 text-lg font-medium mt-6">
                    {step === 'target' && 
                      <span className="flex items-center">
                        <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full mr-2 animate-pulse"></span>
                      </span>
                    }
                  </div>
                  <select
                    value={selectedTargetLang}
                    onChange={handleTargetLanguageSelect}
                    className={`w-full h-16 rounded-lg bg-slate-800/60 border text-white transition-all appearance-none px-4 ${
                      step === 'target' 
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 animate-pulse-subtle' 
                        : 'border-slate-700'
                    }`}
                    disabled={step === 'mother' || step === 'ready'}
                  >
                    <option value="" className="bg-gray-900">
                      {t.chooseLanguage}
                    </option>
                    {languages.map(lang => (
                      <option 
                        key={lang.code} 
                        value={lang.code}
                        className="bg-gray-900"
                        disabled={lang.code === selectedMotherLang}
                      >
                        {lang.code === selectedMotherLang ? `${lang.name} (${t.selectDifferent})` : lang.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Action buttons - fixed position at bottom */}
              <div className={`absolute bottom-8 left-8 right-8 flex ${step === 'target' || step === 'ready' ? 'justify-between' : 'justify-end'}`}>
                {(step === 'target' || step === 'ready') && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 rounded-lg border border-slate-600 bg-slate-800/40 text-slate-300 hover:bg-slate-700/60 hover:border-slate-500 transition-all"
                  >
                    {t.back}
                  </button>
                )}
                
                {step === 'target' && selectedTargetLang && selectedTargetLang !== selectedMotherLang && (
                  <button
                    onClick={handleStartJourney}
                    className="px-6 py-3 rounded-lg border-2 border-indigo-500 bg-indigo-600/20 text-slate-100 hover:bg-indigo-500 hover:text-white transition-all flex items-center"
                  >
                    {t.startJourney}
                  </button>
                )}
                
                {step === 'ready' && (
                  <button
                    onClick={handleStartJourney}
                    className="px-6 py-3 rounded-lg border-2 border-indigo-500 bg-indigo-600/20 text-slate-100 hover:bg-indigo-500 hover:text-white transition-all flex items-center"
                  >
                    {t.startJourney}
                  </button>
                )}
                
                <div className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer flex items-center">
                  <button onClick={() => {
                    // Toggle helper robot to hide the language panel
                    useStore.getState().toggleHelperRobot();
                    // Call the onLogin callback to show the login panel
                    onLogin();
                  }}>{t.haveAccount}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelperRobot;