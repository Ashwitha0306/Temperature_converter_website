/* ================================================
   SMART TEMPERATURE CONVERTER — script.js
   Full logic: conversion, validation, history,
   dark/light mode, quick cards, facts, animations
   ================================================ */

// ---- DOM REFS ----
const body          = document.body;
const themeToggle   = document.getElementById('themeToggle');
const tempInput     = document.getElementById('tempInput');
const fromUnit      = document.getElementById('fromUnit');
const toUnit        = document.getElementById('toUnit');
const swapBtn       = document.getElementById('swapBtn');
const convertBtn    = document.getElementById('convertBtn');
const resetBtn      = document.getElementById('resetBtn');
const errorMsg      = document.getElementById('errorMsg');
const inputUnitLabel= document.getElementById('inputUnitLabel');
const resultIdle    = document.getElementById('resultIdle');
const resultDisplay = document.getElementById('resultDisplay');
const resultFrom    = document.getElementById('resultFrom');
const resultTo      = document.getElementById('resultTo');
const resultFormula = document.getElementById('resultFormula');
const allC          = document.getElementById('allC');
const allF          = document.getElementById('allF');
const allK          = document.getElementById('allK');
const quickGrid     = document.getElementById('quickGrid');
const factsGrid     = document.getElementById('factsGrid');
const historyList   = document.getElementById('historyList');
const historyEmpty  = document.getElementById('historyEmpty');
const clearHistory  = document.getElementById('clearHistory');
const heroFill      = document.getElementById('heroFill');

// ---- UNIT SYMBOLS ----
const UNIT_SYM = { C: '°C', F: '°F', K: 'K' };
const UNIT_FULL = { C: 'Celsius', F: 'Fahrenheit', K: 'Kelvin' };

// ================================================
//  TEMPERATURE CONVERSION LOGIC
// ================================================

/**
 * Convert a value from one unit to another.
 * Returns null if conversion is invalid (e.g. below absolute zero).
 */
function convert(value, from, to) {
  if (from === to) return value;

  let celsius;

  // Step 1: Convert input to Celsius
  switch (from) {
    case 'C': celsius = value; break;
    case 'F': celsius = (value - 32) * 5 / 9; break;
    case 'K': celsius = value - 273.15; break;
  }

  // Step 2: Validate — below absolute zero is impossible
  if (celsius < -273.15) return null;

  // Step 3: Convert Celsius to target unit
  switch (to) {
    case 'C': return celsius;
    case 'F': return celsius * 9 / 5 + 32;
    case 'K': return celsius + 273.15;
  }
}

/** Get conversion formula string */
function getFormula(from, to) {
  const f = {
    'C→F': '°F = (°C × 9/5) + 32',
    'F→C': '°C = (°F − 32) × 5/9',
    'C→K': 'K = °C + 273.15',
    'K→C': '°C = K − 273.15',
    'F→K': 'K = (°F − 32) × 5/9 + 273.15',
    'K→F': '°F = (K − 273.15) × 9/5 + 32',
    'C→C': 'Same unit',
    'F→F': 'Same unit',
    'K→K': 'Same unit',
  };
  return f[`${from}→${to}`] || '';
}

/** Round to max 4 decimal places, removing trailing zeros */
function round(num) {
  return parseFloat(num.toFixed(4));
}

// ================================================
//  INPUT VALIDATION
// ================================================
function validateInput(raw, from) {
  if (raw.trim() === '') return { ok: false, msg: 'Please enter a temperature value.' };
  const val = parseFloat(raw);
  if (isNaN(val)) return { ok: false, msg: 'Invalid number. Please enter digits only.' };
  if (Math.abs(val) > 1e15) return { ok: false, msg: 'Value is too large to convert.' };

  // Check absolute zero
  let celsius;
  if (from === 'C') celsius = val;
  else if (from === 'F') celsius = (val - 32) * 5 / 9;
  else celsius = val - 273.15;

  if (celsius < -273.15 - 1e-9) return { ok: false, msg: 'Temperature below absolute zero (−273.15°C) is impossible.' };

  return { ok: true, val };
}

function showError(msg) {
  errorMsg.textContent = msg;
  tempInput.classList.add('error');
}
function clearError() {
  errorMsg.textContent = '';
  tempInput.classList.remove('error');
}

