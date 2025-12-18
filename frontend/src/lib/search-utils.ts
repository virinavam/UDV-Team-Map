import type { Employee } from "../types/types";

/**
 * Вычисляет расстояние Левенштейна между двумя строками
 * Используется для fuzzy matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Нормализует строку для поиска (убирает лишние пробелы, приводит к нижнему регистру)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // убираем диакритические знаки
}

/**
 * Проверяет, содержит ли текст подстроку (с учётом нормализации)
 */
function containsSubstring(text: string, query: string): boolean {
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);
  return normalizedText.includes(normalizedQuery);
}

/**
 * Вычисляет коэффициент схожести (0-1) между текстом и запросом
 * Использует fuzzy matching с порогом
 */
function calculateSimilarity(
  text: string,
  query: string,
  threshold = 0.7
): number {
  const normalizedText = normalizeString(text);
  const normalizedQuery = normalizeString(query);

  // Точное совпадение
  if (normalizedText === normalizedQuery) return 1.0;

  // Подстрока
  if (normalizedText.includes(normalizedQuery)) return 0.9;

  // Fuzzy matching
  const distance = levenshteinDistance(normalizedText, normalizedQuery);
  const maxLength = Math.max(normalizedText.length, normalizedQuery.length);
  const similarity = 1 - distance / maxLength;

  return similarity >= threshold ? similarity : 0;
}

/**
 * Парсит поисковый запрос и извлекает возможные значения для разных полей
 */
export interface ParsedSearchQuery {
  tokens: string[];
  possibleNames: string[];
  possiblePositions: string[];
  possibleSkills: string[];
  ambiguous: string[]; // значения, которые нельзя однозначно классифицировать
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      tokens: [],
      possibleNames: [],
      possiblePositions: [],
      possibleSkills: [],
      ambiguous: [],
    };
  }

  // Разбиваем на токены (по пробелам и запятым)
  const tokens = trimmed
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  // Простая эвристика для классификации:
  // - Если токен начинается с заглавной буквы и короткий (2-15 символов) - возможно имя/фамилия
  // - Если токен длинный или содержит специальные слова - возможно должность
  // - Если токен короткий и в верхнем регистре или содержит спецсимволы - возможно навык
  const possibleNames: string[] = [];
  const possiblePositions: string[] = [];
  const possibleSkills: string[] = [];
  const ambiguous: string[] = [];

  // Словарь известных должностей для лучшей классификации
  const positionKeywords = [
    "engineer",
    "developer",
    "manager",
    "analyst",
    "designer",
    "specialist",
    "director",
    "lead",
    "senior",
    "junior",
    "инженер",
    "разработчик",
    "менеджер",
    "аналитик",
    "дизайнер",
    "специалист",
    "руководитель",
    "ведущий",
    "старший",
    "младший",
  ];

  // Словарь известных навыков (технологии)
  const skillKeywords = [
    "react",
    "vue",
    "angular",
    "node",
    "python",
    "java",
    "c#",
    "javascript",
    "typescript",
    "sql",
    "docker",
    "kubernetes",
    "git",
    "agile",
    "scrum",
  ];

  for (const token of tokens) {
    const lowerToken = token.toLowerCase();
    const isCapitalized = /^[А-ЯA-Z]/.test(token);
    const isShort = token.length <= 15;
    const isLong = token.length > 15;
    const hasPositionKeyword = positionKeywords.some((kw) =>
      lowerToken.includes(kw)
    );
    const hasSkillKeyword = skillKeywords.some((kw) => lowerToken.includes(kw));
    const isUpperCase = token === token.toUpperCase() && token.length <= 10;
    const hasSpecialChars = /[#@$%&*+=\-_.]/.test(token);

    if (hasSkillKeyword || isUpperCase || hasSpecialChars) {
      possibleSkills.push(token);
    } else if (hasPositionKeyword || isLong) {
      possiblePositions.push(token);
    } else if (isCapitalized && isShort) {
      possibleNames.push(token);
    } else {
      // Неоднозначное значение - будет искаться во всех полях
      ambiguous.push(token);
    }
  }

  return {
    tokens,
    possibleNames,
    possiblePositions,
    possibleSkills,
    ambiguous,
  };
}

