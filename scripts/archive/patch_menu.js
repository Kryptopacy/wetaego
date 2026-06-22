const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app', 'm', '[slug]', 'menu-renderer.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove bypass
content = content.replace(
  `/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect, @typescript-eslint/ban-ts-comment, react/no-unescaped-entities */\n// FIXME: Developer bypassed types/rules. Requires refactoring for true perfection.\n`,
  ""
);

// 2. Fix the any casts in the translation payload
const oldTranslationLogic = `      const { categories: translatedCategories } = await res.json()
      
      // Merge translated fields back into the full categories array so we don't lose prices, images, etc.
      const newCategories = initialCategories.map(cat => {
        const translatedCat = translatedCategories.find((tc: any) => tc.id === cat.id)
        if (!translatedCat) return cat
        
        return {
          ...cat,
          name: translatedCat.name || cat.name,
          menu_items: (cat.menu_items || []).map((item: any) => {
            const tItem = translatedCat.items?.find((ti: any) => ti.id === item.id)
            if (!tItem) return item
            return {
              ...item,
              name: tItem.name || item.name,
              description: tItem.description || item.description
            }
          })
        }
      })`;

const newTranslationLogic = `      type TranslatedCategory = {
        id: string;
        name?: string;
        items?: { id: string; name?: string; description?: string }[];
      };

      const { categories: translatedCategories }: { categories: TranslatedCategory[] } = await res.json()
      
      // Merge translated fields back into the full categories array so we don't lose prices, images, etc.
      const newCategories = initialCategories.map(cat => {
        const translatedCat = translatedCategories.find((tc) => tc.id === cat.id)
        if (!translatedCat) return cat
        
        return {
          ...cat,
          name: translatedCat.name || cat.name,
          menu_items: (cat.menu_items || []).map((item) => {
            const tItem = translatedCat.items?.find((ti) => ti.id === item.id)
            if (!tItem) return item
            return {
              ...item,
              name: tItem.name || item.name,
              description: tItem.description || item.description
            }
          })
        }
      })`;

content = content.replace(oldTranslationLogic, newTranslationLogic);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched menu-renderer.tsx');