// ================================================
//  MAIN CONVERT ACTION
// ================================================
function doConvert() {
  clearError();

  const raw  = tempInput.value;
  const from = fromUnit.value;
  const to   = toUnit.value;

  const validation = validateInput(raw, from);
  if (!validation.ok) { showError(validation.msg); return; }

  const inputVal = validation.val;
  const result   = convert(inputVal, from, to);

  if (result === null) {
    showError('Result is below absolute zero — impossible temperature.');
    return;
  }

  const rounded = round(result);

  // Show result
  resultFrom.textContent    = `${round(inputVal)}${UNIT_SYM[from]}`;
  resultTo.textContent      = `${rounded}${UNIT_SYM[to]}`;
  resultFormula.textContent = getFormula(from, to);

  resultIdle.classList.add('hidden');
  resultDisplay.classList.remove('hidden');
  // Re-trigger animation
  resultDisplay.style.animation = 'none';
  requestAnimationFrame(() => { resultDisplay.style.animation = ''; });

  // Update all scales
  updateAllScales(inputVal, from);

  // Update hero thermometer fill (based on Celsius percentage 0-100)
  const celsius = from === 'C' ? inputVal : from === 'F' ? (inputVal-32)*5/9 : inputVal-273.15;
  const pct = Math.min(100, Math.max(5, ((celsius + 20) / 120) * 100));
  heroFill.style.height = pct + '%';

  // Save to history
  addHistory(`${round(inputVal)}${UNIT_SYM[from]}`, `${rounded}${UNIT_SYM[to]}`);
}

// ================================================
//  ALL SCALES UPDATE
// ================================================
function updateAllScales(value, from) {
  const c = convert(value, from, 'C');
  const f = convert(value, from, 'F');
  const k = convert(value, from, 'K');

  allC.textContent = c !== null ? round(c) : '—';
  allF.textContent = f !== null ? round(f) : '—';
  allK.textContent = k !== null ? round(k) : '—';

  // Pulse animation
  [allC, allF, allK].forEach(el => {
    el.style.animation = 'none';
    requestAnimationFrame(() => {
      el.style.animation = 'resultPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both';
    });
  });
}

// ================================================
//  UNIT LABEL UPDATE
// ================================================
function updateInputUnitLabel() {
  inputUnitLabel.textContent = UNIT_SYM[fromUnit.value];
}

// ================================================
//  SWAP UNITS
// ================================================
function swapUnits() {
  const tmp       = fromUnit.value;
  fromUnit.value  = toUnit.value;
  toUnit.value    = tmp;
  updateInputUnitLabel();
  // If we already have a result, re-convert
  if (tempInput.value.trim() !== '') doConvert();
}

// ================================================
//  RESET
// ================================================
function doReset() {
  tempInput.value = '';
  fromUnit.value  = 'C';
  toUnit.value    = 'F';
  clearError();
  updateInputUnitLabel();
  resultIdle.classList.remove('hidden');
  resultDisplay.classList.add('hidden');
  allC.textContent = '—';
  allF.textContent = '—';
  allK.textContent = '—';
  heroFill.style.height = '60%';
}

// ================================================
//  HISTORY (localStorage)
// ================================================
const HISTORY_KEY = 'thermoSync_history';

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch { return []; }
}

function saveHistory(arr) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(arr));
}

function addHistory(fromStr, toStr) {
  const arr = loadHistory();
  const entry = {
    from: fromStr,
    to:   toStr,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  arr.unshift(entry);
  const trimmed = arr.slice(0, 5);
  saveHistory(trimmed);
  renderHistory();
}

function renderHistory() {
  const arr = loadHistory();
  historyList.innerHTML = '';

  if (arr.length === 0) {
    historyEmpty.style.display = 'block';
    return;
  }
  historyEmpty.style.display = 'none';

  arr.forEach((entry, i) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.style.animationDelay = `${i * 0.05}s`;
    li.innerHTML = `
      <div class="history-entry">
        <span class="history-from">${entry.from}</span>
        <span class="history-arrow">→</span>
        <span class="history-to">${entry.to}</span>
      </div>
      <span class="history-time">${entry.time}</span>
    `;
    historyList.appendChild(li);
  });
}

function doClearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

// ================================================
//  QUICK CONVERSION CARDS
// ================================================
const QUICK_POINTS = [
  {
    name:  'Water Freezing Point',
    icon:  '❄️',
    c:     0,
    color: '#00E5FF'
  },
  {
    name:  'Room Temperature',
    icon:  '🏠',
    c:     22,
    color: '#00FFB3'
  },
  {
    name:  'Human Body Temp',
    icon:  '🧬',
    c:     37,
    color: '#FF9F00'
  },
  {
    name:  'Water Boiling Point',
    icon:  '♨️',
    c:     100,
    color: '#FF4C6A'
  },
];

