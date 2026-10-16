export const SEARCH_PROVIDERS = [
  { id: 'google', name: 'Google', description: 'Web search', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', description: 'Microsoft web search', url: 'https://www.bing.com/search?q=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', description: 'Private search', url: 'https://duckduckgo.com/?q=' },
  { id: 'youtube', name: 'YouTube', description: 'Videos', url: 'https://www.youtube.com/results?search_query=' },
  { id: 'chatgpt', name: 'ChatGPT', description: 'Ask AI', url: 'https://chatgpt.com/?q=' },
  { id: 'github', name: 'GitHub', description: 'Code and repositories', url: 'https://github.com/search?q=' },
];

const UNIT_GROUPS = [
  {
    units: {
      m: { aliases: ['m', 'meter', 'meters', 'metre', 'metres'], factor: 1 },
      km: { aliases: ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'], factor: 1000 },
      cm: { aliases: ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'], factor: 0.01 },
      mm: { aliases: ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'], factor: 0.001 },
      mi: { aliases: ['mi', 'mile', 'miles'], factor: 1609.344 },
      ft: { aliases: ['ft', 'foot', 'feet'], factor: 0.3048 },
      in: { aliases: ['in', 'inch', 'inches'], factor: 0.0254 },
      yd: { aliases: ['yd', 'yard', 'yards'], factor: 0.9144 },
    },
  },
  {
    units: {
      kg: { aliases: ['kg', 'kilogram', 'kilograms'], factor: 1 },
      g: { aliases: ['g', 'gram', 'grams'], factor: 0.001 },
      lb: { aliases: ['lb', 'lbs', 'pound', 'pounds'], factor: 0.45359237 },
      oz: { aliases: ['oz', 'ounce', 'ounces'], factor: 0.028349523125 },
    },
  },
  {
    units: {
      l: { aliases: ['l', 'liter', 'liters', 'litre', 'litres'], factor: 1 },
      ml: { aliases: ['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'], factor: 0.001 },
      gal: { aliases: ['gal', 'gallon', 'gallons'], factor: 3.785411784 },
      cup: { aliases: ['cup', 'cups'], factor: 0.2365882365 },
    },
  },
  {
    units: {
      s: { aliases: ['s', 'sec', 'second', 'seconds'], factor: 1 },
      min: { aliases: ['min', 'minute', 'minutes'], factor: 60 },
      h: { aliases: ['h', 'hr', 'hour', 'hours'], factor: 3600 },
      day: { aliases: ['d', 'day', 'days'], factor: 86400 },
    },
  },
];

const TEMPERATURE_UNITS = {
  c: { aliases: ['c', '°c', 'celsius', 'centigrade'], label: '°C' },
  f: { aliases: ['f', '°f', 'fahrenheit'], label: '°F' },
  k: { aliases: ['k', 'kelvin'], label: 'K' },
};

const formatNumber = (value) =>
  new Intl.NumberFormat(undefined, { maximumSignificantDigits: 7 }).format(Object.is(value, -0) ? 0 : value);

function unitByAlias(group, value) {
  return Object.entries(group.units).find(([, unit]) => unit.aliases.includes(value))?.[1];
}

function temperatureUnitByAlias(value) {
  return Object.entries(TEMPERATURE_UNITS).find(([, unit]) => unit.aliases.includes(value));
}

function toCelsius(amount, unitId) {
  if (unitId === 'f') return (amount - 32) * (5 / 9);
  if (unitId === 'k') return amount - 273.15;
  return amount;
}

function fromCelsius(amount, unitId) {
  if (unitId === 'f') return amount * (9 / 5) + 32;
  if (unitId === 'k') return amount + 273.15;
  return amount;
}

function convertTemperature(amount, from, to) {
  const celsius = toCelsius(amount, from[0]);
  const converted = fromCelsius(celsius, to[0]);
  return `${formatNumber(amount)} ${from[1].label} = ${formatNumber(converted)} ${to[1].label}`;
}

function convertStandardUnit(amount, from, to) {
  for (const group of UNIT_GROUPS) {
    const source = unitByAlias(group, from);
    const destination = unitByAlias(group, to);
    if (source && destination) {
      const baseValue = amount * source.factor;
      return `${formatNumber(amount)} ${from} = ${formatNumber(baseValue / destination.factor)} ${to}`;
    }
  }
  return null;
}

function parseConversion(query) {
  const match = query.match(/^(-?\d+(?:\.\d*)?|\.\d+)\s*([°a-z]+)\s+(?:to|in)\s+([°a-z]+)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const from = match[2].toLowerCase();
  const to = match[3].toLowerCase();
  const temperatureFrom = temperatureUnitByAlias(from);
  const temperatureTo = temperatureUnitByAlias(to);

  if (temperatureFrom && temperatureTo) return convertTemperature(amount, temperatureFrom, temperatureTo);
  return convertStandardUnit(amount, from, to);
}

function parseMath(query) {
  if (!/^[\d\s.+\-*/%^()]+$/.test(query) || !/\d/.test(query)) return null;
  const tokens = [];
  const tokenPattern = /\s*((?:\d+\.?\d*|\.\d+)|[()+\-*/^%])/y;
  let cursor = 0;
  while (cursor < query.length) {
    tokenPattern.lastIndex = cursor;
    const token = tokenPattern.exec(query);
    if (!token) return null;
    tokens.push(token[1]);
    cursor = tokenPattern.lastIndex;
  }

  let position = 0;
  const parsePrimary = () => {
    const token = tokens[position++];
    if (token === '(') {
      const value = parseExpression();
      if (tokens[position++] !== ')') throw new Error('Unbalanced parentheses');
      return value;
    }
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error('Invalid number');
    return value;
  };
  const parsePower = () => {
    const value = parsePrimary();
    if (tokens[position] === '^') {
      position += 1;
      return value ** parseUnary();
    }
    return value;
  };
  const parseUnary = () => {
    if (tokens[position] === '+') {
      position += 1;
      return parseUnary();
    }
    if (tokens[position] === '-') {
      position += 1;
      return -parseUnary();
    }
    return parsePower();
  };
  const parseTerm = () => {
    let value = parseUnary();
    while (['*', '/', '%'].includes(tokens[position])) {
      const operator = tokens[position++];
      const right = parseUnary();
      if (operator === '*') value *= right;
      else if (operator === '/') value /= right;
      else value %= right;
    }
    return value;
  };
  const parseExpression = () => {
    let value = parseTerm();
    while (['+', '-'].includes(tokens[position])) {
      const operator = tokens[position++];
      const right = parseTerm();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };

  try {
    const value = parseExpression();
    return position === tokens.length && Number.isFinite(value) ? `${query} = ${formatNumber(value)}` : null;
  } catch {
    return null;
  }
}

export function calculateLocally(query) {
  const text = query.trim();
  if (!text) return null;
  const conversion = parseConversion(text.replace(/^convert\s+/i, ''));
  if (conversion) return { label: 'Conversion', value: conversion };
  const result = parseMath(text);
  return result ? { label: 'Calculation', value: result } : null;
}

export function searchUrl(providerId, query) {
  const provider = SEARCH_PROVIDERS.find((item) => item.id === providerId) ?? SEARCH_PROVIDERS[0];
  return `${provider.url}${encodeURIComponent(query.trim())}`;
}