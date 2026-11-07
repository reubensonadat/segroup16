import { DropdownReact, type DropdownReactOption } from '../../src/dropdown-react';

export interface Model {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  hasUpgrade?: boolean;
}

export interface DropdownDisclosureProps {
  models?: Model[];
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  selectedModelId: string;
  onModelChange: (model: Model) => void;
}

export function DropdownDisclosure({
  models = [],
  selectedModelId,
  onModelChange,
}: DropdownDisclosureProps) {
  const options: DropdownReactOption[] = models.map((model) => ({
    value: model.id,
    label: model.name,
    icon: model.icon,
    description: model.description,
  }));

  return (
    <DropdownReact
      options={options}
      selectedValue={selectedModelId}
      onChange={(value: string) => {
        const model = models.find((item) => item.id === value);
        if (model) onModelChange(model);
      }}
    />
  );
}
