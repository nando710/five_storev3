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
            <div className="bg-white/80 dark:bg-card/80 backdrop-blur-xl rounded-3xl border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden sticky top-24 transition-all duration-300">
                {/* Header */}
                <div className="px-6 py-5 border-b border-border/40 bg-muted/20">
                    <h3 className="font-urbanist font-extrabold text-sm uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                        <FolderTree size={16} className="text-primary/70" />
                        Categorias
                    </h3>
                </div>

                {/* All Products */}
                <div className="px-3 pt-3">
                    <button
                        onClick={() => onCategoryChange(null)}
                        className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${!activeCategory
                            ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30'
                            : 'text-foreground hover:bg-muted/70 hover:backdrop-blur-sm'
                            }`}
                    >
                        Todos os Produtos
                    </button>
                </div>

                {/* Accordion Categories */}
                <nav className="p-3 space-y-1">
                    {parentCategories.map(cat => {
                        const subs = getSubcategories(cat.id);
                        const isExpanded = expandedParents.has(cat.id);
                        const hasActive = isParentActive(cat.id);

                        return (
                            <div key={cat.id} className="relative">
                                {/* Parent Category Header */}
                                <div className="flex items-center group">
                                    <button
                                        onClick={() => {
                                            onCategoryChange(cat.id);
                                            if (subs.length > 0 && !isExpanded) {
                                                toggleExpand(cat.id);
                                            }
                                        }}
                                        className={`flex-1 text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${activeCategory === cat.id
                                            ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30'
                                            : hasActive
                                                ? 'text-primary bg-primary/10'
                                                : 'text-foreground/80 hover:bg-muted/70 hover:text-foreground'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>

                                    {subs.length > 0 && (
                                        <button
                                            onClick={() => toggleExpand(cat.id)}
                                            className="absolute right-2 p-2 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors z-10"
                                        >
                                            <ChevronDown
                                                size={16}
                                                className={`transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180 text-primary' : ''}`}
                                            />
                                        </button>
                                    )}
                                </div>

                                {/* Subcategories (Accordion Content) */}
                                {subs.length > 0 && (
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                                            }`}
                                    >
                                        <div className="ml-5 pl-4 border-l-2 border-primary/20 space-y-1 py-2">
                                            {subs.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => onCategoryChange(sub.id)}
                                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all duration-300 relative ${activeCategory === sub.id
                                                        ? 'text-primary font-bold bg-primary/5'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                                        }`}
                                                >
                                                    {activeCategory === sub.id && (
                                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary -ml-5" />
                                                    )}
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
