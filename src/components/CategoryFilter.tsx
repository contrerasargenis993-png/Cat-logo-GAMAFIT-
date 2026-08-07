import React from "react";
import { Filter } from "lucide-react";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  productCounts: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  productCounts,
}) => {
  return (
    <div className="w-full py-2 overflow-x-auto no-scrollbar scroll-smooth">
      <div className="flex items-center gap-2 min-w-max px-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1 select-none">
          <Filter className="w-3.5 h-3.5 text-orange-400" />
          <span>Categorías:</span>
        </div>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = productCounts[cat] || 0;

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 select-none ${
                isSelected
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/30 border border-orange-500"
                  : "bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
