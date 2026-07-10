import { firebaseConfig } from './config/firebase.js';
const pastLives = [
  { era: 'Ancient Egypt', title: 'Priestess of Isis', description: 'You served as a sacred keeper of ancient wisdom, performing rituals for the pharaohs and guiding souls through the afterlife. Your connection to spiritual realms runs deep.', location: 'Nile Delta, Egypt', lesson: 'Mastering divine feminine energy and healing arts', traits: ['Intuition', 'Spiritual wisdom', 'Healing ability'] },
  { era: 'Medieval Europe', title: 'Court Alchemist', description: 'You pursued forbidden knowledge in the courts of medieval lords, seeking to transmute metals and unlock the secrets of the universe. Your quest for understanding was ahead of its time.', location: 'Prague, Bohemia', lesson: 'Patience with the slow march of knowledge', traits: ['Curiosity', 'Persistence', 'Intellectual depth'] },
  { era: 'Renaissance Italy', title: 'Artist & Visionary', description: 'You created masterpieces that moved souls and changed the course of art history. Your creative spirit burned bright, leaving beauty in your wake.', location: 'Florence, Italy', lesson: 'Expressing the divine through art', traits: ['Creativity', 'Vision', 'Aesthetic sense'] },
  { era: 'Ancient Greece', title: 'Philosopher Teacher', description: 'You walked the agora of Athens, engaging in debates about virtue, truth, and the nature of reality. Your words influenced generations to come.', location: 'Athens, Greece', lesson: 'The pursuit of wisdom and truth', traits: ['Reason', 'Teaching', 'Love of knowledge'] },
  { era: 'Feudal Japan', title: 'Samurai of Honor', description: 'You lived by the code of Bushido, protecting your lord with unwavering loyalty. Your discipline and honor shaped your every action.', location: 'Kyoto, Japan', lesson: 'Living with honor and purpose', traits: ['Discipline', 'Loyalty', 'Courage'] },
  { era: 'Viking Age', title: 'Shield Maiden', description: 'You sailed the northern seas, challenging expectations and proving that strength comes in many forms. Your spirit was untamed and free.', location: 'Norway', lesson: 'Breaking free from limitations', traits: ['Independence', 'Bravery', 'Freedom'] },
  { era: 'Mughal India', title: 'Court Musician', description: 'Your music enchanted the courts of emperors, weaving emotions into melodies that transcended language. Art was your spiritual practice.', location: 'Agra, India', lesson: 'Using art as a path to the divine', traits: ['Artistic talent', 'Emotional depth', 'Devotion'] },
  { era: 'Colonial America', title: 'Healer & Herbalist', description: 'You walked the frontier, using knowledge of plants and natural remedies to heal communities. Your wisdom was passed down through generations.', location: 'Virginia Colony', lesson: 'Healing through natural wisdom', traits: ['Compassion', 'Resourcefulness', 'Nurturing'] },
  { era: 'Ancient China', title: 'Scholar Poet', description: 'You composed verse that captured the essence of seasons, love, and longing. Your words were windows into the soul of your culture.', location: 'Chang\'an, China', lesson: 'Finding beauty in impermanence', traits: ['Sensitivity', 'Artistry', 'Contemplation'] },
  { era: 'Ottoman Empire', title: 'Merchant & Traveler', description: 'You traversed the Silk Road, trading goods and ideas between East and West. Your connections spanned continents and cultures.', location: 'Istanbul', lesson: 'Building bridges between worlds', traits: ['Ambition', 'Adaptability', 'Vision'] }
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    firebaseConfig.initialize().catch(console.warn);
  const revealBtn = document.getElementById('reveal-btn');
  const resultsSection = document.getElementById('results-section');
  const newBtn = document.getElementById('new-btn');
  const premiumBtn = document.getElementById('premium-btn');
  
  revealBtn?.addEventListener('click', revealPastLife);
  newBtn?.addEventListener('click', () => { resultsSection.style.display = 'none'; document.getElementById('birth-date').value = ''; document.getElementById('birth-place').value = ''; document.getElementById('birth-time').value = ''; });
  premiumBtn?.addEventListener('click', () => alert('Premium feature coming soon!'));
});

function revealPastLife() {
  const birthDate = document.getElementById('birth-date').value;
  const birthPlace = document.getElementById('birth-place').value || 'Unknown';
  const birthTime = document.getElementById('birth-time').value || '12:00';
  
  if (!birthDate) { alert('Please enter your birth date'); return; }
  
  const hash = hashString(birthDate + birthPlace + birthTime);
  const lifeIndex = hash % pastLives.length;
  const life = pastLives[lifeIndex];
  
  const soulAges = ['Young Soul (1-7 lives)', 'Mature Soul (8-21 lives)', 'Old Soul (22+ lives)'];
  const soulAge = soulAges[hash % 3];
  
  document.getElementById('era').textContent = life.era;
  document.getElementById('life-title').textContent = life.title;
  document.getElementById('life-description').textContent = life.description;
  document.getElementById('era-detail').textContent = life.era;
  document.getElementById('location').textContent = life.location;
  document.getElementById('soul-age').textContent = soulAge;
  document.getElementById('lesson').textContent = life.lesson;
  
  const carryList = document.getElementById('carry-list');
  carryList.innerHTML = life.traits.map(t => `<li>✨ ${t}</li>`).join('');
  
  document.getElementById('results-section').style.display = 'block';
  document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}