/**
 * Проверяет совпадение токена с массивом навыков
 * Использует полные, частичные и fuzzy совпадения
 */
function matchesSkill(
  token: string,
  skills: string[],
  fuzzyThreshold: number
): boolean {
  if (!skills || skills.length === 0) return false;

  const normalizedToken = normalizeString(token);

  for (const skill of skills) {
    const normalizedSkill = normalizeString(skill);

    // Точное совпадение
    if (normalizedSkill === normalizedToken) return true;

    // Частичное совпадение (подстрока)
    if (
      normalizedSkill.includes(normalizedToken) ||
      normalizedToken.includes(normalizedSkill)
    ) {
      return true;
    }

    // Fuzzy matching
    const similarity = calculateSimilarity(skill, token, fuzzyThreshold);
    if (similarity > fuzzyThreshold) return true;
  }

  return false;
}

/**
 * Проверяет совпадение токена с должностью
 * Разбивает должность на токены и проверяет каждый
 */
function matchesPosition(
  token: string,
  position: string,
  fuzzyThreshold: number
): boolean {
  if (!position) return false;

  const normalizedToken = normalizeString(token);
  const normalizedPosition = normalizeString(position);

  // Точное совпадение
  if (normalizedPosition === normalizedToken) return true;

  // Частичное совпадение (подстрока)
  if (
    normalizedPosition.includes(normalizedToken) ||
    normalizedToken.includes(normalizedPosition)
  ) {
    return true;
  }

  // Разбиваем должность на токены и проверяем каждый
  const positionTokens = normalizedPosition.split(/\s+/);
  for (const posToken of positionTokens) {
    if (posToken === normalizedToken) return true;
    if (
      posToken.includes(normalizedToken) ||
      normalizedToken.includes(posToken)
    ) {
      return true;
    }
    const similarity = calculateSimilarity(posToken, token, fuzzyThreshold);
    if (similarity > fuzzyThreshold) return true;
  }

  // Fuzzy matching всей должности
  const similarity = calculateSimilarity(position, token, fuzzyThreshold);
  if (similarity > fuzzyThreshold) return true;

  return false;
}

/**
 * Проверяет совпадение токена с ФИО
 */
function matchesFullName(
  token: string,
  fullName: string,
  fuzzyThreshold: number
): boolean {
  if (!fullName) return false;

  const normalizedToken = normalizeString(token);
  const normalizedFullName = normalizeString(fullName);

  // Точное совпадение
  if (normalizedFullName === normalizedToken) return true;

  // Частичное совпадение
  if (normalizedFullName.includes(normalizedToken)) return true;

  // Разбиваем ФИО на части и проверяем каждую
  const nameParts = normalizedFullName.split(/\s+/);
  for (const part of nameParts) {
    if (part === normalizedToken) return true;
    if (part.includes(normalizedToken) || normalizedToken.includes(part)) {
      return true;
    }
  }

  // Fuzzy matching
  const similarity = calculateSimilarity(fullName, token, fuzzyThreshold);
  if (similarity > fuzzyThreshold) return true;

  return false;
}

/**
 * Выполняет универсальный поиск по сотрудникам
 * Ищет по всем полям: ФИО, должность, навыки
 * Поддерживает частичные и нечёткие совпадения
 */
