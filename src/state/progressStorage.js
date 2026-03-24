/**
 * Builds a stable user key independent from auth provider.
 * @param {Object|null} user
 * @returns {string|null}
 */
export function resolveUserProgressKey(user) {
  if (!user) {
    return null;
  }

  const candidate = user.id || user.sub || user.email || user.username || user.name;
  if (!candidate) {
    return null;
  }

  const normalized = String(candidate).toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
  return `user:${normalized}`;
}

/**
 * Returns the current storage key for a resolved user key.
 * @param {string|null} progressUserKey
 * @returns {string|null}
 */
export function getProgressStorageKey(progressUserKey) {
  return progressUserKey ? `janus_progress_${progressUserKey}` : null;
}

/**
 * Returns candidate keys for backward compatibility lookup.
 * @param {Object|null} user
 * @param {string|null} provider
 * @param {string|null} authProvider
 * @returns {string[]}
 */
export function getCandidateProgressStorageKeys(user, provider = null, authProvider = null) {
  const keys = [];
  const stable = resolveUserProgressKey(user);
  if (stable) {
    keys.push(`janus_progress_${stable}`);
  }

  if (user) {
    const candidate = user.id || user.sub || user.email || user.username || user.name;

    if (candidate) {
      const normalized = String(candidate).toLowerCase().replace(/[^a-z0-9._-]+/g, '_');
      const providerCandidates = [
        provider,
        user.provider,
        authProvider,
        'google',
        'linkedin',
        'dev',
        'local'
      ].filter(Boolean);

      providerCandidates.forEach((prefix) => {
        keys.push(`janus_progress_${prefix}:${normalized}`);
      });
    }
  }

  return [...new Set(keys)];
}
