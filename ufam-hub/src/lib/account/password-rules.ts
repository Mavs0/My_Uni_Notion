export type PasswordRuleChecks = {
  minLen: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

export function getPasswordRuleChecks(password: string): PasswordRuleChecks {
  return {
    minLen: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9\s]/.test(password),
  };
}

export function allPasswordRulesMet(password: string): boolean {
  const c = getPasswordRuleChecks(password);
  return c.minLen && c.hasNumber && c.hasSpecial;
}

/** 1 = fraca, 2 = média, 3 = forte */
export function passwordStrengthLevel(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  const c = getPasswordRuleChecks(password);
  const n = [c.minLen, c.hasNumber, c.hasSpecial].filter(Boolean).length;
  if (n <= 1) return 1;
  if (n === 2) return 2;
  return 3;
}
