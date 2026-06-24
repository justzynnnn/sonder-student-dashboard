import { useEffect } from 'react';

const FIELD_SELECTOR = 'input.input, select.input, textarea.input';

function syncField(field) {
  if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
  const value = field instanceof HTMLInputElement && field.type === 'checkbox' ? field.checked : field.value;
  field.toggleAttribute('data-filled', String(value ?? '').length > 0);
}

export default function FormEffects() {
  useEffect(() => {
    const syncAll = () => document.querySelectorAll(FIELD_SELECTOR).forEach(syncField);
    const onChange = (event) => {
      if (event.target?.matches?.(FIELD_SELECTOR)) syncField(event.target);
    };

    const observer = new MutationObserver(syncAll);
    syncAll();
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('input', onChange, true);
    document.addEventListener('change', onChange, true);

    return () => {
      observer.disconnect();
      document.removeEventListener('input', onChange, true);
      document.removeEventListener('change', onChange, true);
    };
  }, []);

  return null;
}
