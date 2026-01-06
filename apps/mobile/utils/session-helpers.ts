/**
 * Helper functions for session data
 * Uses the new structured data format only
 */

/**
 * Extract subject name from session or subject object
 * @param data - Session object or subject object with name property
 * @returns Subject name
 */
export function getSubjectName(
  data: 
    | { subject?: string | { name: string; icon?: string }; name?: string; icon?: string } 
    | { name: string; icon?: string } 
    | null 
    | undefined
): string {
  if (!data) return 'Matière non spécifiée';
  
  // If it's a session object with a subject property
  if ('subject' in data && data.subject) {
    if (typeof data.subject === 'string') {
      return data.subject;
    }
    return data.subject.name || 'Matière non spécifiée';
  }
  
  // If it's a subject object with a name property
  if ('name' in data && data.name) {
    return data.name;
  }
  
  return 'Matière non spécifiée';
}

/**
 * Extract class name from session or class object
 * @param data - Session object or class object with name property
 * @returns Class name
 */
export function getClassName(
  data: 
    | { class?: { name: string } | null; name?: string } 
    | { name: string } 
    | null 
    | undefined
): string {
  if (!data) return '';
  
  // If it's a session object with a class property
  if ('class' in data && data.class) {
    return data.class.name || '';
  }
  
  // If it's a class object with a name property
  if ('name' in data && data.name) {
    return data.name;
  }
  
  return '';
}
