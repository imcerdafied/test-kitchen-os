'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { GeneratedRecipe } from '@/types';
import {
  Camera,
  Mic,
  MicOff,
  Type,
  Upload,
  X,
  Loader2,
  ChefHat,
  Clock,
  Sparkles,
  Check,
  ArrowRight,
} from 'lucide-react';

type InputMethod = 'photo' | 'voice' | 'text';
type Step = 'input' | 'review' | 'generating' | 'result';

export default function CreatePage() {
  const [step, setStep] = useState<Step>('input');
  const [inputMethod, setInputMethod] = useState<InputMethod>('text');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [textInput, setTextInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Photo upload handler
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
          const res = await fetch('/api/identify-ingredients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          const data = await res.json();
          if (data.ingredients) {
            setIngredients(data.ingredients);
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

  // Voice input handler
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

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // Add text ingredients
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

  // Generate recipe
  const generateRecipe = async () => {
    if (ingredients.length === 0) return;

    setStep('generating');
    setLoadingMessage('Creating your recipe...');

    try {
      const recipeRes = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      });
      const recipeData = await recipeRes.json();

      if (!recipeData.recipe) throw new Error('No recipe returned');
      setRecipe(recipeData.recipe);

      setLoadingMessage('Generating food image...');
      const imageRes = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeName: recipeData.recipe.name,
          description: recipeData.recipe.description,
        }),
      });
      const imageData = await imageRes.json();
      if (imageData.imageUrl) {
        setRecipeImage(imageData.imageUrl);
      }

      setStep('result');
    } catch {
      alert('Failed to generate recipe. Please try again.');
      setStep('review');
    }
  };

  // Save recipe to Supabase
  const saveRecipe = async () => {
    if (!recipe) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        user_id: user.id,
        name: recipe.name,
        description: recipe.description,
        ingredients_input: ingredients.join(', '),
        ingredients_list: recipe.ingredients_list,
        instructions: recipe.instructions,
        nutritional_highlights: recipe.nutritional_highlights,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        image_url: recipeImage,
        likes_count: 0,
      })
      .select()
      .single();

    if (error) {
      alert('Failed to save recipe. Please sign in first.');
      setLoading(false);
      return;
    }

    setSavedRecipeId(data.id);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Step: Input */}
      {step === 'input' && (
        <div className="animate-fade-in">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-900 mb-3">
              What&apos;s in your kitchen?
            </h1>
            <p className="text-green-700/60 text-lg">
              Add ingredients using any method below
            </p>
          </div>

          {/* Method tabs */}
          <div className="flex bg-cream-200 rounded-2xl p-1 mb-8">
            {[
              { id: 'photo' as InputMethod, icon: Camera, label: 'Photo' },
              { id: 'voice' as InputMethod, icon: Mic, label: 'Voice' },
              { id: 'text' as InputMethod, icon: Type, label: 'Type' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setInputMethod(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                  inputMethod === id
                    ? 'bg-white text-green-900 shadow-sm'
                    : 'text-green-700/60 hover:text-green-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Photo input */}
          {inputMethod === 'photo' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="Uploaded"
                    width={600}
                    height={400}
                    className="w-full object-cover max-h-80"
                  />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setIngredients([]);
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
                  className="w-full border-2 border-dashed border-cream-400 rounded-2xl p-12 text-center hover:border-green-400 hover:bg-green-50/50 transition-all"
                >
                  <Upload size={40} className="mx-auto text-green-600 mb-3" />
                  <p className="text-green-800 font-medium">
                    Upload a photo of your fridge or pantry
                  </p>
                  <p className="text-sm text-green-700/50 mt-1">
                    AI will identify the ingredients
                  </p>
                </button>
              )}
              {loading && (
                <div className="flex items-center justify-center gap-2 text-green-700 py-4">
                  <Loader2 size={18} className="animate-spin" />
                  {loadingMessage}
                </div>
              )}
            </div>
          )}

          {/* Voice input */}
          {inputMethod === 'voice' && (
            <div className="text-center space-y-4">
              <button
                onClick={toggleVoice}
                className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse-slow scale-110'
                    : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              <p className="text-green-700/70">
                {isListening
                  ? 'Listening... Say your ingredients (separate with "and" or commas)'
                  : 'Tap to start speaking'}
              </p>
            </div>
          )}

          {/* Text input */}
          {inputMethod === 'text' && (
            <div className="space-y-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type ingredients separated by commas or new lines...&#10;&#10;e.g., chicken breast, broccoli, garlic, olive oil, lemon"
                className="w-full h-40 px-4 py-3 rounded-2xl border border-cream-300 bg-white text-green-900 placeholder:text-green-700/40 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
              />
              <button
                onClick={addTextIngredients}
                disabled={!textInput.trim()}
                className="bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-800 transition-colors disabled:opacity-40"
              >
                Add Ingredients
              </button>
            </div>
          )}

          {/* Ingredient chips */}
          {ingredients.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-medium text-green-800 mb-3">
                Your ingredients ({ingredients.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm animate-fade-in"
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
              <button
                onClick={() => setStep('review')}
                className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-green-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-800 transition-colors"
              >
                <Sparkles size={18} />
                Generate Recipe
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step: Review ingredients */}
      {step === 'review' && (
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Ready to cook?
          </h2>
          <p className="text-green-700/60 mb-6">
            Review your ingredients before generating a recipe
          </p>
          <div className="bg-white rounded-2xl border border-cream-300/50 p-6 mb-6">
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ing, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm"
                >
                  {ing}
                  <button
                    onClick={() => removeIngredient(i)}
                    className="hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('input')}
              className="px-6 py-3 rounded-full border border-cream-300 text-green-800 font-medium hover:bg-cream-200 transition-colors"
            >
              Back
            </button>
            <button
              onClick={generateRecipe}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-green-700 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-800 transition-colors"
            >
              <Sparkles size={18} />
              Generate Recipe
            </button>
          </div>
        </div>
      )}

      {/* Step: Generating */}
      {step === 'generating' && (
        <div className="animate-fade-in text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <Loader2 size={36} className="animate-spin text-green-700" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            {loadingMessage}
          </h2>
          <p className="text-green-700/60">
            Our AI chef is crafting something delicious...
          </p>
        </div>
      )}

      {/* Step: Result */}
      {step === 'result' && recipe && (
        <div className="animate-fade-in">
          {/* Recipe image */}
          {recipeImage && (
            <div className="rounded-2xl overflow-hidden mb-8 shadow-lg">
              <Image
                src={recipeImage}
                alt={recipe.name}
                width={800}
                height={600}
                className="w-full object-cover max-h-96"
              />
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-bold text-green-900 mb-3">
            {recipe.name}
          </h1>
          <p className="text-lg text-green-700/70 mb-6">{recipe.description}</p>

          {/* Time badges */}
          <div className="flex flex-wrap gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 bg-cream-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <Clock size={14} /> Prep: {recipe.prep_time}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-cream-200 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
              <Clock size={14} /> Cook: {recipe.cook_time}
            </span>
          </div>

          {/* Nutritional highlights */}
          {recipe.nutritional_highlights.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-green-800 mb-2 uppercase tracking-wide">
                Nutritional Highlights
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipe.nutritional_highlights.map((h, i) => (
                  <span
                    key={i}
                    className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ingredients */}
          <div className="bg-white rounded-2xl border border-cream-300/50 p-6 mb-6">
            <h3 className="font-semibold text-green-900 text-lg mb-4 flex items-center gap-2">
              <ChefHat size={20} /> Ingredients
            </h3>
            <ul className="space-y-2">
              {recipe.ingredients_list.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-green-800">
                  <Check size={16} className="text-green-500 mt-0.5 shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-2xl border border-cream-300/50 p-6 mb-8">
            <h3 className="font-semibold text-green-900 text-lg mb-4">
              Instructions
            </h3>
            <ol className="space-y-4">
              {recipe.instructions.map((inst, i) => (
                <li key={i} className="flex gap-4 text-green-800">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-green-700 text-white text-sm flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <p className="pt-0.5">{inst}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {savedRecipeId ? (
              <button
                onClick={() => router.push(`/recipe/${savedRecipeId}`)}
                className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-800 transition-colors"
              >
                View Recipe <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={saveRecipe}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-full font-semibold hover:bg-green-800 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                Save & Share
              </button>
            )}
            <button
              onClick={() => {
                setStep('input');
                setIngredients([]);
                setRecipe(null);
                setRecipeImage(null);
                setSavedRecipeId(null);
              }}
              className="px-6 py-3 rounded-full border border-cream-300 text-green-800 font-medium hover:bg-cream-200 transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
