import React, { useState, useMemo } from 'react';
import { BLOG_ARTICLES, BlogArticle, BlogCategory } from '../data/blogArticles';
import { useGarden } from '../context/GardenContext';
import {
  BookOpen,
  Clock,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Tag,
  ChevronLeft,
  Share2,
  Sparkles
} from 'lucide-react';

export const BlogScreen: React.FC = () => {
  const { language } = useGarden();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<BlogArticle | null>(null);

  const categories: { id: string; labelEt: string; labelEn: string }[] = [
    { id: 'all', labelEt: 'Kõik teemad', labelEn: 'All Topics' },
    { id: 'crop_rotation', labelEt: 'Viljavaheldus', labelEn: 'Crop Rotation' },
    { id: 'soil_health', labelEt: 'Mullatervis', labelEn: 'Soil Health' },
    { id: 'climate', labelEt: 'Kliima & Öökülm', labelEn: 'Climate & Frost' },
    { id: 'ipm', labelEt: 'Taimekaitse & IPM', labelEn: 'Plant Health & IPM' }
  ];

  const filteredArticles = useMemo(() => {
    return BLOG_ARTICLES.filter((article) => {
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle =
          article.titleEt.toLowerCase().includes(query) || article.titleEn.toLowerCase().includes(query);
        const matchesSummary =
          article.summaryEt.toLowerCase().includes(query) || article.summaryEn.toLowerCase().includes(query);
        const matchesTags = article.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesSummary || matchesTags;
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div
      style={{
        padding: '24px 20px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* If reading an article */}
      {activeArticle ? (
        <article
          style={{
            backgroundColor: 'var(--kulv-surface, #FFFDF8)',
            borderRadius: '16px',
            border: '1px solid var(--kulv-border, #C9BFA9)',
            padding: '28px 32px',
            boxShadow: 'var(--kulv-shadow-card, 0 4px 20px rgba(0,0,0,0.06))'
          }}
        >
          <button
            onClick={() => setActiveArticle(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              backgroundColor: 'var(--kulv-surface-muted, #EFE6D4)',
              color: 'var(--kulv-text, #2A2E24)',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              marginBottom: '20px'
            }}
          >
            <ChevronLeft size={16} />
            <span>{language === 'en' ? 'Back to all articles' : 'Tagasi artiklite juurde'}</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              fontSize: '12px',
              color: 'var(--kulv-text-muted, #5F675A)',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--kulv-primary, #4F6B45)' }}>
              {language === 'en' ? activeArticle.categoryLabelEn : activeArticle.categoryLabelEt}
            </span>
            <span aria-hidden="true">·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> {activeArticle.readTimeMinutes} {language === 'en' ? 'min read' : 'min lugemist'}
            </span>
            <span aria-hidden="true">·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> {activeArticle.publishedDate}
            </span>
          </div>

          <h1
            className="font-serif-display"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--kulv-text, #2A2E24)',
              lineHeight: 1.25,
              margin: '0 0 16px 0'
            }}
          >
            {language === 'en' ? activeArticle.titleEn : activeArticle.titleEt}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--kulv-surface-muted, #FAF7EE)',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              marginBottom: '24px'
            }}
          >
            <ShieldCheck size={22} color="var(--kulv-primary, #4F6B45)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--kulv-primary, #3E5A35)' }}>
                {activeArticle.author} · {activeArticle.authorRole}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                {activeArticle.institutionalAffiliation}
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '15px',
              lineHeight: 1.8,
              color: 'var(--kulv-text, #2A2E24)',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              maxWidth: '720px'
            }}
          >
            {(language === 'en' ? activeArticle.contentEn : activeArticle.contentEt).map((para, i) => (
              <p key={i} style={{ margin: 0 }}>
                {para}
              </p>
            ))}
          </div>

          <div
            style={{
              marginTop: '28px',
              paddingTop: '16px',
              borderTop: '1px solid var(--kulv-border, #C9BFA9)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--kulv-text-muted, #5F675A)' }}>
              {language === 'en' ? 'Topics:' : 'Märksõnad:'}
            </span>
            {activeArticle.tags.map((tag, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '12px',
                  color: 'var(--kulv-text-muted, #5F675A)'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        </article>
      ) : (
        <>
          {/* Header & Mission */}
          <div
            style={{
              backgroundColor: 'var(--kulv-surface, #FFFDF8)',
              borderRadius: '16px',
              border: '1px solid var(--kulv-border, #C9BFA9)',
              padding: '24px 28px',
              boxShadow: 'var(--kulv-shadow-card, 0 4px 16px rgba(0,0,0,0.05))'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <BookOpen size={24} color="var(--kulv-primary, #4F6B45)" />
              <h1
                className="font-serif-display"
                style={{ margin: 0, fontSize: '26px', fontWeight: 700, color: 'var(--kulv-text, #2A2E24)' }}
              >
                {language === 'en' ? 'Nordic Agro-Science Blog' : 'Põhjamaine Aiandusblogi & Teadus'}
              </h1>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: '14px',
                color: 'var(--kulv-text-muted, #5F675A)',
                maxWidth: '750px',
                lineHeight: 1.5
              }}
            >
              {language === 'en'
                ? 'Evidence-based agronomic insights, soil biology research, and pest deterrence mechanisms tailored specifically to cold temperate Nordic climates (Zones 4–6).'
                : 'Teaduspõhised aiandusartiklid, mullabioloogia uuringud ja kahjuritõrje mehhanismid kohandatud spetsiaalselt Põhjamaade ja Eesti kliimasse (tsoonid 4–6). Ei mingeid kontrollimata aiandusmüüte.'}
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {/* Category pills */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: isSelected
                        ? '1px solid var(--kulv-primary, #4F6B45)'
                        : '1px solid var(--kulv-border, #C9BFA9)',
                      backgroundColor: isSelected ? 'var(--kulv-primary, #4F6B45)' : 'var(--kulv-surface, #FFFDF8)',
                      color: isSelected ? '#FFFFFF' : 'var(--kulv-text, #2A2E24)',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {language === 'en' ? cat.labelEn : cat.labelEt}
                  </button>
                );
              })}
            </div>

            {/* Search input */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                border: '1px solid var(--kulv-border, #C9BFA9)',
                borderRadius: '8px',
                padding: '6px 12px',
                minWidth: '240px'
              }}
            >
              <Search size={16} color="var(--kulv-text-muted, #5F675A)" />
              <input
                type="text"
                placeholder={language === 'en' ? 'Search articles, topics...' : 'Otsi artiklit, märksõna...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '12px',
                  color: 'var(--kulv-text, #2A2E24)',
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Article Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}
          >
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
                style={{
                  backgroundColor: 'var(--kulv-surface, #FFFDF8)',
                  borderRadius: '12px',
                  border: '1px solid var(--kulv-border, #C9BFA9)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--kulv-shadow-card, 0 2px 8px rgba(0,0,0,0.04))',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      fontSize: '11px',
                      color: 'var(--kulv-text-muted, #5F675A)'
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--kulv-primary, #4F6B45)' }}>
                      {language === 'en' ? article.categoryLabelEn : article.categoryLabelEt}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {article.readTimeMinutes} min
                    </span>
                  </div>

                  <h3
                    className="font-serif-display"
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: 'var(--kulv-text, #2A2E24)',
                      margin: '0 0 8px 0',
                      lineHeight: 1.3
                    }}
                  >
                    {language === 'en' ? article.titleEn : article.titleEt}
                  </h3>

                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.5,
                      color: 'var(--kulv-text-muted, #5F675A)',
                      margin: '0 0 14px 0'
                    }}
                  >
                    {language === 'en' ? article.summaryEn : article.summaryEt}
                  </p>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--kulv-text-muted, #5F675A)',
                      borderTop: '1px solid var(--kulv-border, #EAE4D5)',
                      paddingTop: '10px',
                      marginBottom: '10px'
                    }}
                  >
                    <strong>{article.author}</strong> • {article.institutionalAffiliation}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--kulv-text-muted, #5F675A)' }}>
                      {article.publishedDate}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--kulv-primary, #4F6B45)'
                      }}
                    >
                      <span>{language === 'en' ? 'Read article' : 'Loe edasi'}</span>
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
