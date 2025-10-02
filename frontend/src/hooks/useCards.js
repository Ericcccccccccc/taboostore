import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { storage } from '../utils/storage';
import { selectNextCard, shouldReshuffle, getNextLanguage } from '../utils/gameLogic';

/**
 * Custom hook for card management with sessionStorage tracking
 * Prevents card repeats until all cards have been seen
 * Handles language alternation for 50/50 mode
 *
 * @param {Object} settings - Game settings (language, timerDuration, passLimit)
 * @returns {Object} Card state and controls
 */
export function useCards(settings) {
  const [currentCard, setCurrentCard] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(
    settings.language === '50/50' ? 'en' : settings.language
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store all available cards for each language
  const cardsRef = useRef({
    en: [],
    pt: []
  });

  // Track seen cards for each language
  const seenCardsRef = useRef({
    en: [],
    pt: []
  });

  /**
   * Load cards from API for a specific language
   */
  const loadCards = useCallback(async (language) => {
    try {
      const response = await api.getCards(language);
      if (response && response.cards) {
        cardsRef.current[language] = response.cards;
        return response.cards;
      }
      return [];
    } catch (err) {
      console.error(`Error loading ${language} cards:`, err);
      setError(`Failed to load ${language} cards`);
      return [];
    }
  }, []);

  /**
   * Initialize cards and load seen cards from sessionStorage
   */
  useEffect(() => {
    const initializeCards = async () => {
      setLoading(true);
      setError(null);

      try {
        // Determine which languages to load
        const languagesToLoad = settings.language === '50/50'
          ? ['en', 'pt']
          : [settings.language];

        // Load cards for each language
        await Promise.all(
          languagesToLoad.map(lang => loadCards(lang))
        );

        // Load seen cards from sessionStorage
        languagesToLoad.forEach(lang => {
          seenCardsRef.current[lang] = storage.getSeenCards(lang);
        });

        setLoading(false);
      } catch (err) {
        console.error('Error initializing cards:', err);
        setError('Failed to initialize game');
        setLoading(false);
      }
    };

    initializeCards();
  }, [settings.language, loadCards]);

  /**
   * Get the next card based on current language and seen cards
   */
  const nextCard = useCallback(() => {
    const cards = cardsRef.current[currentLanguage];
    const seenIds = seenCardsRef.current[currentLanguage];

    // Check if reshuffle is needed
    if (shouldReshuffle(cards.length, seenIds.length)) {
      // Clear seen cards for this language and start fresh
      storage.clearLanguageSeenCards(currentLanguage);
      seenCardsRef.current[currentLanguage] = [];
      storage.setLastShuffle();
    }

    // Select next card
    const card = selectNextCard(
      cards,
      seenCardsRef.current[currentLanguage],
      currentLanguage,
      settings.language === '50/50'
    );

    if (card) {
      // Mark card as seen
      seenCardsRef.current[currentLanguage] = [
        ...seenCardsRef.current[currentLanguage],
        card.id
      ];
      storage.addSeenCard(currentLanguage, card.id);

      // Set current card with language info
      setCurrentCard({
        ...card,
        language: currentLanguage
      });

      // Handle language alternation for 50/50 mode
      if (settings.language === '50/50') {
        const nextLang = getNextLanguage(currentLanguage, settings.language);
        setCurrentLanguage(nextLang);
      }

      return card;
    }

    return null;
  }, [currentLanguage, settings.language]);

  /**
   * Reset cards and clear all seen history
   */
  const resetCards = useCallback(() => {
    storage.clearSeenCards();
    seenCardsRef.current = {
      en: [],
      pt: []
    };
    setCurrentCard(null);
    setCurrentLanguage(settings.language === '50/50' ? 'en' : settings.language);
  }, [settings.language]);

  /**
   * Get statistics about card usage
   */
  const getStats = useCallback(() => {
    const stats = {};

    Object.keys(cardsRef.current).forEach(lang => {
      const total = cardsRef.current[lang].length;
      const seen = seenCardsRef.current[lang].length;
      const remaining = total - seen;

      stats[lang] = {
        total,
        seen,
        remaining,
        percentage: total > 0 ? Math.round((seen / total) * 100) : 0
      };
    });

    return stats;
  }, []);

  return {
    currentCard,
    currentLanguage,
    loading,
    error,
    nextCard,
    resetCards,
    getStats
  };
}

export default useCards;
