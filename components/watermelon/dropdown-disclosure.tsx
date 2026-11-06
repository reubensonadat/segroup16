import { DropdownReact, type DropdownReactOption } from '../../src/dropdown-react';

export interface Model extends DropdownReactOption {
  id: string;
  name: string;
  hasUpgrade?: boolean;
}

export interface DropdownDisclosureProps {
  models?: Model[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedModelId: string;
  onModelChange: (model: Model) => void;
}

export function DropdownDisclosure({
  models = [],
  isOpen,
  onOpenChange,
  selectedModelId,
  onModelChange,
}: DropdownDisclosureProps) {
  const options = models.map((model) => ({
    value: model.id,
    label: model.name,
    icon: model.icon,
    description: model.description,
  }));

  return (
    <DropdownReact
      options={options}
      selectedValue={selectedModelId}
      onChange={(value) => {
        const model = models.find((item) => item.id === value);
        if (model) onModelChange(model);
      }}
    />
  );
}
