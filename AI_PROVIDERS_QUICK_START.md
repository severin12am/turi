# AI Providers Quick Start Guide

**Get your multi-provider AI system running in 5 minutes!**

## ⚡ Quick Setup

### 1. Get Your API Keys (5 minutes)

#### Required (for basic functionality):
- **Gemini** (free tier): https://makersuite.google.com/app/apikey
- **Groq** (free): https://console.groq.com/ → Keys → Create API Key

#### Optional (for better features):
- **Deepseek**: https://platform.deepseek.com/ → API Keys
- **Google TTS** (for voices): https://console.cloud.google.com/ → Enable Text-to-Speech API
- **ElevenLabs** (premium voices): https://elevenlabs.io/app/settings/api-keys

### 2. Add Keys to Netlify (2 minutes)

1. Go to your Netlify dashboard
2. Site settings → Environment variables
3. Add these keys:

```bash
GOOGLE_GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
DEEPSEEK_API_KEY=your_deepseek_key  # optional
GOOGLE_TTS_API_KEY=your_tts_key  # optional
ELEVENLABS_API_KEY=your_elevenlabs_key  # optional
```

4. Save and redeploy your site

### 3. Configure Provider Mix (1 minute)

Edit `src/config/aiConfig.ts`:

**Option A: Balanced (default)** - Already configured! ✅

**Option B: Preserve Gemini quota** - Change these percentages:
```typescript
'dialogue-generation': [
  { provider: 'groq', percentage: 70, model: 'mixtral-8x7b-32768' },
  { provider: 'gemini', percentage: 30, model: 'gemini-1.5-flash' }
],
```

**Option C: Only free providers (Gemini + Groq)**:
```typescript
// Set Deepseek percentage to 0, add to Groq
'dialogue-generation': [
  { provider: 'gemini', percentage: 40, model: 'gemini-1.5-flash' },
  { provider: 'groq', percentage: 60, model: 'mixtral-8x7b-32768' }
],
```

### 4. Test It! (1 minute)

1. Deploy to Netlify
2. Open your app
3. Generate a dialogue or talk to an NPC
4. Check browser console - you should see:
   ```
   [AIRouter] Selected provider: groq, model: mixtral-8x7b-32768
   ```

## 🎯 What Each Provider Does

| Provider | Cost | Speed | Quality | Best For |
|----------|------|-------|---------|----------|
| **Gemini** | Free tier limited | Medium | Excellent | Word explanations, structured tasks |
| **Groq** | Free | **Very Fast** | Good | Real-time NPC conversations |
| **Deepseek** | Paid | Medium | Excellent | Quality explanations |
| **Google TTS** | Paid (cheap) | Fast | Good | Basic voice |
| **ElevenLabs** | Free tier limited | Medium | **Best** | Premium character voices |

## 🎨 ElevenLabs Voice Setup (Optional)

If you want premium voices for characters:

### 1. Get Voice IDs (3 minutes)
1. Go to https://elevenlabs.io/app/voice-library
2. Pick a male voice → Click → Copy Voice ID
3. Pick a female voice → Click → Copy Voice ID

### 2. Update Config
Edit `src/config/aiConfig.ts`:

```typescript
'tts-npc': [
  {
    provider: 'elevenlabs',
    percentage: 60,
    elevenLabsVoices: {
      male: 'YOUR_MALE_VOICE_ID_HERE',    // Paste here
      female: 'YOUR_FEMALE_VOICE_ID_HERE' // Paste here
    }
  } as TTSConfig,
  {
    provider: 'google',
    percentage: 40
  } as TTSConfig
]
```

## 📊 Recommended Starting Configuration

For most users with limited budget:

```typescript
// Heavy tasks: Split between Groq (fast) and Gemini (quality)
'dialogue-generation': [
  { provider: 'groq', percentage: 60, model: 'mixtral-8x7b-32768' },
  { provider: 'gemini', percentage: 40, model: 'gemini-1.5-flash' }
],

// Real-time tasks: Use fast Groq
'npc-response': [
  { provider: 'groq', percentage: 100, model: 'mixtral-8x7b-32768' }
],

// Quality tasks: Use Gemini
'word-explanation': [
  { provider: 'gemini', percentage: 100, model: 'gemini-1.5-flash' }
],

// TTS: Mostly free Google, some ElevenLabs for special moments
'tts-npc': [
  { provider: 'google', percentage: 80 },
  { provider: 'elevenlabs', percentage: 20, elevenLabsVoices: {...} }
]
```

## 🔍 Monitoring Your Usage

### Check quotas regularly:
- **Gemini**: https://makersuite.google.com/app/apikey (shows requests/day)
- **Groq**: https://console.groq.com/ (shows requests/tokens)
- **ElevenLabs**: https://elevenlabs.io/app/usage (shows characters used)

### What to watch:
- Gemini free tier: ~60 requests/minute
- Groq free tier: Very generous (100+ requests/minute)
- ElevenLabs free tier: 10,000 characters/month

## 🚨 Common Issues

### "Server configuration error"
→ API key not set in Netlify. Go to Netlify → Environment variables

### "All providers failed"
→ Check you have at least 2 API keys set (Gemini + Groq recommended)

### ElevenLabs voice not working
→ Check voice IDs are correct (must be from your ElevenLabs account)

### Slow responses
→ Increase Groq percentage (it's the fastest)

## 💡 Pro Tips

1. **Start simple**: Just use Gemini + Groq (both free!)
2. **Monitor first week**: See which provider gets used most
3. **Adjust percentages**: Based on your usage patterns
4. **Save ElevenLabs**: Use Google TTS for most things, ElevenLabs for important dialogues
5. **Keep 20% buffer**: Don't put any provider at 100% (always have backup)

## ✅ Checklist

- [ ] Got Gemini API key
- [ ] Got Groq API key  
- [ ] Added keys to Netlify environment variables
- [ ] Redeployed site
- [ ] Tested dialogue generation
- [ ] Tested NPC conversation
- [ ] Checked browser console for provider logs
- [ ] (Optional) Set up ElevenLabs voices
- [ ] (Optional) Got Deepseek key for better quality

## 🎓 Next Steps

Once everything works:
1. Read full guide: `AI_PROVIDER_CONFIGURATION_GUIDE.md`
2. Monitor usage for a week
3. Adjust percentages based on your needs
4. Consider premium features (ElevenLabs, Deepseek) if needed

## 📞 Need Help?

Check the full configuration guide for detailed troubleshooting: `AI_PROVIDER_CONFIGURATION_GUIDE.md`

---

**That's it! You're now using multiple AI providers with automatic load balancing! 🎉**