function renderQuickCards() {
  QUICK_POINTS.forEach(pt => {
    const f = round(pt.c * 9/5 + 32);
    const k = round(pt.c + 273.15);

    const card = document.createElement('div');
    card.className = 'quick-card';
    card.style.setProperty('--accent-color', pt.color);
    card.innerHTML = `
      <span class="qc-icon">${pt.icon}</span>
      <div class="qc-name">${pt.name}</div>
      <div class="qc-values">
        <div class="qc-val">
          <span class="num">${pt.c}</span>
          <span class="unit">°C</span>
        </div>
        <div class="qc-val">
          <span class="num">${f}</span>
          <span class="unit">°F</span>
        </div>
        <div class="qc-val">
          <span class="num">${k}</span>
          <span class="unit">K</span>
        </div>
      </div>
    `;
    // Click to populate converter
    card.addEventListener('click', () => {
      tempInput.value  = pt.c;
      fromUnit.value   = 'C';
      toUnit.value     = 'F';
      updateInputUnitLabel();
      doConvert();
      document.getElementById('converter').scrollIntoView({ behavior: 'smooth' });
    });
    quickGrid.appendChild(card);
  });
}

// ================================================
//  TEMPERATURE FACTS
// ================================================
const FACTS = [
  {
    icon:  '❄️',
    title: 'Absolute Zero',
    text:  'The coldest possible temperature in the universe',
    highlight: '−273.15°C / −459.67°F / 0 K'
  },
  {
    icon:  '💧',
    title: 'Water Freezes',
    text:  'Water transitions from liquid to solid state',
    highlight: '0°C / 32°F / 273.15 K'
  },
  {
    icon:  '♨️',
    title: 'Water Boils',
    text:  'Water transitions from liquid to gas (at sea level)',
    highlight: '100°C / 212°F / 373.15 K'
  },
  {
    icon:  '🧬',
    title: 'Human Body',
    text:  'Average normal human body temperature',
    highlight: '37°C / 98.6°F / 310.15 K'
  },
  {
    icon:  '🌞',
    title: 'Surface of Sun',
    text:  'The temperature at the visible surface of our star',
    highlight: '5,505°C / 9,941°F / 5,778 K'
  },
  {
    icon:  '🔬',
    title: 'Equal Point',
    text:  'The only temperature where °C and °F are the same',
    highlight: '−40°C = −40°F'
  },
  {
    icon:  '🌌',
    title: 'Cosmic Background',
    text:  'Temperature of the universe far from stars',
    highlight: '−270.45°C / 2.7 K'
  },
  {
    icon:  '⚡',
    title: 'Lightning Bolt',
    text:  'A lightning channel is hotter than the sun\'s surface',
    highlight: '~30,000°C / 54,032°F'
  },
];

function renderFacts() {
  FACTS.forEach((f, i) => {
    const card = document.createElement('div');
    card.className = 'fact-card glass-card fade-in-up';
    card.style.animationDelay = `${i * 0.08}s`;
    card.innerHTML = `
      <span class="fact-icon">${f.icon}</span>
      <div class="fact-title">${f.title}</div>
      <div class="fact-text">${f.text}</div>
      <div class="fact-highlight">${f.highlight}</div>
    `;
    factsGrid.appendChild(card);
  });
}

// ================================================
//  DARK / LIGHT THEME
// ================================================
function applyTheme(theme) {
  body.setAttribute('data-theme', theme);
  localStorage.setItem('thermoSync_theme', theme);
}

function loadTheme() {
  const saved = localStorage.getItem('thermoSync_theme');
  applyTheme(saved || 'dark');
}

function toggleTheme() {
  const current = body.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ================================================
//  REAL-TIME CONVERSION (on input)
// ================================================
let debounceTimer;
function onInputChange() {
  clearTimeout(debounceTimer);
  clearError();
  debounceTimer = setTimeout(() => {
    if (tempInput.value.trim() !== '') doConvert();
  }, 400);
}

// ================================================
//  INTERSECTION OBSERVER (scroll animations)
// ================================================
function initScrollAnimations() {
  const sections = document.querySelectorAll('.section');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  sections.forEach(sec => {
    sec.style.opacity = '0';
    sec.style.transform = 'translateY(30px)';
    sec.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(sec);
  });
}

// ================================================
//  INIT
// ================================================
function init() {
  // Theme
  loadTheme();
  themeToggle.addEventListener('click', toggleTheme);

  // Converter events
  convertBtn.addEventListener('click', doConvert);
  resetBtn.addEventListener('click', doReset);
  swapBtn.addEventListener('click', swapUnits);

  // Unit change updates label
  fromUnit.addEventListener('change', () => {
    updateInputUnitLabel();
    if (tempInput.value.trim() !== '') doConvert();
  });
  toUnit.addEventListener('change', () => {
    if (tempInput.value.trim() !== '') doConvert();
  });

  // Real-time typing
  tempInput.addEventListener('input', onInputChange);

  // Enter key
  tempInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doConvert();
  });

  // History
  clearHistory.addEventListener('click', doClearHistory);
  renderHistory();

  // Quick cards & facts
  renderQuickCards();
  renderFacts();

  // Scroll animations
  initScrollAnimations();

  // Initial label
  updateInputUnitLabel();
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
