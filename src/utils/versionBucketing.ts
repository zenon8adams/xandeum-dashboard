import { validators } from '../data/validators';

/**
 * Extracts the major.minor version from a full version string
 * Example: "0.8.1" -> "0.8", "0.7.5-beta" -> "0.7"
 */
export function extractMajorMinorVersion(version: string): string {
  const match = version.match(/^(\d+\.\d+)/);
  return match ? match[1] : version;
}

/**
 * Maps a node version to its validator bucket
 * - Minor versions (e.g., 0.8.1) map to their major version (0.8)
 * - Versions not matching any known validator go to "Custom"
 */
export function getValidatorForVersion(version: string): string {
  // Extract major.minor version (e.g., "0.8.1" becomes "0.8")
  const majorMinor = extractMajorMinorVersion(version);
  
  // Find matching validator by checking if version starts with validator version
  const matchingValidator = validators.find(v => {
    // Exact match
    if (v.version === version) return true;
    
    // Major.minor match (e.g., node "0.8.1" matches validator "0.8")
    if (v.version === majorMinor) return true;
    
    // Check if it's a trynet version starting with the same major.minor
    if (version.startsWith(v.version)) return true;
    
    return false;
  });
  
  // If no match found, return "Custom" validator
  return matchingValidator ? matchingValidator.version : 'custom';
}

/**
 * Gets the validator color for a given version
 */
export function getValidatorColor(version: string): string {
  const validatorVersion = getValidatorForVersion(version);
  const validator = validators.find(v => v.version === validatorVersion);
  return validator?.color || '#6B7280'; // Default gray for custom
}

/**
 * Gets the validator name for a given version
 */
export function getValidatorName(version: string): string {
  const validatorVersion = getValidatorForVersion(version);
  const validator = validators.find(v => v.version === validatorVersion);
  return validator?.name || 'Custom';
}
