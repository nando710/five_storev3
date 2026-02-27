'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, FolderTree } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Category {
    id: string;
    name: string;
    parent_id: string | null;
}

interface CategorySidebarProps {
    activeCategory: string | null;
    onCategoryChange: (categoryId: string | null) => void;
}

export function CategorySidebar({ activeCategory, onCategoryChange }: CategorySidebarProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchCategories = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name', { ascending: true });
            if (!error && data) setCategories(data);
        };
        fetchCategories();
    }, []);

    const parentCategories = categories.filter(c => !c.parent_id);
    const getSubcategories = (parentId: string) => categories.filter(c => c.parent_id === parentId);

    // Auto-expand if active category is a subcategory
    useEffect(() => {
        if (activeCategory) {
            const cat = categories.find(c => c.id === activeCategory);
            if (cat?.parent_id) {
                setExpandedParents(prev => new Set(prev).add(cat.parent_id!));
            }
        }
    }, [activeCategory, categories]);

    const toggleExpand = (parentId: string) => {
        setExpandedParents(prev => {
            const next = new Set(prev);
            if (next.has(parentId)) next.delete(parentId);
            else next.add(parentId);
            return next;
        });
    };

    const isParentActive = (parentId: string) => {
        if (activeCategory === parentId) return true;
        return getSubcategories(parentId).some(s => s.id === activeCategory);
    };

    if (parentCategories.length === 0) return null;

    return (
        <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden sticky top-24">
                {/* Header */}
                <div className="px-5 py-4 border-b border-border/50 bg-muted/30">
                    <h3 className="font-urbanist font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <FolderTree size={14} />
                        Categorias
                    </h3>
                </div>

                {/* All Products */}
                <div className="px-2 pt-2">
                    <button
                        onClick={() => onCategoryChange(null)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${!activeCategory
                                ? 'bg-primary/10 text-primary'
                                : 'text-foreground hover:bg-muted'
                            }`}
                    >
                        Todos os Produtos
                    </button>
                </div>

                {/* Accordion Categories */}
                <nav className="p-2 space-y-0.5">
                    {parentCategories.map(cat => {
                        const subs = getSubcategories(cat.id);
                        const isExpanded = expandedParents.has(cat.id);
                        const hasActive = isParentActive(cat.id);

                        return (
                            <div key={cat.id}>
                                {/* Parent Category Header */}
                                <div className="flex items-center">
                                    <button
                                        onClick={() => {
                                            onCategoryChange(cat.id);
                                            if (subs.length > 0 && !isExpanded) {
                                                toggleExpand(cat.id);
                                            }
                                        }}
                                        className={`flex-1 text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeCategory === cat.id
                                                ? 'bg-primary/10 text-primary'
                                                : hasActive
                                                    ? 'text-primary'
                                                    : 'text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>

                                    {subs.length > 0 && (
                                        <button
                                            onClick={() => toggleExpand(cat.id)}
                                            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            <ChevronDown
                                                size={14}
                                                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </button>
                                    )}
                                </div>

                                {/* Subcategories (Accordion Content) */}
                                {subs.length > 0 && (
                                    <div
                                        className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                            }`}
                                    >
                                        <div className="ml-4 pl-3 border-l-2 border-border/50 space-y-0.5 py-1">
                                            {subs.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => onCategoryChange(sub.id)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeCategory === sub.id
                                                            ? 'bg-primary/10 text-primary font-medium'
                                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                                        }`}
                                                >
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
