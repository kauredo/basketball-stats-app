import { useState } from "react";
import Icon from "../Icon";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

function FAQAccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-surface-200 dark:border-surface-700 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900 rounded-lg"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-surface-900 dark:text-white pr-4">
          {item.question}
        </span>
        <span className="flex-shrink-0 text-surface-500 dark:text-surface-400">
          <Icon name={isOpen ? "chevron-up" : "chevron-down"} size={20} />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-surface-600 dark:text-surface-400 leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="divide-y divide-surface-200 dark:divide-surface-700">
      {items.map((item, index) => (
        <FAQAccordionItem
          key={index}
          item={item}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </div>
  );
}
