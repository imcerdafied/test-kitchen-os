'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Camera,
  Mic,
  MicOff,
  Type,
  Upload,
  X,
  Loader2,
  ArrowRight,
  AlertTriangle,
  UserPlus,
  LogIn,
} from 'lucide-react';

interface ExpirationWarning {
  item: string;
  reason: string;
}

type InputMethod = 'photo' | 'voice' | 'text';

export function IngredientHero() {
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [expirationWarnings, setExpirationWarnings] = useState<ExpirationWarning[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Check auth state on mount and restore pending ingredients
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const pending = sessionStorage.getItem('pendingIngredients');
    if (pending) {
      sessionStorage.removeItem('pendingIngredients');
      const items = pending
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (items.length > 0) {
        setIngredients(items);
      }
    }
  }, [supabase.auth]);

  // Show auth prompt for anon users when they have input
  useEffect(() => {
    if (isLoggedIn === false && (textInput.length >= 3 || ingredients.length > 0)) {
      setShowAuthPrompt(true);
    } else {
      setShowAuthPrompt(false);
    }
  }, [isLoggedIn, textInput, ingredients]);

  const getAuthUrl = useCallback(() => {
    const allIngredients = [...ingredients];
    if (textInput.trim()) {
      const items = textInput.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
      allIngredients.push(...items);
    }
    const params = new URLSearchParams({ returnUrl: '/' });
    if (allIngredients.length > 0) {
      params.set('ingredients', allIngredients.join(','));
    }
    return `/auth?${params.toString()}`;
  }, [ingredients, textInput]);

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setImagePreview(base64);
        setLoading(true);
        setLoadingMessage('Identifying ingredients...');

        try {
          const res = await fetch('/api/analyze-fridge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          const data = await res.json();
          if (data.ingredients) {
            setIngredients(data.ingredients);
          }
          if (data.checkThese?.length > 0) {
            setExpirationWarnings(data.checkThese);
          }
        } catch {
          alert('Failed to identify ingredients. Please try again.');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const items = transcript
        .split(/,|and/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      setIngredients((prev) => [...prev, ...items]);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const addTextIngredients = () => {
    const items = textInput
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setIngredients((prev) => [...prev, ...items]);
    setTextInput('');
  };

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const generateRecipe = async () => {
    if (ingredients.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(getAuthUrl());
      return;
    }

    setLoading(true);
    setLoadingMessage('Creating your recipe...');

    try {
      // Generate recipe
      const recipeRes = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const recipeData = await recipeRes.json();
      if (!recipeData.recipe) throw new Error('No recipe returned');

      setLoadingMessage('Generating food image...');

      // Generate image
      const imageRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: recipeData.recipe.name,
          description: recipeData.recipe.description,
        }),
      });
      const imageData = await imageRes.json();

      // Save to Supabase
      setLoadingMessage('Saving your recipe...');
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: recipeData.recipe.name,
          description: recipeData.recipe.description,
          ingredients_input: ingredients.join(', '),
          ingredients_list: recipeData.recipe.ingredients_list,
          instructions: recipeData.recipe.instructions,
          nutritional_highlights: recipeData.recipe.nutritional_highlights,
          prep_time: recipeData.recipe.prep_time,
          cook_time: recipeData.recipe.cook_time,
          image_url: imageData.imageUrl || null,
          likes_count: 0,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/recipe/${data.id}`);
    } catch {
      alert('Failed to generate recipe. Please try again.');
      setLoading(false);
    }
  };

  return (
    <section className="px-4 sm:px-6 pt-12 pb-10">
      <div className="max-w-2xl mx-auto text-center">
        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4"
          style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
        >
          Whats in your kitchen?
        </h1>
        <p className="text-warm-gray text-lg sm:text-xl mb-8 max-w-lg mx-auto">
          Add your ingredients and we will create a healthy recipe — and share it
          with the community.
        </p>

        {/* Tabs */}
        <div className="flex bg-cream-200 rounded-2xl p-1 mb-6 max-w-md mx-auto">
          {[
            { id: 'photo' as InputMethod, icon: Camera, label: 'Photo upload' },
            { id: 'voice' as InputMethod, icon: Mic, label: 'Voice' },
            { id: 'text' as InputMethod, icon: Type, label: 'Type ingredients' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setInputMethod(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                inputMethod === id
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-warm-gray hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Photo input */}
        {inputMethod === 'photo' && (
          <div className="max-w-md mx-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden mb-4">
                <img
                  src={imagePreview}
                  alt="Uploaded"
                  className="w-full object-cover max-h-64 rounded-2xl"
                />
                <button
                  onClick={() => {
                    setImagePreview(null);
                    setIngredients([]);
                    setExpirationWarnings([]);
                  }}
                  className="absolute top-3 right-3 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full border-2 border-dashed border-cream-400 rounded-2xl p-10 text-center hover:border-terracotta/40 hover:bg-cream-200/50 transition-all"
              >
                <Upload size={36} className="mx-auto text-terracotta mb-3" />
                <p className="text-foreground font-medium">
                  Upload a photo of your fridge or pantry
                </p>
                <p className="text-sm text-warm-gray mt-1">
                  AI will identify the ingredients
                </p>
              </button>
            )}
            {loading && !loadingMessage.includes('recipe') && (
              <div className="flex items-center justify-center gap-2 text-warm-gray py-3">
                <Loader2 size={18} className="animate-spin" />
                {loadingMessage}
              </div>
            )}
          </div>
        )}

        {/* Voice input */}
        {inputMethod === 'voice' && (
          <div className="text-center space-y-4 py-4">
            <button
              onClick={toggleVoice}
              className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse-slow scale-110'
                  : 'bg-terracotta text-white hover:bg-terracotta-light'
              }`}
            >
              {isListening ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            <p className="text-warm-gray">
              {isListening
                ? 'Listening... Say your ingredients (separate with "and" or commas)'
                : 'Tap to start speaking'}
            </p>
          </div>
        )}

        {/* Text input */}
        {inputMethod === 'text' && (
          <div className="max-w-md mx-auto space-y-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type ingredients separated by commas or new lines...&#10;&#10;e.g., chicken breast, broccoli, garlic, olive oil, lemon"
              className="w-full h-32 px-4 py-3 rounded-2xl border border-cream-300 bg-white text-foreground placeholder:text-warm-gray/60 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && textInput.trim()) {
                  e.preventDefault();
                  addTextIngredients();
                }
              }}
            />
            <button
              onClick={addTextIngredients}
              disabled={!textInput.trim()}
              className="bg-foreground text-white px-5 py-2.5 rounded-xl font-medium hover:bg-foreground/90 transition-colors disabled:opacity-40"
            >
              Add Ingredients
            </button>
          </div>
        )}

        {/* Auth prompt for anonymous users */}
        {showAuthPrompt && (
          <div className="mt-6 max-w-md mx-auto animate-fade-in">
            <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 text-center">
              <p className="text-foreground font-medium mb-2">
                Looking good! Create a free account to generate your recipe and share it with the community.
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <a
                  href={getAuthUrl()}
                  className="inline-flex items-center gap-2 bg-terracotta text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-terracotta-light transition-colors"
                >
                  <UserPlus size={16} />
                  Create Account
                </a>
                <a
                  href={getAuthUrl()}
                  className="inline-flex items-center gap-2 border border-cream-400 text-foreground px-5 py-2.5 rounded-xl font-semibold hover:bg-cream-200 transition-colors"
                >
                  <LogIn size={16} />
                  Sign In
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Expiration warnings */}
        {expirationWarnings.length > 0 && (
          <div className="mt-6 max-w-lg mx-auto">
            <div
              className="rounded-2xl p-4 text-left"
              style={{ background: '#fef3c7', border: '1px solid #f59e0b40' }}
            >
              <h3 className="flex items-center gap-2 font-semibold text-sm mb-3" style={{ color: '#92400e' }}>
                <AlertTriangle size={16} />
                Use these soon
              </h3>
              <ul className="space-y-2">
                {expirationWarnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#78350f' }}>
                    <span className="font-medium">{w.item}</span>
                    <span style={{ color: '#a16207' }}>— {w.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Ingredient chips + generate button */}
        {ingredients.length > 0 && (
          <div className="mt-6 max-w-lg mx-auto">
            <div className="flex flex-wrap justify-center gap-2 mb-5">
              {ingredients.map((ing, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-cream-200 text-foreground px-3 py-1.5 rounded-full text-sm animate-fade-in"
                >
                  {ing}
                  <button
                    onClick={() => removeIngredient(i)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            {isLoggedIn && (
              <button
                onClick={generateRecipe}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-terracotta text-white px-8 py-3.5 rounded-full font-semibold hover:bg-terracotta-light transition-colors disabled:opacity-50 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    {loadingMessage}
                  </>
                ) : (
                  <>
                    Generate Recipe
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            )}
            {isLoggedIn && (
              <p className="text-sm text-warm-gray mt-3">
                Your recipe will be shared with the Test Kitchen community
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
