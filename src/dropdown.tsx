import { createRoot, type Root } from 'react-dom/client';
import { DropdownReact, type DropdownReactOption } from './dropdown-react';

export type DropdownOption = DropdownReactOption;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] || char);
}

export function renderDropdown(options: DropdownOption[], selectedValue: string, attributes: string, className = ''): string {
  const selected = options.find((option) => option.value === selectedValue) || options[0];
  if (!selected) return '';
  return `
    <div class="dropdown-react-host ${className}" ${attributes}>
      <input type="hidden" value="${escapeHtml(selected.value)}" data-dropdown-value />
      <script type="application/json" data-dropdown-options>${JSON.stringify(options)}</script>
    </div>
  `;
}

export function bindDropdowns(container: HTMLElement, onChange?: (dropdown: HTMLElement, value: string) => void) {
  container.querySelectorAll<HTMLElement>('.dropdown-react-host').forEach((host) => {
    const optionsScript = host.querySelector('[data-dropdown-options]');
    const valueInput = host.querySelector<HTMLInputElement>('[data-dropdown-value]');
    if (!optionsScript || !valueInput) return;
    let options: DropdownOption[];
    try {
      options = JSON.parse(optionsScript.textContent || '[]') as DropdownOption[];
    } catch (error) {
      console.error('Dropdown options could not be loaded.', error);
      return;
    }
    optionsScript.remove();
    const root: Root = createRoot(host);
    root.render(
      <DropdownReact
        options={options}
        selectedValue={valueInput.value}
        onChange={(value) => {
          valueInput.value = value;
          onChange?.(host, value);
        }}
      />
    );
  });
}