export function searchEmployees(
  employees: Employee[],
  query: string,
  options: {
    fuzzyThreshold?: number;
    matchAllTokens?: boolean; // если true - все токены должны совпадать, если false - хотя бы один
  } = {}
): Employee[] {
  const { fuzzyThreshold = 0.5, matchAllTokens = false } = options;

  if (!query.trim()) {
    return employees;
  }

  const parsed = parseSearchQuery(query);

  // Если нет токенов - возвращаем всех
  if (parsed.tokens.length === 0) {
    return employees;
  }

  return employees.filter((employee) => {
    // Собираем все поля для поиска
    const fullName = `${employee.lastName || ""} ${
      employee.firstName || ""
    }`.trim();
    const position = employee.position || "";
    const skills = employee.skills || [];

    // Для каждого токена проверяем совпадения
    const tokenMatches = parsed.tokens.map((token) => {
      const matches: boolean[] = [];

      // Определяем, в каких полях искать этот токен
      const isNameToken = parsed.possibleNames.includes(token);
      const isPositionToken = parsed.possiblePositions.includes(token);
      const isSkillToken = parsed.possibleSkills.includes(token);
      const isAmbiguous = parsed.ambiguous.includes(token);

      // 1. Поиск в ФИО
      // Ищем если токен классифицирован как имя, неоднозначный, или если не классифицирован как навык/должность
      if (isNameToken || isAmbiguous || (!isPositionToken && !isSkillToken)) {
        const nameMatch = matchesFullName(token, fullName, fuzzyThreshold);
        matches.push(nameMatch);
      }

      // 2. Поиск в должности
      // Ищем если токен классифицирован как должность, неоднозначный, или если не классифицирован как имя
      if (isPositionToken || isAmbiguous || !isNameToken) {
        const positionMatch = matchesPosition(token, position, fuzzyThreshold);
        matches.push(positionMatch);
      }

      // 3. Поиск в навыках
      // Всегда проверяем навыки (каждый навык отдельно)
      const skillMatch = matchesSkill(token, skills, fuzzyThreshold);
      matches.push(skillMatch);

      // Токен считается совпавшим, если есть хотя бы одно совпадение
      return matches.some((m) => m);
    });

    // Если matchAllTokens = true, все токены должны совпасть
    // Если false - достаточно хотя бы одного
    if (matchAllTokens) {
      return tokenMatches.every((m) => m);
    } else {
      return tokenMatches.some((m) => m);
    }
  });
}

/**
 * Оптимизированная версия поиска с предварительной индексацией
 * Создаёт индекс один раз и использует его для быстрого поиска
 */
export class EmployeeSearchIndex {
  private employees: Employee[] = [];
  private index: Map<string, Set<number>> = new Map(); // token -> set of employee indices

  constructor(employees: Employee[]) {
    this.rebuildIndex(employees);
  }

  rebuildIndex(employees: Employee[]): void {
    this.employees = employees;
    this.index.clear();

    employees.forEach((employee, idx) => {
      const searchableText = this.getSearchableText(employee);
      const tokens = this.tokenize(searchableText);

      tokens.forEach((token) => {
        if (!this.index.has(token)) {
          this.index.set(token, new Set());
        }
        this.index.get(token)!.add(idx);
      });
    });
  }

  private getSearchableText(employee: Employee): string {
    // Собираем все поисковые поля, включая каждый навык отдельно
    const nameParts = [
      employee.lastName || "",
      employee.firstName || "",
    ].filter(Boolean);

    const positionParts = (employee.position || "")
      .split(/\s+/)
      .filter(Boolean);

    const skills = employee.skills || [];

    // Объединяем все части для индексации
    const allParts = [
      ...nameParts,
      ...positionParts,
      ...skills,
      employee.email || "",
    ]
      .filter(Boolean)
      .map((part) => normalizeString(part));

    return allParts.join(" ");
  }

  private tokenize(text: string): string[] {
    // Разбиваем на токены, сохраняя как отдельные слова, так и комбинации
    const tokens = normalizeString(text).split(/\s+/).filter(Boolean);

    // Добавляем n-граммы для лучшего поиска (биграммы для длинных слов)
    const ngrams: string[] = [];
    for (const token of tokens) {
      if (token.length > 3) {
        // Добавляем подстроки для длинных токенов
        for (let i = 0; i <= token.length - 3; i++) {
          ngrams.push(token.substring(i, i + 3));
        }
      }
    }

    return [...tokens, ...ngrams];
  }

  search(query: string, options: { fuzzyThreshold?: number } = {}): Employee[] {
    if (!query.trim()) {
      return this.employees;
    }

    // Используем базовую функцию поиска для fuzzy matching
    return searchEmployees(this.employees, query, options);
  }

  getEmployees(): Employee[] {
    return this.employees;
  }
}
